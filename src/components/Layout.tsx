'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();

  // Hide header on dashboard routes
  const hideHeader = pathname?.startsWith('/dashboard')
  return (
    <div className="relative min-h-screen">
      {/* Conditionally render Header */}
      {!hideHeader && <Header />}

      {/* Main Content */}
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
