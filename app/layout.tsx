import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';

export const metadata: Metadata = {
  title: 'Komorebi Kiln — Japanese Porcelain & Vessels',
  description: 'Curated Japanese ceramics and porcelain from heritage kilns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-stone-900 antialiased selection:bg-stone-200">
        <Navbar />
        <main>{children}</main>
        <CartDrawer />
      </body>
    </html>
  );
}