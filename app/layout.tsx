import "./globals.css";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Providers } from "@/components/providers";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionUser();
  const tenantName =
    session.ok && session.user.tenantName?.trim()
      ? session.user.tenantName.trim()
      : null;

  const brandTitle = `${tenantName || 'Jahris'} - HR Management System`;
  const brandDescription = tenantName
    ? `${tenantName} Human Resource Management System`
    : "Jahris Human Resource Management System";

  return {
    title: brandTitle,
    description: brandDescription,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon_jahris_colored.png", sizes: "32x32", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-1">{children}</div>
            
          </div>
        </Providers>
      </body>
    </html>
  );
}
