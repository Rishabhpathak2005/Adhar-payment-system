import React, { useMemo, useState } from 'react';
import { LayoutDashboard, Users, FileText, Wallet, Settings, Bell, Search, Upload, Plus, Download, CreditCard, UserCircle2, LogOut, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

const stats = [
  { title: 'Total Users', value: '1,284', change: '+12%', icon: Users },
  { title: 'Today Reports', value: '86', change: '+8%', icon: FileText },
  { title: 'Wallet Balance', value: '₹58,240', change: '+19%', icon: Wallet },
  { title: 'Pending Requests', value: '14', change: '-3%', icon: Bell },
];

const usersSeed = [
  { id: 1, name: 'Rishabh Pathak', role: 'Admin', email: 'admin@example.com', status: 'Active' },
  { id: 2, name: 'Aman Kumar', role: 'Staff', email: 'aman@example.com', status: 'Active' },
  { id: 3, name: 'Priya Singh', role: 'Operator', email: 'priya@example.com', status: 'Inactive' },
  { id: 4, name: 'Rohit Verma', role: 'Staff', email: 'rohit@example.com', status: 'Active' },
];

const reportsSeed = [
  { id: 'R-1001', type: 'ECMP Report', date: '2026-04-20', amount: '₹12,500', status: 'Completed' },
  { id: 'R-1002', type: 'UC Report', date: '2026-04-20', amount: '₹8,750', status: 'Pending' },
  { id: 'R-1003', type: 'EOD Request', date: '2026-04-19', amount: '₹4,275', status: 'Completed' },
  { id: 'R-1004', type: 'Missing EOD', date: '2026-04-19', amount: '₹2,100', status: 'Review' },
];

const walletTransactions = [
  { id: 'T-2001', title: 'Wallet Top-up', amount: '+₹10,000', time: '10:30 AM', kind: 'credit' },
  { id: 'T-2002', title: 'Report Settlement', amount: '-₹2,500', time: '11:45 AM', kind: 'debit' },
  { id: 'T-2003', title: 'Refund', amount: '+₹850', time: '01:15 PM', kind: 'credit' },
  { id: 'T-2004', title: 'Service Charge', amount: '-₹400', time: '03:05 PM', kind: 'debit' },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function StatCard({ title, value, change, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{title}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
              <p className="mt-2 text-sm text-emerald-600">{change} from last week</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <Icon className="h-5 w-5 text-slate-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Sidebar({ current, setCurrent, mobileOpen, setMobileOpen }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={() => setMobileOpen(false)} />
      <aside className={`fixed left-0 top-0 z-40 h-full w-72 transform border-r bg-white p-5 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">Payment & report management</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setCurrent(item.key);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">System Status</p>
          <p className="mt-1 text-sm text-slate-500">Server healthy and running</p>
          <Progress value={84} className="mt-4" />
          <p className="mt-2 text-xs text-slate-500">84% performance score</p>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setMobileOpen }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search users, reports, transactions..." className="pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto">
        <Button variant="outline" className="rounded-xl">
          <Bell className="mr-2 h-4 w-4" /> Notifications
        </Button>
        <div className="flex items-center gap-3 rounded-2xl border px-3 py-2">
          <Avatar>
            <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop" />
            <AvatarFallback>RP</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-800">Rishabh</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsSeed.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{report.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start rounded-xl"><Upload className="mr-2 h-4 w-4" /> Upload Report File</Button>
            <Button variant="outline" className="w-full justify-start rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add New User</Button>
            <Button variant="outline" className="w-full justify-start rounded-xl"><Download className="mr-2 h-4 w-4" /> Export Summary</Button>
            <Button variant="outline" className="w-full justify-start rounded-xl"><CreditCard className="mr-2 h-4 w-4" /> Wallet Top-up</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersSection() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => usersSeed.filter((u) => [u.name, u.email, u.role, u.status].join(' ').toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>User Management</CardTitle>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user" className="w-56" />
          <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="rounded-lg">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReportsSection() {
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3 rounded-2xl md:w-[360px]">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Reports</CardTitle>
            <Button className="rounded-xl"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsSeed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="completed">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle>Completed Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {reportsSeed.filter((r) => r.status === 'Completed').map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">{r.type}</p>
                  <p className="text-sm text-slate-500">{r.id} • {r.date}</p>
                </div>
                <Badge>{r.amount}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pending">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle>Pending / Review Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {reportsSeed.filter((r) => r.status !== 'Completed').map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">{r.type}</p>
                  <p className="text-sm text-slate-500">{r.id} • {r.date}</p>
                </div>
                <Badge variant="secondary">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function WalletSection() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="rounded-2xl border-0 shadow-sm xl:col-span-1">
        <CardHeader><CardTitle>Wallet Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">Available Balance</p>
            <h3 className="mt-2 text-3xl font-bold">₹58,240</h3>
            <p className="mt-4 text-sm text-slate-300">Last updated: Today, 04:25 PM</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button className="rounded-xl">Add Money</Button>
            <Button variant="outline" className="rounded-xl">Withdraw</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm xl:col-span-2">
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {walletTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-2xl border p-4">
              <div>
                <p className="font-semibold text-slate-800">{tx.title}</p>
                <p className="text-sm text-slate-500">{tx.id} • {tx.time}</p>
              </div>
              <Badge variant={tx.kind === 'credit' ? 'default' : 'secondary'}>{tx.amount}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop" />
              <AvatarFallback>RP</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-xl"><Upload className="mr-2 h-4 w-4" /> Change Photo</Button>
          </div>
          <Input placeholder="Full name" defaultValue="Rishabh Pathak" />
          <Input placeholder="Email" defaultValue="admin@example.com" />
          <Input placeholder="Role" defaultValue="Super Admin" />
          <Button className="rounded-xl">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle>System Controls</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border p-4">
            <p className="font-semibold">API Base URL</p>
            <p className="mt-1 text-sm text-slate-500">https://your-backend.onrender.com</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-semibold">File Upload Status</p>
            <p className="mt-1 text-sm text-emerald-600">Connected</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="font-semibold">Authentication</p>
            <p className="mt-1 text-sm text-slate-500">JWT / session based</p>
          </div>
          <div className="flex gap-3">
            <Button className="rounded-xl"><Settings className="mr-2 h-4 w-4" /> Update Config</Button>
            <Button variant="outline" className="rounded-xl"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPanelStarter() {
  const [current, setCurrent] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar current={current} setCurrent={setCurrent} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 lg:p-6 lg:pl-4">
          <Topbar setMobileOpen={setMobileOpen} />

          <motion.div
            key={current}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold capitalize text-slate-900">{current}</h2>
                <p className="text-slate-500">Manage your website operations from one place.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-xl"><UserCircle2 className="mr-2 h-4 w-4" /> Profile</Button>
                <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> New Action</Button>
              </div>
            </div>

            {current === 'dashboard' && <DashboardHome />}
            {current === 'users' && <UsersSection />}
            {current === 'reports' && <ReportsSection />}
            {current === 'wallet' && <WalletSection />}
            {current === 'settings' && <SettingsSection />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
