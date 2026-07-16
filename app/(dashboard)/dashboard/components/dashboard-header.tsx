"use client";

type Props = {
  userName: string | null;
  subtitle: string;
};

export default function DashboardHeader({ userName, subtitle }: Props) {
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
        {subtitle}
      </p>
    </div>
  );
}
