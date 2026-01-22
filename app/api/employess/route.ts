import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Ambil semua karyawan
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST - Tambah karyawan baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const employee = await prisma.employee.create({
      data: {
        nip: body.nip,
        name: body.name,
        email: body.email,
        phone: body.phone,
        position: body.position,
        department: body.department,
        joinDate: new Date(body.joinDate),
        salary: parseFloat(body.salary),
        status: body.status || 'active',
      }
    });
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

// PUT - Update karyawan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        salary: data.salary ? parseFloat(data.salary) : undefined,
      }
    });
    
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE - Hapus karyawan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await prisma.employee.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}