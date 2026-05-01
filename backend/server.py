from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, EmailStr
import os
import logging
import uuid
import zipfile
import io
import tempfile
from pathlib import Path
from bs4 import BeautifulSoup
import qrcode
import base64
# ==================== BASIC SETUP ====================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
SECRET_KEY = os.getenv("SECRET_KEY", "anything123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

if not MONGO_URL:
    raise RuntimeError("MONGO_URL environment variable is missing")

if not DB_NAME:
    raise RuntimeError("DB_NAME environment variable is missing")

# FastAPI app
app = FastAPI(title="UIDAI Staff Management System")
api_router = APIRouter(prefix="/api")

# CORS
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "https://uidai-mks-admin.onrender.com,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uidai-mks-admin.onrender.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Security
security = HTTPBearer()

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    name: str
    email: Optional[EmailStr] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


class UserCreate(BaseModel):
    staff_id: str
    name: str
    password: str
    email: Optional[EmailStr] = None


class UserLogin(BaseModel):
    staff_id: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class ReportSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    report_date: str
    report_type: str = "ECMP"

    operator_id: str = ""
    registrar: str = ""
    enrolment_agency: str = ""
    station_id: str = ""

    new_enrollment_count: int = 0
    mandatory_bio_count: int = 0
    demographic_update_count: int = 0
    biometric_update_count: int = 0
    total_count: int = 0

    new_enrollment_amount: float = 0.0
    mandatory_bio_amount: float = 0.0
    demographic_update_amount: float = 0.0
    biometric_update_amount: float = 0.0
    total_amount: float = 0.0

    records: List[Dict[str, Any]] = []
    serial_validation: Dict[str, Any] = {}

    payment_status: str = "pending"
    payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None

    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "uploaded"


class WalletTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    amount: float
    description: str
    balance_after: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "completed"


class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    balance: float = 0.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NonWorkingDayRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    reason: str = ""
    file_path: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AddFundsRequest(BaseModel):
    amount: float
    transaction_id: str = ""


# ==================== AUTH UTILITIES ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    return password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    return User(**user_doc)


# ==================== HTML PARSING UTILITIES ====================

def validate_serial_numbers(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    validation = {
        "is_valid": True,
        "errors": [],
        "warnings": [],
        "serial_numbers": []
    }

    if not records:
        return validation

    serial_numbers = []

    for idx, record in enumerate(records):
        enrolment_no = record.get("enrolment_no", "")
        if len(enrolment_no) >= 15:
            try:
                serial_str = enrolment_no[9:14]
                serial_num = int(serial_str)
                serial_numbers.append({
                    "index": idx + 1,
                    "serial": serial_num,
                    "enrolment_no": enrolment_no
                })
            except (ValueError, IndexError):
                validation["warnings"].append(
                    f"Row {idx + 1}: Could not extract serial number"
                )

    validation["serial_numbers"] = serial_numbers

    if len(serial_numbers) < 2:
        return validation

    for i in range(len(serial_numbers) - 1):
        current = serial_numbers[i]["serial"]
        next_serial = serial_numbers[i + 1]["serial"]

        if current <= next_serial:
            validation["is_valid"] = False
            validation["errors"].append(
                f"Serial number order issue at row {serial_numbers[i]['index']}: "
                f"{current} should be greater than {next_serial}"
            )

        if current - next_serial != 1:
            validation["warnings"].append(
                f"Gap in serial numbers between row {serial_numbers[i]['index']} "
                f"({current}) and row {serial_numbers[i + 1]['index']} ({next_serial})"
            )

    serials_list = [s["serial"] for s in serial_numbers]
    duplicates = [s for s in set(serials_list) if serials_list.count(s) > 1]
    if duplicates:
        validation["is_valid"] = False
        validation["errors"].append(f"Duplicate serial numbers found: {duplicates}")

    return validation


def parse_html_report(html_content: str, report_type: str = "ECMP") -> Dict[str, Any]:
    soup = BeautifulSoup(html_content, "html.parser")

    summary = {
        "operator_id": "",
        "registrar": "",
        "enrolment_agency": "",
        "station_id": "",
        "report_date": "",
        "new_enrollment_count": 0,
        "mandatory_bio_count": 0,
        "demographic_update_count": 0,
        "biometric_update_count": 0,
        "total_count": 0,
        "new_enrollment_amount": 0.0,
        "mandatory_bio_amount": 0.0,
        "demographic_update_amount": 0.0,
        "biometric_update_amount": 0.0,
        "total_amount": 0.0,
        "records": [],
        "serial_validation": {}
    }

    enrollment_type = "E" if report_type == "ECMP" else "N"

    first_view = soup.find("div", class_="first_view")
    if first_view:
        rows = first_view.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) == 2:
                label = cells[0].get_text(strip=True).lower()
                value = cells[1].get_text(strip=True)
                if "operator" in label:
                    summary["operator_id"] = value
                elif "registrar" in label:
                    summary["registrar"] = value
                elif "enrolment agency" in label:
                    summary["enrolment_agency"] = value
                elif "station" in label:
                    summary["station_id"] = value

    pick_date = soup.find("div", class_="pick_date")
    if pick_date:
        h3 = pick_date.find("h3")
        if h3:
            text = h3.get_text()
            parts = text.split(":")
            if len(parts) > 1:
                dates = parts[1].strip().split(" to ")
                if dates:
                    summary["report_date"] = dates[0].strip()

    details_table = soup.find("div", class_="details_view")
    if details_table:
        table = details_table.find("table")
        if table:
            tbody = table.find("tbody")
            if tbody:
                rows = tbody.find_all("tr")
                for row in rows:
                    cells = row.find_all("td")
                    if len(cells) >= 19:
                        amount_text = cells[18].get_text(strip=True) or "0"
                        try:
                            amount_val = float(amount_text)
                        except ValueError:
                            amount_val = 0.0

                        record = {
                            "sno": cells[0].get_text(strip=True),
                            "enrolment_no": cells[1].get_text(strip=True),
                            "type": cells[3].get_text(strip=True),
                            "mandatory_bio": cells[4].get_text(strip=True),
                            "resident": cells[11].get_text(strip=True),
                            "total_amount": amount_val
                        }

                        summary["records"].append(record)

                        record_type = record["type"].upper()
                        mandatory_bio = record["mandatory_bio"].lower()
                        amount = record["total_amount"]

                        if record_type == enrollment_type:
                            summary["new_enrollment_count"] += 1
                            summary["new_enrollment_amount"] += amount
                        elif record_type == "U":
                            if "yes" in mandatory_bio:
                                summary["mandatory_bio_count"] += 1
                                summary["mandatory_bio_amount"] = 0.0
                            elif amount == 75.0:
                                summary["demographic_update_count"] += 1
                                summary["demographic_update_amount"] += amount
                            elif amount == 125.0:
                                summary["biometric_update_count"] += 1
                                summary["biometric_update_amount"] += amount

                        summary["total_count"] += 1

    summary["total_amount"] = (
        summary["new_enrollment_amount"] +
        summary["demographic_update_amount"] +
        summary["biometric_update_amount"]
    )

    if report_type == "ECMP":
        summary["serial_validation"] = validate_serial_numbers(summary["records"])

    return summary

# ==================== ADMIN USER CRUD ROUTES ====================

ADMIN_ID = "admin123"
ADMIN_PASSWORD = "1234"

@api_router.post("/admin/login")
async def admin_login(user_data: UserLogin):
    if user_data.staff_id != ADMIN_ID or user_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin ID or password")

    existing = await db.users.find_one({"staff_id": ADMIN_ID}, {"_id": 0})

    if not existing:
        user = User(
            staff_id=ADMIN_ID,
            name="Super Admin",
            email="admin@test.com",
            is_active=True
        )

        user_doc = user.model_dump()
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        user_doc["hashed_password"] = ADMIN_PASSWORD

        await db.users.insert_one(user_doc)
        existing = user_doc

        wallet = Wallet(user_id=user.id)
        wallet_doc = wallet.model_dump()
        wallet_doc["updated_at"] = wallet_doc["updated_at"].isoformat()
        await db.wallets.insert_one(wallet_doc)

    access_token = create_access_token(data={"sub": existing["id"]})

    if isinstance(existing.get("created_at"), str):
        existing["created_at"] = datetime.fromisoformat(existing["created_at"])

    existing.pop("hashed_password", None)
    user = User(**existing)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
    
   def require_admin(current_user: User):
    if current_user.staff_id != "admin123":
        raise HTTPException(status_code=403, detail="Admin access required")
class AdminUserUpdate(BaseModel):
    staff_id: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


@api_router.get("/admin/users")
async def admin_get_users(current_user: User = Depends(get_current_user)):
    require_admin(current_user)

    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).to_list(1000)
    return users


