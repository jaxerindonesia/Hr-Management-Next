"use client";

type Props = {
  tenantName: string;
  userName: string | null;
};

export default function DashboardHeader({ tenantName, userName }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold dark:text-white">
        Selamat datang kembali,{" "}
        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {userName ?? "User"}
        </span>{" "}
        👋
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Kelola {tenantName} dengan ringkasan data karyawan, absensi, pengajuan, dan performa dalam satu dashboard.
      </p>
    </div>
  );
}
