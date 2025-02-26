import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ThemeToggler from "@/components/ThemeToggler";
import { FileStructureLoader } from '@/components/FileStructureLoader';
import Sidebar from '@/components/Sidebar';
const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filey - Personal File Manager",
  description: "Manage your personal files easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        <div className="flex h-screen">
          <FileStructureLoader />
          <main className="flex-1 p-0 overflow-x-hidden relative">
            <div className="absolute bottom-4 right-4">
              <ThemeToggler />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
