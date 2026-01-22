'use client';

import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const performances = [
  { id: '1', employeeName: 'Budi Santoso', period: 'Q1 2024', productivity: 5, quality: 5, teamwork: 4, discipline: 5, totalScore: 4.75, notes: 'Excellent performance' },
  { id: '2', employeeName: 'Siti Nurhaliza', period: 'Q1 2024', productivity: 4, quality: 5, teamwork: 5, discipline: 5, totalScore: 4.75, notes: 'Great team player' },
];

export default function PerformancePage() {
  return (
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
}