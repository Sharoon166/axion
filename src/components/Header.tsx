'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Handbag,
  UserRound,
  Clock,
  Star,
  Trash2,
  Plus,
  Minus,
  Menu,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const Header = () => {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { cartItems, getTotalPrice, getTotalItems, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hide header when scrolling from top
  useEffect(() => {
    const handleScroll = () => {
      // Hide header when scrolling away from top (scrollY > 0)
      if (window.scrollY > 0) {
        setHideOnScroll(true);
      } else {
        setHideOnScroll(false);
      }

      // Navbar color change logic
      if (window.scrollY > 150) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/category' },
    { name: 'Projects', href: '/projects' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  // Add dashboard link for admin users
  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    ...navLinks
  ];

  const recentSearches = [
    'LED Strip Lights',
    'Smart Bulbs',
    'Industrial Fixtures',
    'Outdoor Lighting',
  ];

  const popularProducts = [
    { name: 'LED Panel Light 60W', category: 'LED Lights' },
    { name: 'Smart WiFi Bulb', category: 'Smart Lighting' },
    { name: 'Industrial High Bay', category: 'Industrial' },
  ];

  const pillTarget = hovered ?? pathname;

  return (
    <header
      className={cn(
        `fixed top-0 left-0 right-0 z-50 transition-all duration-300`,
        hideOnScroll ? '-translate-y-full' : 'translate-y-0'
      )}
    >
      <div className={cn(
        "max-w-[85rem] mx-auto my-4 px-4 sm:px-6 py-1 flex items-center justify-between transition-all duration-300 rounded-full sm:backdrop-filter-none sm:shadow-none bg-black/20 sm:bg-black/0 backdrop-blur-sm shadow-lg",
        {
          "bg-black/40": scrolled
        }
      )}>
        {/* Logo */}
        <div className="size-10 sm:size-12 md:size-16 flex items-center justify-center">
          <Image
            src="/Logo.png"
            alt="Axion Lighting Solutions Logo"
            width={80}
            height={40}
            className="brightness-200 w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className={cn("relative hidden md:block py-1 px-1 rounded-full shadow-lg backdrop-blur-md bg-gray-300/30", {
          "bg-black/50": scrolled,
        })}>
          <ul className="flex items-center justify-between relative z-10">
            {(user?.isAdmin ? adminLinks : navLinks).map((link) => {
              const isTarget = pillTarget === link.href;

              return (
                <li
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setHovered(link.href)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Animated pill background */}
                  {isTarget && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-y-0 left-0 right-0 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <Link
                    href={link.href}
                    className={`relative z-10 rounded-full px-5 py-2 block transition-colors ${isTarget ? 'text-black' : 'text-white'
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 sm:p-3 rounded-full transition-all duration-300 hover:bg-white/20">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 sm:w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 overflow-y-auto"
            >
              <SheetHeader className="border-b border-slate-700/50 pb-6 mb-6 sticky top-0 bg-gradient-to-b from-slate-900 to-slate-800 z-10">
                <SheetTitle className="flex items-center gap-3 text-white text-lg font-semibold">
                  <div className="p-2 bg-[var(--color-logo)]/20 rounded-full">
                    <Image
                      src="/Logo.png"
                      alt="Axion Lighting Solutions Logo"
                      width={32}
                      height={32}
                      className="brightness-200"
                    />
                  </div>
                  Axion Lighting
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <div className="space-y-3 px-2">
                {(user?.isAdmin ? adminLinks : navLinks).map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-white/90 transition-all duration-200 hover:bg-[var(--color-logo)]/20 hover:text-white hover:translate-x-1",
                      {
                        "bg-[var(--color-logo)] text-white shadow-lg": pathname === link.href
                      }
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Actions */}
              <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-3 px-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="p-1 bg-[var(--color-logo)]/20 rounded-lg">
                    <Search size={18} />
                  </div>
                  Search Products
                </button>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:translate-x-1"
                >
                  <div className="p-1 bg-[var(--color-logo)]/20 rounded-lg relative">
                    <Handbag size={18} />
                    {getTotalItems() > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {getTotalItems()}
                      </span>
                    )}
                  </div>
                  Shopping Cart
                </Link>

                {user ? (
                  <>
                    <Link
                      href={user.isAdmin ? '/dashboard' : '/profile'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:translate-x-1"
                    >
                      <div className="p-1 bg-[var(--color-logo)]/20 rounded-lg">
                        <UserRound size={18} />
                      </div>
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem('userData');
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:translate-x-1"
                    >
                      <div className="p-1 bg-[var(--color-logo)]/20 rounded-lg">
                        <LogOut size={18} />
                      </div>
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="p-1 bg-[var(--color-logo)]/20 rounded-lg">
                      <UserRound size={18} />
                    </div>
                    Sign In
                  </Link>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-700/50 px-4">
                <p className="text-slate-400 text-sm text-center">
                  2024 Axion Lighting Solutions
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Icons */}
        <div className="hidden md:flex items-center space-x-1">
          {/* Search Dialog */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <button className="group relative p-2 rounded-full transition-all duration-300 hover:bg-white/20">
                <Search
                  size={20}
                  className="text-white/80 group-hover:text-[#2CA6A4] transition-colors duration-300"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#0C1E33]">Search Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2CA6A4]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="flex items-center gap-2 font-medium mb-3 text-[#0C1E33]">
                    <Clock size={16} className="text-[#E1B857]" />
                    Recent Searches
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 rounded-lg hover:bg-[#2CA6A4]/10 transition-colors"
                        onClick={() => setSearchQuery(search)}
                      >
                        <div className="font-medium text-[#0C1E33]">
                          {search}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 font-medium mb-3 text-[#0C1E33]">
                    <Star size={16} className="text-[#E1B857]" />
                    Popular Products
                  </h3>
                  <div className="space-y-2">
                    {popularProducts.map((product, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 rounded-lg hover:bg-[#2CA6A4]/10 transition-colors"
                        onClick={() => setSearchQuery(product.name)}
                      >
                        <div className="font-medium text-[#0C1E33]">
                          {product.name}
                        </div>
                        <div className="text-sm text-[#2CA6A4]">
                          {product.category}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cart Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group relative p-2 rounded-full transition-all duration-300 hover:bg-white/20">
                <Handbag
                  size={20}
                  className="text-white/80 group-hover:text-[#E1B857] transition-colors duration-300"
                />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold bg-white text-black">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 p-4"
              style={{ backgroundColor: '#F5F3EB', borderColor: '#E1B857' }}
              align="end"
            >
              <DropdownMenuLabel style={{ color: '#0C1E33' }}>Shopping Cart</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: '#E1B857' }} />

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Your cart is empty</p>
                ) : (
                  cartItems.map((item, index) => (
                    <div
                      key={`${item._id}-${item.color}-${item.size}-${index}`}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#2CA6A4]/10"
                    >
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm" style={{ color: '#0C1E33' }}>
                          {item.name}
                        </h4>
                        <p className="text-xs" style={{ color: '#2CA6A4' }}>
                          Rs. {item.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.color} | {item.size}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#E1B857' }}
                        >
                          <Minus size={12} style={{ color: '#0C1E33' }} />
                        </button>
                        <span className="text-sm" style={{ color: '#0C1E33' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#E1B857' }}
                        >
                          <Plus size={12} style={{ color: '#0C1E33' }} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <DropdownMenuSeparator style={{ backgroundColor: '#E1B857' }} />
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: '#0C1E33' }}>
                    Total:
                  </span>
                  <span className="font-bold text-lg" style={{ color: '#2CA6A4' }}>
                    Rs. {getTotalPrice().toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/register');
                      return;
                    }
                    router.push('/order/generate');
                  }}
                  disabled={cartItems.length === 0}
                  className="w-full py-2 px-4 rounded-lg text-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: cartItems.length > 0 ? '#2CA6A4' : '#ccc', color: 'white' }}
                  onMouseEnter={(e) => {
                    if (cartItems.length > 0) {
                      e.currentTarget.style.backgroundColor = '#238a88';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cartItems.length > 0) {
                      e.currentTarget.style.backgroundColor = '#2CA6A4';
                    }
                  }}
                >
                  Pay Now
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Icon */}
          <ProfileDropdown userData={user} />
        </div>
      </div>
    </header>
  );
};

// Profile Dropdown Component
const ProfileDropdown = ({ userData }: { userData: any }) => {
  if (!userData) {
    return (
      <Link href="/register">
        <button className="group relative p-2 rounded-full transition-all duration-300 hover:bg-white/20">
          <UserRound
            size={20}
            className="text-white/80 group-hover:text-[#F5F3EB] transition-colors duration-300"
          />
        </button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group relative p-2 rounded-full transition-all duration-300 hover:bg-white/20">
          <UserRound
            size={20}
            className="text-white/80 group-hover:text-[#F5F3EB] transition-colors duration-300"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={userData.isAdmin ? '/dashboard' : '/profile'}>
          <DropdownMenuLabel className="cursor-pointer hover:bg-gray-100 rounded-sm px-2 py-1.5">
            Profile
          </DropdownMenuLabel>
        </Link>
        <DropdownMenuSeparator />
        <button
          onClick={() => {
            localStorage.removeItem('userData');
            window.location.href = '/';
          }}
          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm cursor-pointer flex items-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Header;