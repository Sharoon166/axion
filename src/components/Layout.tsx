'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import Footer from './Footer';
import Header from './Header';
import { motion } from 'framer-motion';
interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();

  // Hide header on dashboard routes
  const hideHeader = pathname?.startsWith('/dashboard');

  // Hide padding on home page
  const hidePadding = pathname === '/';

  return (
    <div className={`relative min-h-screen ${hidePadding ? '' : 'lg:px-12'}`}>
      {/* Conditionally render Header */}
      {!hideHeader && <Header />}
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3 }}
      >

      {/* Main Content */}
      <main className="relative">{children}</main>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Layout;
