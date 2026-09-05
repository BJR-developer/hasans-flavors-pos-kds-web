import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: "Hasan's Flavors • POS & Kitchen KDS Operations",
  description:
    'High-performance POS Register, Kitchen Display System (KDS), and TanStack Table Orders Cockpit for Hasan\'s Flavors Authentic Halal Cuisine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FAF9F8] text-[#2D2926]">
        <QueryProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
