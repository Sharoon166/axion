'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  LogOut,
  Briefcase,
  Home,
  User,
} from 'lucide-react';

import DashboardOverview from '@/components/dashboard/DashboardOverview';
import OrdersManagement from '@/components/dashboard/OrdersManagement';
import ProductsManagement from '@/components/dashboard/ProductsManagement';
import BlogsManagement from '@/components/dashboard/BlogsManagement';
import ProjectManagement from '@/components/dashboard/ProjectManagement';
import { DashboardData } from '@/lib/actions/dashboard';
import Loading from '@/loading';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  avatar: string;
  image: string;
}

interface DashboardClientProps {
  initialDashboardData: DashboardData;
}

export default function DashboardClient({ initialDashboardData }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();
  const [userData, setUserData] = useState<User>({
    id: '',
    name: '',
    email: '',
    role: '',
    image: '',
    avatar: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  console.log(setDashboardData)
  const activeTab = searchParams.get('tab') || 'dashboard';

  // Load user data on mount
  useEffect(() => {
    const loadUserData = () => {
      const stored = localStorage.getItem('userData');
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setUserData((prev) => {
            const isSame = JSON.stringify(prev) === JSON.stringify(parsedData);
            return isSame ? prev : { ...parsedData };
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      setLoading(false);
    };

    loadUserData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  const isOrderAdmin = userData?.role === 'order admin';

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const changeTab = (tabKey: string) => {
    router.push(`/dashboard?tab=${tabKey}`);
  };

  const adminSidebarItems = [
    { icon: BarChart3, label: 'Dashboard', key: 'dashboard' },
    { icon: ShoppingCart, label: 'Order', key: 'orders' },
    { icon: Package, label: 'Product', key: 'products' },
    { icon: FileText, label: 'Blogs', key: 'blogs' },
    { icon: Briefcase, label: 'Projects', key: 'projects' },
    { icon: LogOut, label: 'Logout', key: 'logout' },
  ];

  const orderAdminSidebarItems = [
    { icon: ShoppingCart, label: 'Order', key: 'orders' },
    { icon: LogOut, label: 'Logout', key: 'logout' },
  ];

  const sidebarItems = isOrderAdmin ? orderAdminSidebarItems : adminSidebarItems;

  if (loading) {
    return <Loading />;
  }

  // Redirect if not admin or order admin
  if (!userData?.isAdmin && userData?.role !== 'order admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar (hidden on small screens) */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <Link
              href="/"
              className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                  <Image
                    src={userData?.avatar || userData?.image || '/Logo.png'}
                    width={100}
                    height={100}
                    alt="Admin"
                    className="size-full object-center object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Admin home</div>
                  <div className="text-sm text-gray-500">{userData?.email}</div>
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-1"
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => (item.key === 'logout' ? handleLogout() : changeTab(item.key))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.key
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </Link>

              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Edit Profile</span>
              </Link>
            </div>

            <div className="grid grid-cols-5 gap-2 bg-white rounded-lg border p-1">
              {sidebarItems
                .filter((item) => item.key !== 'logout')
                .map((item) => (
                  <button
                    key={item.key}
                    onClick={() => changeTab(item.key)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                      activeTab === item.key
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden xs:inline">{item.label}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Dashboard Header with Refresh Button */}
          {activeTab === 'dashboard' && !isOrderAdmin && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
          )}

          {activeTab === 'dashboard' && !isOrderAdmin && (
            <DashboardOverview dashboardData={dashboardData} loadingData={isPending} />
          )}
          {activeTab === 'orders' && <OrdersManagement isOrderAdmin={isOrderAdmin} />}
          {activeTab === 'products' && !isOrderAdmin && <ProductsManagement />}
          {activeTab === 'blogs' && !isOrderAdmin && <BlogsManagement />}
          {activeTab === 'projects' && !isOrderAdmin && <ProjectManagement />}
        </div>
      </div>
    </div>
  );
}
