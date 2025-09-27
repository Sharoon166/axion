'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit3 } from 'lucide-react';
import useWishlist from '@/contexts/WishlistContext';
import Loading from '@/loading';
import PageHeader from '@/components/PageHeader';

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  isOrderAdmin?: boolean;
  avatar?: string;
  address?: string;
  image?: string;
  phone?: string;
  isAdmin?: boolean;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // no tabs; single page layout
  const [orderHistory, setOrderHistory] = useState<
    Array<{ id: string; orderId: string; name: string; status: string; image: string; date: string }>
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { wishlistItems } = useWishlist();

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    const uploadedAvatarUrl = localStorage.getItem('uploadedAvatarUrl');

    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        // Use uploaded avatar URL if available, otherwise use stored avatar
        if (uploadedAvatarUrl) {
          parsedUserData.avatar = uploadedAvatarUrl;
        }
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        redirect('/login');
      }
    } else {
      // No user data in localStorage, redirect to login
      redirect('/login');
    }

    setIsLoading(false);
  }, []);

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.id) return;

      setLoadingOrders(true);
      try {
        const response = await fetch(`/api/orders?userId=${userData.id}`);
        if (response.ok) {
          const result = await response.json();
          console.log('Orders API response:', result);
          const orders = result.success ? result.data : ([] as unknown[]);
          type ApiOrder = {
            _id?: string;
            orderId?: string;
            orderItems?: Array<{ name?: string; image?: string }>;
            isDelivered?: boolean;
            isCancelled?: boolean;
            isPaid?: boolean;
            createdAt: string;
          };
          setOrderHistory(
            (orders as ApiOrder[]).map((order, index: number) => ({
              id: order._id || `order-${index}`,
              orderId: order.orderId || `ORD_${order._id?.slice(-8).toUpperCase() || index}`,
              name: order.orderItems?.[0]?.name || 'Order Items',
              status: order.isDelivered
                ? 'Delivered'
                : order.isCancelled
                  ? 'Cancelled'
                  : order.isPaid
                    ? 'Processing'
                    : 'Pending',
              image: order.orderItems?.[0]?.image || '/prodcut-1.jpg',
              date: new Date(order.createdAt).toLocaleDateString(),
            })),
          );
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [userData?.id]);

  if (isLoading) {
    return <Loading />;
  }

  if (!userData) {
    redirect('/login');
  }

  // Single card layout (no sidebar)
  return (
    <div className="min-h-screen  bg-gray-50">
      <PageHeader title="Profile" subtitle="Manage your account details, orders, and preferences" />

      <section className="max-w-[90rem] mx-auto px-4 mt-10 sm:px-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          {/* Header row: avatar, name, email, actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={userData?.image || '/logo.svg'}
                  alt={userData?.name || 'User'}
                  width={80}
                  height={80}
                  className="w-full h-full min-size-4 object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userData?.name || 'User'}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">{userData?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/profile/edit" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Content grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Name</div>
                    <div className="text-gray-800">{userData?.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Email</div>
                    <div className="text-gray-800">{userData?.email || '—'}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Address</div>
                      <div className="text-gray-800">{userData?.address || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-8">
              {/* Order History - Hidden for admin users */}
              {!userData?.isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                    <Link
                      href="/profile/orders"
                      className="text-sm text-[var(--color-logo)] hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {loadingOrders ? (
                      <Loading />
                    ) : orderHistory.length > 0 ? (
                      orderHistory.slice(0, 3).map((o) => (
                        <Link href={`/order/${o.id}`} key={o.id}>
                          <div className="flex items-center mb-2 justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                                <Image
                                  src={o.image}
                                  alt={o.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  Order #{o.orderId}
                                </div>
                                <div className="text-xs text-gray-600">{o.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-xs font-medium ${o.status === 'Delivered' ? 'text-green-600' : o.status === 'Processing' ? 'text-amber-600' : 'text-blue-600'}`}
                              >
                                {o.status}
                              </div>
                              <div className="text-[11px] text-gray-500">{o.date}</div>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No orders yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Wishlist - Hidden for admin users */}
              {!userData?.isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Wishlist</h3>
                    <Link
                      href="/profile/wishlist"
                      className="text-sm text-[var(--color-logo)] hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  {wishlistItems.length > 0 ? (
                    <div className="flex items-center gap-3 overflow-x-auto">
                      {wishlistItems.slice(0, 8).map((item) => (
                        <Link href={`/product/${item.slug}`} key={item._id}>
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.images[0] || '/prodcut-1.jpg'}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Your wishlist is empty.</div>
                  )}
                </div>
              )}

              {/* Admin-specific content */}
              {userData?.isAdmin && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Dashboard</h3>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      <div className="font-medium text-blue-900">Go to Dashboard</div>
                      <div className="text-sm text-blue-700">Manage orders, products, and more</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
