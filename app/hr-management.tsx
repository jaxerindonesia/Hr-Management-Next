'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, 
  TrendingUp, Menu, X, Plus, Search, Edit, Trash2,
  CheckCircle, XCircle, Clock, Award, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Employee {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  status: string;
  joinDate: string;
}

const initialEmployees: Employee[] = [
  {
    id: '1',
    nip: 'NIP001',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '081234567890',
    position: 'Manager',
    department: 'IT',
    salary: 15000000,
    status: 'active',
    joinDate: '2023-01-15'
  },
  {
    id: '2',
    nip: 'NIP002',
    name: 'Siti Nurhaliza',
    email: 'siti@example.com',
    phone: '081234567891',
    position: 'Staff',
    department: 'HR',
    salary: 12000000,
    status: 'active',
    joinDate: '2023-03-20'
  }
];

const initialLeaves = [
  { id: '1', employeeName: 'Budi Santoso', type: 'Cuti', startDate: '2024-02-01', endDate: '2024-02-03', reason: 'Liburan keluarga', status: 'pending' },
  { id: '2', employeeName: 'Siti Nurhaliza', type: 'Sakit', startDate: '2024-01-28', endDate: '2024-01-29', reason: 'Demam', status: 'approved' },
];

const initialPayrolls = [
  { id: '1', employeeName: 'Budi Santoso', month: 'Januari', year: 2024, basicSalary: 15000000, allowances: 1000000, deductions: 500000, totalSalary: 15500000, status: 'paid' },
  { id: '2', employeeName: 'Siti Nurhaliza', month: 'Januari', year: 2024, basicSalary: 12000000, allowances: 800000, deductions: 400000, totalSalary: 12400000, status: 'paid' },
];

const initialPerformances = [
  { id: '1', employeeName: 'Budi Santoso', period: 'Q1 2024', productivity: 5, quality: 5, teamwork: 4, discipline: 5, totalScore: 4.75, notes: 'Excellent performance' },
  { id: '2', employeeName: 'Siti Nurhaliza', period: 'Q1 2024', productivity: 4, quality: 5, teamwork: 5, discipline: 5, totalScore: 4.75, notes: 'Great team player' },
];

