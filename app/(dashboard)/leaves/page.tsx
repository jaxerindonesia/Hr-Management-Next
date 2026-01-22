'use client';

import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const leaves = [
  { id: '1', employeeName: 'Budi Santoso', type: 'Cuti', startDate: '2024-02-01', endDate: '2024-02-03', reason: 'Liburan keluarga', status: 'pending' },
  { id: '2', employeeName: 'Siti Nurhaliza', type: 'Sakit', startDate: '2024-01-28', endDate: '2024-01-29', reason: 'Demam', status: 'approved' },
];

export default function LeavesPage() {
  return (
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
}Button