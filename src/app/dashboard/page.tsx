'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';
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
import Loading from '@/loading';

interface ApiOrder {
  _id?: string;
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
  totalPrice?: number;
  user?: { name?: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  avatar: string;
  image: string;
}

interface ApiProduct {
  name?: string;
  stock?: number;
  images?: string[];
}

interface DashboardsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Array<{ id: string; customer: string; total: number }>;
  topProducts: Array<{ name: string; value: number; image?: string }>;
  lowStockProducts: Array<{
    name: string;
    stock: number;
    status: string;
    color: string;
    image?: string;
    slug: string;
  }>;
  ordersPerDay: number[];
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [dashboardData, setDashboardData] = useState<DashboardsData>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    ordersPerDay: [],
  });
  const [loadingData, setLoadingData] = useState(false);

  const activeTab = searchParams.get('tab') || 'dashboard';

  // Load user data on mount
  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        setUserData(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData?.isAdmin) return;

      setLoadingData(true);
      try {
        const ordersResponse = await fetch('/api/orders');
        const ordersResult = ordersResponse.ok
          ? await ordersResponse.json()
          : { success: false, data: [] };
        const orders: ApiOrder[] = ordersResult.success ? ordersResult.data : [];

        const productsResponse = await fetch('/api/products');
        const productsResult = productsResponse.ok
          ? await productsResponse.json()
          : { success: false, data: [] };
        const products: ApiProduct[] = productsResult.success ? productsResult.data : [];

        const totalOrders = orders.length;
        const pendingOrders = orders.filter(
          (order) => !order.isPaid && !order.isDelivered && !order.isCancelled
        ).length;
        const completedOrders = orders.filter((order) => !!order.isDelivered).length;

        const recentOrders = orders.slice(0, 5).map((order, index: number) => ({
          id: order._id?.slice(-8) || `#27${641 + index}`,
          customer: order.user?.name || `Customer ${index + 1}`,
          total: order.totalPrice || Math.floor(Math.random() * 50000) + 10000,
        }));

        const topProducts = products.slice(0, 3).map((product) => ({
          name: product.name || 'Unknown Product',
          value: product.stock || Math.floor(Math.random() * 30) + 10,
          image: product.images?.[0] || '/prodcut-1.jpg',
        }));

        const lowStockProducts = products
          .filter((product) => (product.stock ?? 0) <= 10)
          .slice(0, 3)
          .map((product) => ({
            name: product.name || 'Unknown',
            stock: product.stock ?? 0,
            status: (product.stock ?? 0) < 5 ? 'Low' : 'Medium',
            color: (product.stock ?? 0) < 5 ? 'bg-red-500' : 'bg-orange-500',
            image: product.images?.[0] || '/prodcut-1.jpg',
            slug: (product.name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
          }));

        setDashboardData({
          totalOrders,
          pendingOrders,
          completedOrders,
          recentOrders,
          topProducts,
          lowStockProducts,
          ordersPerDay: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [userData?.isAdmin]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  if (!userData?.isAdmin) redirect('/');

  const handleLogout = () => {
    localStorage.removeItem('userData');
    window.location.href = '/';
  };

  const changeTab = (tabKey: string) => {
    router.push(`/dashboard?tab=${tabKey}`);
  };

  const sidebarItems = [
    { icon: BarChart3, label: 'Dashboard', key: 'dashboard' },
    { icon: ShoppingCart, label: 'Order', key: 'orders' },
    { icon: Package, label: 'Product', key: 'products' },
    { icon: FileText, label: 'Blogs', key: 'blogs' },
    { icon: Briefcase, label: 'Projects', key: 'projects' },
    { icon: LogOut, label: 'Logout', key: 'logout' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar (hidden on small screens) */}
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <Link
              href="/"
              className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                  <Image
                    src={userData?.avatar || userData?.image || '/avatar.png'}
                    width={48}
                    height={48}
                    alt="Admin"
                    className="rounded-full object-cover"
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
                  onClick={() =>
                    item.key === 'logout' ? handleLogout() : changeTab(item.key)
                  }
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
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Edit Profile</span>
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-white rounded-lg border p-1">
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

          {activeTab === 'dashboard' && (
            <DashboardOverview dashboardData={dashboardData} loadingData={loadingData} />
          )}
          {activeTab === 'orders' && <OrdersManagement />}
          {activeTab === 'products' && <ProductsManagement />}
          {activeTab === 'blogs' && <BlogsManagement />}
          {activeTab === 'projects' && <ProjectManagement />}
        </div>
      </div>
    </div>
  );
}

export default function DashboardRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