export default function HRManagement() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState(initialLeaves);
  const [payrolls, setPayrolls] = useState(initialPayrolls);
  const [performances, setPerformances] = useState(initialPerformances);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  

  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    joinDate: '',
    salary: '',
    status: 'active'
  });

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', name: 'Data Karyawan', icon: Users },
    { id: 'leaves', name: 'Cuti/Izin', icon: Calendar },
    { id: 'payroll', name: 'Payroll', icon: () => <span className="text-lg font-bold">Rp</span> },
    { id: 'performance', name: 'Penilaian Kinerja', icon: TrendingUp },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmployees = localStorage.getItem('hr_employees');
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      } else {
        setEmployees(initialEmployees);
        localStorage.setItem('hr_employees', JSON.stringify(initialEmployees));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && employees.length > 0) {
      localStorage.setItem('hr_employees', JSON.stringify(employees));
    }
  }, [employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      currencyDisplay: 'code'
    }).format(amount).replace('IDR', 'Rp');
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        nip: employee.nip,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        joinDate: employee.joinDate.split('T')[0],
        salary: employee.salary.toString(),
        status: employee.status
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        nip: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        joinDate: '',
        salary: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      nip: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      joinDate: '',
      salary: '',
      status: 'active'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEmployee) {
        const updatedEmployees = employees.map(emp => 
          emp.id === editingEmployee.id 
            ? {
                ...emp,
                nip: formData.nip,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                position: formData.position,
                department: formData.department,
                joinDate: formData.joinDate,
                salary: Number(formData.salary),
                status: formData.status
              }
            : emp
        );
        setEmployees(updatedEmployees);
        alert('Karyawan berhasil diupdate!');
      } else {
        const newEmployee: Employee = {
          id: Date.now().toString(),
          nip: formData.nip,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          joinDate: formData.joinDate,
          salary: Number(formData.salary),
          status: formData.status
        };
        setEmployees([...employees, newEmployee]);
        alert('Karyawan berhasil ditambahkan!');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Gagal menyimpan data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Yakin ingin menghapus karyawan ini?')) return;

    try {
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      setEmployees(updatedEmployees);
      alert('Karyawan berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Gagal menghapus karyawan');
    }
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Karyawan</p>
              <p className="text-4xl font-bold mt-2">{employees.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Karyawan Aktif</p>
              <p className="text-4xl font-bold mt-2">
                {employees.filter(e => e.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pengajuan Cuti</p>
              <p className="text-4xl font-bold mt-2">
                {leaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Gaji Bulan Ini</p>
              <p className="text-xl font-bold mt-2">
                {formatCurrency(payrolls.reduce((sum, p) => sum + p.totalSalary, 0))}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-purple-400 bg-opacity-30 rounded-full">
              <span className="text-2xl font-bold text-purple-100">Rp</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4">Pengajuan Cuti Terbaru</h3>
          <div className="space-y-3">
            {leaves.slice(0, 5).map(leave => (
              <div key={leave.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{leave.employeeName}</p>
                  <p className="text-sm text-gray-600">{leave.type} - {leave.startDate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                  leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-lg font-semibold mb-4">Karyawan Terbaik</h3>
          <div className="space-y-3">
            {performances.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).map(perf => (
              <div key={perf.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{perf.employeeName}</p>
                    <p className="text-sm text-gray-600">{perf.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{perf.totalScore}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const EmployeesView = () => {
    const filteredEmployees = employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Data Karyawan</h2>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Karyawan
          </Button>
        </div>

       <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Gaji</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.nip}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{formatCurrency(emp.salary)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(emp)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  const LeavesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Cuti/Izin</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Ajukan Cuti
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Tanggal Selesai</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map(leave => (
              <TableRow key={leave.id}>
                <TableCell className="font-medium">{leave.employeeName}</TableCell>
                <TableCell>{leave.type}</TableCell>
                <TableCell>{leave.startDate}</TableCell>
                <TableCell>{leave.endDate}</TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {leave.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {leave.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const PayrollView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Payroll</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Proses Gaji
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Gaji Pokok</TableHead>
              <TableHead>Tunjangan</TableHead>
              <TableHead>Potongan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrolls.map(payroll => (
              <TableRow key={payroll.id}>
                <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                <TableCell>{payroll.month} {payroll.year}</TableCell>
                <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(payroll.allowances)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(payroll.deductions)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(payroll.totalSalary)}</TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payroll.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payroll.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <FileText className="w-5 h-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const PerformanceView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Penilaian Kinerja</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Penilaian
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Karyawan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Produktivitas</TableHead>
              <TableHead>Kualitas</TableHead>
              <TableHead>Kerjasama</TableHead>
              <TableHead>Disiplin</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performances.map(perf => (
              <TableRow key={perf.id}>
                <TableCell className="font-medium">{perf.employeeName}</TableCell>
                <TableCell>{perf.period}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < perf.productivity ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < perf.quality ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < perf.teamwork ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < perf.discipline ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-blue-600">{perf.totalScore}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
  <div className="flex h-screen bg-gray-50">
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center justify-between border-b border-gray-200">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">HR System</h1>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
              {sidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="w-full justify-center hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
    </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeMenu === 'dashboard' && <DashboardView />}
          {activeMenu === 'employees' && <EmployeesView />}
          {activeMenu === 'leaves' && <LeavesView />}
          {activeMenu === 'payroll' && <PayrollView />}
          {activeMenu === 'performance' && <PerformanceView />}
        </div>
      </main>

<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl">
        {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
      </DialogTitle>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nip">NIP</Label>
          <Input
            id="nip"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">No. Telepon</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Posisi</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Departemen</Label>
          <Select
            value={formData.department}
            onValueChange={(value) =>
              setFormData({ ...formData, department: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="joinDate">Tanggal Bergabung</Label>
          <Input
            id="joinDate"
            type="date"
            value={formData.joinDate}
            onChange={(e) =>
              setFormData({ ...formData, joinDate: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Gaji</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) =>
              setFormData({ ...formData, salary: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={handleCloseModal}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : editingEmployee ? 'Update' : 'Simpan'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

</div>
);
}