@api_router.post("/admin/users")
async def admin_create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    existing = await db.users.find_one({"staff_id": user_data.staff_id})
    if existing:
        raise HTTPException(status_code=400, detail="Staff ID already exists")

    user = User(
        staff_id=user_data.staff_id,
        name=user_data.name,
        email=user_data.email,
        is_active=True
    )

    user_doc = user.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    user_doc["hashed_password"] = get_password_hash(user_data.password)

    await db.users.insert_one(user_doc)

    wallet = Wallet(user_id=user.id)
    wallet_doc = wallet.model_dump()
    wallet_doc["updated_at"] = wallet_doc["updated_at"].isoformat()
    await db.wallets.insert_one(wallet_doc)

    return {
        "success": True,
        "message": "User created successfully",
        "user": user
    }


@api_router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    data: AdminUserUpdate,
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_none=True)

    if "staff_id" in update_data:
        existing = await db.users.find_one({
            "staff_id": update_data["staff_id"],
            "id": {"$ne": user_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Staff ID already used by another user")

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )

    updated_user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "hashed_password": 0}
    )

    return {
        "success": True,
        "message": "User updated successfully",
        "user": updated_user
    }


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.delete_one({"id": user_id})
    await db.wallets.delete_many({"user_id": user_id})
    await db.wallet_transactions.delete_many({"user_id": user_id})
    await db.reports.delete_many({"user_id": user_id})
    await db.requests.delete_many({"user_id": user_id})

    return {
        "success": True,
        "message": "User deleted successfully"
    }
# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    existing = await db.users.find_one({"staff_id": user_data.staff_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Staff ID already registered")

    hashed_password = get_password_hash(user_data.password)
    user = User(
        staff_id=user_data.staff_id,
        name=user_data.name,
        email=user_data.email
    )

    user_doc = user.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    user_doc["hashed_password"] = hashed_password

    await db.users.insert_one(user_doc)

    wallet = Wallet(user_id=user.id)
    wallet_doc = wallet.model_dump()
    wallet_doc["updated_at"] = wallet_doc["updated_at"].isoformat()
    await db.wallets.insert_one(wallet_doc)

    return user


@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"staff_id": user_data.staff_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account is inactive")

    access_token = create_access_token(data={"sub": user_doc["id"]})

    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])

    user_doc.pop("hashed_password", None)
    user = User(**user_doc)

    return Token(access_token=access_token, token_type="bearer", user=user)


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ==================== REPORT ROUTES ====================

@api_router.post("/reports/upload")
async def upload_report(
    file: UploadFile = File(...),
    report_type: str = Form("ECMP"),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")

    if report_type not in ["ECMP", "UC"]:
        raise HTTPException(status_code=400, detail="Report type must be ECMP or UC")

    try:
        zip_content = await file.read()

        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, "report.zip")

            with open(zip_path, "wb") as f:
                f.write(zip_content)

            with zipfile.ZipFile(zip_path) as zf:
                zf.setpassword(b"123")
                zf.extractall(temp_dir)

            html_files = [f for f in os.listdir(temp_dir) if f.endswith(".html")]
            if not html_files:
                raise HTTPException(status_code=400, detail="No HTML file found in ZIP")

            html_path = os.path.join(temp_dir, html_files[0])

            with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            parsed_data = parse_html_report(html_content, report_type)

            if report_type == "ECMP":
                serial_validation = parsed_data.get("serial_validation", {})
                if not serial_validation.get("is_valid", True):
                    errors = serial_validation.get("errors", [])
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "message": "Serial number validation failed",
                            "errors": errors,
                            "serial_validation": serial_validation
                        }
                    )

            report_date = parsed_data.get("report_date", "")
            existing_paid_report = await db.reports.find_one({
                "user_id": current_user.id,
                "report_date": report_date,
                "report_type": report_type,
                "payment_status": "paid"
            })

            payment_status = "pending"
            payment_id = None
            paid_at = None

            if existing_paid_report:
                payment_status = "paid"
                payment_id = existing_paid_report.get("payment_id")
                paid_at = existing_paid_report.get("paid_at")

            report = ReportSummary(
                user_id=current_user.id,
                date=datetime.now(timezone.utc).strftime("%d/%m/%Y"),
                report_type=report_type,
                payment_status=payment_status,
                payment_id=payment_id,
                paid_at=datetime.fromisoformat(paid_at) if paid_at else None,
                **parsed_data
            )

            report_doc = report.model_dump()
            report_doc["uploaded_at"] = report_doc["uploaded_at"].isoformat()
            if report_doc.get("paid_at"):
                report_doc["paid_at"] = report_doc["paid_at"].isoformat()

            await db.reports.insert_one(report_doc)

            message = f"{report_type} report uploaded and processed successfully"
            if payment_status == "paid":
                message += " (Payment already completed for this date)"

            return {
                "success": True,
                "message": message,
                "report": report,
                "already_paid": payment_status == "paid"
            }

    except HTTPException:
        raise
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file or wrong password")
    except Exception as e:
        logger.exception("Error processing report")
        raise HTTPException(status_code=500, detail=f"Error processing report: {str(e)}")


