'use client';

import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const payrolls = [
  { id: '1', employeeName: 'Budi Santoso', month: 'Januari', year: 2024, basicSalary: 15000000, allowances: 1000000, deductions: 500000, totalSalary: 15500000, status: 'paid' },
  { id: '2', employeeName: 'Siti Nurhaliza', month: 'Januari', year: 2024, basicSalary: 12000000, allowances: 800000, deductions: 400000, totalSalary: 12400000, status: 'paid' },
];

export default function PayrollPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      currencyDisplay: 'code'
    }).format(amount).replace('IDR', 'Rp');
  };

  return (
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
}