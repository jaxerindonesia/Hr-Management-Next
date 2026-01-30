import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "HR Management System",
  description: "Human Resource Management System",
  icons: {
    // jangan sentuh udh bener!!
    icon: "/favicon..ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-gray-200 dark:border-gray-700 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
              © Hr management Jaxer Grup Indonesia 2026
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