@api_router.get("/reports")
async def get_reports(current_user: User = Depends(get_current_user)):
    reports = await db.reports.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("uploaded_at", -1).to_list(1000)

    for report in reports:
        if isinstance(report.get("uploaded_at"), str):
            report["uploaded_at"] = datetime.fromisoformat(report["uploaded_at"])

    return reports


@api_router.get("/reports/{date}")
async def get_report_by_date(date: str, current_user: User = Depends(get_current_user)):
    report = await db.reports.find_one(
        {"user_id": current_user.id, "report_date": date},
        {"_id": 0}
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this date")

    if isinstance(report.get("uploaded_at"), str):
        report["uploaded_at"] = datetime.fromisoformat(report["uploaded_at"])

    return report


@api_router.get("/missing-eod")
async def get_missing_eod(current_user: User = Depends(get_current_user)):
    reports = await db.reports.find(
        {"user_id": current_user.id},
        {"_id": 0, "report_date": 1, "report_type": 1}
    ).to_list(1000)

    ecmp_dates = {report["report_date"] for report in reports if report.get("report_type") == "ECMP"}
    uc_dates = {report["report_date"] for report in reports if report.get("report_type") == "UC"}

    from datetime import timedelta
    missing_ecmp = []
    missing_uc = []
    today = datetime.now(timezone.utc)

    for i in range(30):
        check_date = today - timedelta(days=i)
        date_str = check_date.strftime("%d/%m/%Y")

        if check_date.weekday() != 6:
            if date_str not in ecmp_dates:
                missing_ecmp.append({
                    "date": date_str,
                    "type": "ECMP",
                    "status": "NOT-Uploaded"
                })

            if date_str not in uc_dates:
                missing_uc.append({
                    "date": date_str,
                    "type": "UC",
                    "status": "NOT-Uploaded"
                })

    return {
        "ecmp": missing_ecmp,
        "uc": missing_uc,
        "total_missing": len(missing_ecmp) + len(missing_uc)
    }


@api_router.post("/reports/{report_id}/payment")
async def make_report_payment(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    report = await db.reports.find_one(
        {"id": report_id, "user_id": current_user.id},
        {"_id": 0}
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Report already paid")

    amount = report.get("total_amount", 0.0)

    wallet = await db.wallets.find_one({"user_id": current_user.id})

    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    current_balance = wallet.get("balance", 0.0)

    if amount > 0 and current_balance < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Required: ₹{amount}, Available: ₹{current_balance}"
        )

    new_balance = current_balance - amount

    await db.wallets.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    payment_id = str(uuid.uuid4())
    transaction = WalletTransaction(
        user_id=current_user.id,
        type="debit",
        amount=amount,
        description=f"Payment for {report.get('report_type', 'EOD')} report - {report.get('report_date', '')}",
        balance_after=new_balance,
        status="completed"
    )

    txn_doc = transaction.model_dump()
    txn_doc["created_at"] = txn_doc["created_at"].isoformat()
    await db.wallet_transactions.insert_one(txn_doc)

    paid_at = datetime.now(timezone.utc)
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {
            "payment_status": "paid",
            "payment_id": payment_id,
            "paid_at": paid_at.isoformat()
        }}
    )

    return {
        "success": True,
        "message": "Payment successful",
        "amount": amount,
        "new_balance": new_balance,
        "payment_id": payment_id,
        "transaction": transaction
    }


