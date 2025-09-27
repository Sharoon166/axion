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
  Menu,
  LogOut,
  Edit,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { user } = useAuth();
  const { cartItems, getTotalPrice, getTotalItems, removeFromCart } = useCart();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderAdmin, setIsOrderAdmin] = useState(false);
  // Add state for desktop dropdowns
  const [cartOpen, setCartOpen] = useState(false);
  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'order admin') {
      setIsOrderAdmin(true);
    }
  }, [user]);

  useEffect(() => {
    // Close ALL dropdowns and modals when route changes
    setProfileOpen(false);
    setMobileCartOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setDesktopProfileOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Projects', href: '/projects' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Sale', href: '/sale', className: 'text-[var(--color-logo)] font-semibold' },
  ];

  const adminLinks = [{ name: 'Dashboard', href: '/dashboard' }, ...navLinks];

  const popularProducts = [
    { name: 'LED Panel Light 60W', category: 'LED Lights' },
    { name: 'Smart WiFi Bulb', category: 'Smart Lighting' },
    { name: 'Industrial High Bay', category: 'Industrial' },
  ];

  const pillTarget = hovered ?? pathname;

  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="h-10 w-auto flex items-center justify-center">
          <Link href={'/'}>
            <Image
              src="/Logo.svg"
              alt="Axion Lighting Solutions Logo"
              width={80}
              height={40}
              className="object-contain object-left"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-6">
            {(user?.isAdmin || isOrderAdmin ? adminLinks : navLinks).map((link) => {
              const isTarget = pillTarget === link.href;

              return (
                <li
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setHovered(link.href)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Link
                    href={link.href}
                    className={`relative px-1 py-2 block transition-colors ${isTarget
                      ? 'text-[var(--color-logo)] font-semibold'
                      : 'text-slate-700 hover:text-[var(--color-logo)]'
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
              <button className="p-2 sm:p-3 rounded-md transition-all duration-300 hover:bg-slate-100">
                <Menu className="w-6 h-6 sm:w-5 sm:h-5 text-slate-700" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 sm:w-80 overflow-y-auto">
              <SheetHeader className="border-b pb-6 mb-6 sticky top-0 bg-white z-10">
                <SheetTitle className="flex items-center gap-3 text-slate-900 text-lg font-semibold">
                  <div className="p-2  rounded-full">
                    <Image
                      src="/Logo.svg"
                      alt="Axion Lighting Solutions Logo"
                      width={50}
                      height={50}
                      className=""
                    />
                  </div>
                  Axion Lighting
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <div className="space-y-3 px-2">
                {(user?.isAdmin || isOrderAdmin ? adminLinks : navLinks).map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-3 rounded-xl text-slate-800 transition-all duration-200 hover:bg-slate-100 hover:translate-x-1',
                      {
                        'bg-slate-100 font-semibold': pathname === link.href,
                      },
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Actions */}
              <div className="mt-8 pt-6 border-t space-y-3 px-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-100 transition-all duration-200 hover:translate-x-1"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/search');
                  }}
                >
                  <div className="p-1 bg-[var(--color-logo)]/10 rounded-lg">
                    <Search size={18} />
                  </div>
                  Search Products
                </button>

                {!(user?.isAdmin || isOrderAdmin) && (
                  <>
                    <button
                      onClick={() => setMobileCartOpen(!mobileCartOpen)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-100 transition-all duration-200 hover:translate-x-1"
                    >
                      <div className="p-1 bg-[var(--color-logo)]/10 rounded-lg relative">
                        <Handbag size={18} />
                        {getTotalItems() > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {getTotalItems()}
                          </span>
                        )}
                      </div>
                      Shopping Cart
                    </button>

                    {/* Mobile Cart Dropdown */}
                    {mobileCartOpen && (
                      <div className="mt-2 p-3  rounded-lg border w-full max-w-full overflow-hidden">
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {cartItems.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">Your cart is empty</p>
                          ) : (
                            cartItems.map((item, index) => (
                              <div
                                key={`${item._id}-${item.color}-${item.size}-${index}`}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#2CA6A4]/10 w-full overflow-hidden"
                              >
                                <Image
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className="font-medium text-sm truncate"
                                    style={{ color: '#0C1E33' }}
                                  >
                                    {item.name}
                                  </h4>
                                  <p className="text-xs text-[var(--color-logo)]">
                                    Rs. {item.price.toLocaleString()} x {item.quantity}
                                  </p>
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

                        {cartItems.length > 0 && (
                          <>
                            <div className="border-t pt-3 mt-3">
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold" style={{ color: '#0C1E33' }}>
                                  Total:
                                </span>
                                <span className="font-bold text-lg text-[var(--color-logo)]">
                                  Rs. {getTotalPrice().toLocaleString()}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (!user) {
                                    setMobileMenuOpen(false);
                                    router.push('/login');
                                    return;
                                  }
                                  setMobileMenuOpen(false);
                                  router.push('/order/generate');
                                }}
                                className="w-full py-2 px-4 rounded-lg text-center transition-colors duration-200"
                                style={{
                                  backgroundColor: '#0077B6',
                                  color: 'white',
                                }}
                              >
                                Pay Now
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {user ? (
                  <>
                    <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-slate-800 
      hover:bg-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className='size-9'>
                              <AvatarImage src={user?.image || '/Logo.png'} alt={user?.name || 'user picture'} />
                              <AvatarFallback className='uppercase bg-muted-foreground text-muted'>{user?.name?.split(' ').map((name) => name[0]).join('')}</AvatarFallback>
                            </Avatar>
                            My Profile
                          </div>

                          {/* Chevron icon */}
                          {profileOpen ? (
                            <ChevronUp size={18} className="text-slate-600" />
                          ) : (
                            <ChevronDown size={18} className="text-slate-600" />
                          )}
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="start"
                        className="w-64 p-2 bg-white rounded-xl shadow-lg"
                        sideOffset={8}
                      >
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium">Welcome {user?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>

                        <DropdownMenuSeparator />

                        {/* Profile Links */}
                        <DropdownMenuItem asChild>
                          <Link
                            href={user.isAdmin ? '/dashboard' : '/profile'}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 w-full transition-none px-2 py-2 rounded-md"
                          >
                            <UserRound size={16} />
                            Profile
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            href="/profile/edit"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 w-full px-2 py-2 rounded-md"
                          >
                            <Edit size={16} />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>

                        {!(user.isAdmin || isOrderAdmin) && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link
                                href="/profile/orders"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 w-full px-2 py-2 rounded-md"
                              >
                                <Clock size={16} />
                                Orders
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link
                                href="/profile/wishlist"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 w-full px-2 py-2 rounded-md"
                              >
                                <Star size={16} />
                                Wishlist
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      onClick={() => {
                        localStorage.removeItem('userData');
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-100 transition-all duration-200 hover:translate-x-1"
                    >
                      <div className="p-1 bg-[var(--color-logo)]/10 rounded-lg">
                        <LogOut size={18} />
                      </div>
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-slate-100 transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="p-1 bg-[var(--color-logo)]/10 rounded-lg">
                      <UserRound size={18} />
                    </div>
                    Sign In
                  </Link>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t px-4 mb-6">
                <p className="text-slate-500 text-sm text-center">Axion Lighting Solutions</p>
              </div>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Icons */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search Dialog */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <button className="group relative p-2 rounded-md transition-all duration-300 hover:bg-slate-100">
                <Search
                  size={20}
                  className="text-slate-700 group-hover:text-[#2CA6A4] transition-colors duration-300"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#0C1E33]">Search Products</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[70vh] pr-2">
                <div className="space-y-6">
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const q = searchQuery.trim();
                      if (q) {
                        router.push(`/search?q=${encodeURIComponent(q)}`);
                        setSearchOpen(false);
                      }
                    }}
                  >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search for products..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2CA6A4]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-md bg-[var(--color-logo)] text-white hover:bg-[var(--color-logo)]/90"
                    >
                      Search
                    </button>
                  </form>
                  <div>
                    <h3 className="flex items-center gap-2 font-medium mb-3 text-[#0C1E33]">
                      <Star size={16} className="text-[var(--color-logo)]" />
                      Popular Products
                    </h3>
                    <div className="space-y-2">
                      {popularProducts.map((product, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-3 rounded-lg hover:bg-[#2CA6A4]/10"
                          onClick={() => {
                            router.push(`/search?q=${encodeURIComponent(product.name)}`);
                            setSearchOpen(false);
                          }}
                        >
                          <div className="font-medium text-[#0C1E33]">{product.name}</div>
                          <div className="text-sm text-[#2CA6A4]">{product.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Cart Dropdown - Hidden for admin and order admin */}
          {!(user?.isAdmin || isOrderAdmin) && (
            <DropdownMenu open={cartOpen} onOpenChange={setCartOpen}>
              <DropdownMenuTrigger asChild>
                <button className="group relative p-2 rounded-md transition-all duration-300 hover:bg-slate-100">
                  <Handbag
                    size={20}
                    className="text-slate-700 group-hover:text-[var(--color-logo)] transition-colors duration-300"
                  />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold bg-white text-black">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-4" align="end">
                <DropdownMenuLabel style={{ color: '#0C1E33' }}>Shopping Cart</DropdownMenuLabel>
                <DropdownMenuSeparator style={{ backgroundColor: '#a5afc2' }} />

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
                          <p className="text-xs text-[var(--color-logo)]">
                            Rs. {item.price.toLocaleString()} x {item.quantity}
                          </p>
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

                <DropdownMenuSeparator style={{ backgroundColor: '#a5afc2' }} />
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: '#0C1E33' }}>
                      Total:
                    </span>
                    <span className="font-bold text-lg text-[var(--color-logo)]">
                      Rs. {getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      router.push('/order/generate');
                    }}
                    disabled={cartItems.length === 0}
                    className="w-full py-2 px-4 rounded-lg text-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: cartItems.length > 0 ? '#0077B6' : '#ccc',
                      color: 'white',
                    }}
                  >
                    Pay Now
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Profile Icon */}
          <ProfileDropdown
            userData={user}
            isOrderAdmin={isOrderAdmin}
            desktopProfileOpen={desktopProfileOpen}
            setDesktopProfileOpen={setDesktopProfileOpen}
          />
        </div>
      </div>
    </header>
  );
};

interface HeaderUser {
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  isOrderAdmin?: boolean;
  image?: string | null;
}

interface ProfileDropdownProps {
  userData: HeaderUser | null;
  isOrderAdmin: boolean;
  desktopProfileOpen: boolean;
  setDesktopProfileOpen: (open: boolean) => void;
}

const ProfileDropdown = ({
  userData,
  isOrderAdmin,
  desktopProfileOpen,
  setDesktopProfileOpen,
}: ProfileDropdownProps) => {
  if (!userData) {
    return (
      <Link href="/login">
        <button className="group relative p-2 rounded-md transition-all duration-300 hover:bg-slate-100">
          <UserRound
            size={20}
            className="text-slate-700 group-hover:text-[#0C1E33] transition-colors duration-300"
          />
        </button>
      </Link>
    );
  }

  const menuItems = [
    {
      name: 'Profile',
      href: userData.isAdmin ? '/dashboard' : '/profile',
      icon: <UserRound size={16} />,
    },
    {
      name: 'Edit Profile',
      href: '/profile/edit',
      icon: <Edit size={16} />,
    },
    ...(userData.isAdmin || isOrderAdmin
      ? []
      : [
        {
          name: 'Orders',
          href: '/profile/orders',
          icon: <Clock size={16} />,
        },
        {
          name: 'Wishlist',
          href: '/profile/wishlist',
          icon: <Star size={16} />,
        },
      ]),
  ];

  return (
    <DropdownMenu open={desktopProfileOpen} onOpenChange={setDesktopProfileOpen}>
      <DropdownMenuTrigger>
        <Avatar className='size-7'>
          <AvatarImage src={userData?.image || '/Logo.png'} alt={userData?.name || 'user picture'} />
          <AvatarFallback className='uppercase bg-muted-foreground text-muted'>{userData?.name?.split(' ').map((name) => name[0]).join('')}</AvatarFallback>
        </Avatar>

      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-3 mt-2" align="end">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium"> Welcome {userData?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{userData?.email}</p>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <div className="grid grid-cols-2 gap-2 mb-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="p-1.5 bg-gray-100 rounded-full mb-1.5">{item.icon}</div>
              <span className="text-xs text-center">{item.name}</span>
            </Link>
          ))}
        </div>

        <DropdownMenuSeparator className="my-2" />

        <button
          onClick={() => {
            // Clear all items from localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            // Redirect to home page
            window.location.href = '/';
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Header;
