import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Management System",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
