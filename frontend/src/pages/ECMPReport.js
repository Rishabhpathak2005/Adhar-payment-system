import { useState } from 'react';
import axios from 'axios';
import { Upload, FileArchive, Loader, CheckCircle, XCircle, FileText, AlertTriangle, CreditCard, Wallet } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const BYTES_TO_KB = 1024; // Convert bytes to kilobytes

export default function ECMPReport({ user }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        setError('Please select a ZIP file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_type', 'ECMP');

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/reports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setResult(response.data.report);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      // Check if it's a serial validation error
      if (err.response?.data?.detail?.errors) {
        setValidationErrors(err.response.data.detail.errors);
        setError('Serial number validation failed. Report rejected.');
      } else if (typeof err.response?.data?.detail === 'object') {
        setError(err.response.data.detail.message || 'Error uploading report.');
        setValidationErrors(err.response.data.detail.errors || []);
      } else {
        setError(err.response?.data?.detail || 'Error uploading report. Please try again.');
      }
    } finally {
      setUploading(false);
      setTimeout(() => setProcessing(false), 1000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile);
      setError('');
      setResult(null);
    } else {
      setError('Please drop a ZIP file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleMakePayment = async () => {
    if (!result || !result.id) {
      setError('No report to pay for');
      return;
    }

    if (result.payment_status === 'paid') {
      setError('Report already paid');
      return;
    }

    setPaymentProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/reports/${result.id}/payment`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update result with payment info
      setResult({
        ...result,
        payment_status: 'paid',
        payment_id: response.data.payment_id,
        paid_at: new Date().toISOString()
      });
      
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error processing payment. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">ECMP Report</h2>
        <p className="text-blue-100">Upload ECMP EOD ZIP file with serial number validation</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          Upload EOD ZIP File
        </h3>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50"
          onClick={() => document.getElementById('file-input').click()}
        >
          <FileArchive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {file ? file.name : 'Click to select or drag & drop your ZIP file'}
          </p>
          <p className="text-sm text-gray-500">
            Password protected ZIP files are supported (password: 123)
          </p>
          <input
            id="file-input"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected File Info */}
        {file && (
          <div className="mt-4 flex items-center justify-between bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / BYTES_TO_KB).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.value = '';
              }}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-lg mb-2">{error}</p>
                {validationErrors.length > 0 && (
                  <div className="mt-3 bg-red-100 border border-red-200 rounded-lg p-4">
                    <p className="font-medium mb-2">Serial Number Issues:</p>
                    <ul className="space-y-1 text-sm">
                      {validationErrors.map((err) => (
                        <li key={err} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-3 text-sm font-medium text-red-600">
                  ⚠️ Please fix the serial number issues and upload again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading & Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Report
            </>
          )}
        </button>
      </div>

      {/* Processing Indicator */}
      {processing && !result && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin" />
            <div>
              <p className="font-semibold">Processing Report...</p>
              <p className="text-sm">Please wait while your report is being processed</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">ECMP Report Uploaded Successfully!</p>
              <p className="text-sm">Date: {result.report_date}</p>
              {result.payment_status === 'paid' && (
                <p className="text-sm font-medium text-green-700 mt-1">
                  ℹ️ Payment already completed for this date
                </p>
              )}
            </div>
          </div>

          {/* Serial Number Validation */}
          {result.serial_validation && (
            <div className={`border px-6 py-4 rounded-xl ${
              result.serial_validation.is_valid
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-start gap-3">
                {result.serial_validation.is_valid ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    Serial Number Validation {result.serial_validation.is_valid ? 'Passed' : 'Issues Found'}
                  </p>
                  
                  {result.serial_validation.errors && result.serial_validation.errors.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Errors:</p>
                      <ul className="text-sm space-y-1">
                        {result.serial_validation.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.serial_validation.warnings && result.serial_validation.warnings.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Warnings:</p>
                      <ul className="text-sm space-y-1">
                        {result.serial_validation.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.serial_validation.is_valid && (
                    <p className="text-sm">All serial numbers are in correct order (bottom to top ascending)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enrollment Type Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Enrollment */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">NEW ENROLMENT</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{result.new_enrollment_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Amount</p>
                    <p className="text-xl font-bold text-blue-900">₹{result.new_enrollment_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Mandatory Biometric */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">MANDATORY BIOMETRIC</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{result.mandatory_bio_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-700">Amount</p>
                    <p className="text-xl font-bold text-purple-900">₹{result.mandatory_bio_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Demographic Update */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 font-medium">DEMOGRAPHIC UPDATE</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{result.demographic_update_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700">Amount</p>
                    <p className="text-xl font-bold text-green-900">₹{result.demographic_update_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Biometric Update */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">BIOMETRIC UPDATE</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">{result.biometric_update_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-orange-700">Amount</p>
                    <p className="text-xl font-bold text-orange-900">₹{result.biometric_update_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Summary Table */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Total Enrollments</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">{result.report_date}</td>
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-indigo-600">{result.total_count}</td>
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-green-600">₹{result.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Operator Details */}
          {result.operator_id && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operator Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Operator ID:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.operator_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Registrar:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.registrar}</span>
                </div>
                <div>
                  <span className="text-gray-600">Enrolment Agency:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.enrolment_agency}</span>
                </div>
                <div>
                  <span className="text-gray-600">Station ID:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.station_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-green-600" />
                  Payment
                </h3>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-green-700">
                    Total Amount: ₹{result.total_amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {' '}
                    <span className={`font-semibold ${
                      result.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {result.payment_status === 'paid' ? '✓ Paid' : 'Pending Payment'}
                    </span>
                  </p>
                </div>
              </div>
              
              {result.payment_status !== 'paid' && (
                <button
                  onClick={handleMakePayment}
                  disabled={paymentProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Make Payment
                    </>
                  )}
                </button>
              )}

              {result.payment_status === 'paid' && (
                <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Payment Completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Success Message */}
          {paymentSuccess && (
            <div className="bg-green-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle className="w-7 h-7" />
              <div>
                <p className="font-bold text-lg">Payment Successful!</p>
                <p className="text-sm">Amount ₹{result.total_amount.toFixed(2)} has been deducted from your wallet.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