# ==================== WALLET ROUTES ====================

@api_router.get("/wallet/balance")
async def get_wallet_balance(current_user: User = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"user_id": current_user.id}, {"_id": 0})

    if not wallet:
        new_wallet = Wallet(user_id=current_user.id)
        wallet_doc = new_wallet.model_dump()
        wallet_doc["updated_at"] = wallet_doc["updated_at"].isoformat()
        await db.wallets.insert_one(wallet_doc)
        wallet = wallet_doc

    return {"balance": wallet.get("balance", 0.0)}


@api_router.get("/wallet/history")
async def get_wallet_history(current_user: User = Depends(get_current_user)):
    transactions = await db.wallet_transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    for txn in transactions:
        if isinstance(txn.get("created_at"), str):
            txn["created_at"] = datetime.fromisoformat(txn["created_at"])

    return transactions


@api_router.post("/wallet/generate-qr")
async def generate_payment_qr(
    amount: float,
    current_user: User = Depends(get_current_user)
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    upi_id = "7368087310@ybl"
    upi_string = f"upi://pay?pa={upi_id}&pn=UIDAI%20Staff&am={amount}&cu=INR"

    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(upi_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "qr_code": f"data:image/png;base64,{img_str}",
        "upi_id": upi_id,
        "amount": amount
    }


@api_router.post("/wallet/add-funds")
async def add_funds(
    request: AddFundsRequest,
    current_user: User = Depends(get_current_user)
):
    amount = request.amount
    transaction_id = request.transaction_id

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = await db.wallets.find_one({"user_id": current_user.id})

    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    new_balance = wallet.get("balance", 0.0) + amount

    await db.wallets.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "balance": new_balance,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    transaction = WalletTransaction(
        user_id=current_user.id,
        type="credit",
        amount=amount,
        description=f"Added funds via UPI (Txn: {transaction_id})",
        balance_after=new_balance
    )

    txn_doc = transaction.model_dump()
    txn_doc["created_at"] = txn_doc["created_at"].isoformat()
    await db.wallet_transactions.insert_one(txn_doc)

    return {
        "success": True,
        "new_balance": new_balance,
        "transaction": transaction
    }


# ==================== REQUEST ROUTES ====================

@api_router.post("/requests/submit")
async def submit_request(
    date: str = Form(...),
    reason: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    file_path = None

    if file:
        await file.read()
        file_path = f"uploads/{current_user.id}/{file.filename}"

    request_obj = NonWorkingDayRequest(
        user_id=current_user.id,
        date=date,
        reason=reason,
        file_path=file_path
    )

    request_doc = request_obj.model_dump()
    request_doc["created_at"] = request_doc["created_at"].isoformat()

    await db.requests.insert_one(request_doc)

    return {
        "success": True,
        "message": "Request submitted successfully",
        "request": request_obj
    }


@api_router.get("/requests")
async def get_requests(current_user: User = Depends(get_current_user)):
    requests = await db.requests.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    for req in requests:
        if isinstance(req.get("created_at"), str):
            req["created_at"] = datetime.fromisoformat(req["created_at"])

    return requests


# ==================== BASIC ROUTES ====================

@app.get("/")
async def app_root():
    return {"message": "UIDAI Staff Management System API", "version": "1.0.0"}

@api_router.get("/")
async def api_root():
    return {"message": "UIDAI Staff Management System API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# Include router
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
