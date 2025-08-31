'use client';

import { useState, useEffect } from 'react';
import { redirect, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useActions } from '@/hooks/useActions';
import { Edit3, ShoppingBag, Heart,  MapPin, Mail, Phone } from 'lucide-react';
import ProfileSidebar from '@/components/ProfileSidebar';

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  address?: string;
  phone?: string;
  isAdmin?: boolean;
}

// Helper Components
const ProfileCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const OrderItem = ({ id, name, status, image, date }: { id: string; name: string; status: string; image: string; date: string }) => (
  <div className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50">
    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
      <Image src={image} alt={name} width={64} height={64} className="object-cover w-full h-full" />
    </div>
    <div className="ml-4 flex-1">
      <h4 className="font-medium text-gray-900">{name}</h4>
      <p className="text-sm text-gray-500">Order #{id}</p>
      <p className="text-xs text-gray-400 mt-1">{date}</p>
    </div>
    <Badge variant={status === 'Delivered' ? 'default' : 'secondary'} className="ml-4">
      {status}
    </Badge>
  </div>
);

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [orderHistory, setOrderHistory] = useState<Array<{ id: string; name: string; status: string; image: string; date: string }>>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');

    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
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
          const orders = result.success ? result.data : [];
          setOrderHistory(orders.map((order: any) => ({
            id: order.id,
            name: order.items?.[0]?.name || 'Order Items',
            status: order.status,
            image: order.items?.[0]?.image || '/prodcut-1.jpg',
            date: new Date(order.createdAt).toLocaleDateString()
          })));
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [userData?.id]);

  // Fetch wishlist items
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userData?.id) return;
      
      setLoadingWishlist(true);
      try {
        const response = await fetch(`/api/products?featured=true&limit=8`);
        if (response.ok) {
          const products = await response.json();
          setWishlistItems(products);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchWishlist();
  }, [userData?.id]);

  const renderProfileContent = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <ProfileCard title="Personal Information">
        <div className="flex items-start space-x-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden">
              <Image
                src={userData?.avatar || '/about-image.jpg'}
                alt={userData?.name || 'User'}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{userData?.name || 'User'}</h2>
              <Button variant="outline" size="sm" className="flex items-center">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2 text-gray-400" />
                <span>{userData?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-5 h-5 mr-2 text-gray-400" />
                <span>{userData?.phone || 'No phone number provided'}</span>
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{userData?.address || 'No address provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </ProfileCard>

      {/* Recent Orders */}
      <ProfileCard title="Recent Orders">
        {loadingOrders ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orderHistory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orderHistory.slice(0, 3).map((order) => (
              <OrderItem key={order.id} {...order} />
            ))}
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={() => setActiveTab('orders')}>
                View All Orders
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-4 text-gray-500">No orders yet</h4>
            <Button className="mt-4" asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )}
      </ProfileCard>
    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          <p className="text-gray-500">View and track your orders</p>
        </div>
        <Button variant="outline">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Order History
        </Button>
      </div>

      <ProfileCard title="Order History">
        {loadingOrders ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orderHistory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orderHistory.map((order) => (
              <OrderItem key={order.id} {...order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-4 text-gray-500">No orders yet</h4>
            <p className="text-sm text-gray-400 mt-1">Your order history will appear here</p>
            <Button className="mt-6" asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )}
      </ProfileCard>
    </div>
  );

  const renderWishlistContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
        <p className="text-gray-500">Your saved items</p>
      </div>

      <ProfileCard title="Saved Items">
        {loadingWishlist ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading wishlist...</p>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {wishlistItems.map((item, index) => (
              <div key={item.id || index} className="group relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={item.image || '/prodcut-1.jpg'}
                    alt={item.name || `Wishlist item ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-2">
                  <h4 className="font-medium text-sm">{item.name || `Product ${index + 1}`}</h4>
                  <p className="text-sm text-gray-500">Rs.{item.price?.toLocaleString() || '0'}</p>
                </div>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-4 text-gray-500">Your wishlist is empty</h4>
            <p className="text-sm text-gray-400 mt-1">Save items you love for easy access later</p>
            <Button className="mt-6" asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )}
      </ProfileCard>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-500">Manage your account preferences</p>
      </div>

      <ProfileCard title="Personal Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="flex">
              <input
                type="text"
                defaultValue={userData?.name || ''}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
              <Button className="rounded-l-none">Save</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="flex">
              <input
                type="email"
                defaultValue={userData?.email || ''}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
              <Button className="rounded-l-none">Update</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex">
              <input
                type="tel"
                defaultValue={userData?.phone || ''}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your phone number"
              />
              <Button className="rounded-l-none">Save</Button>
            </div>
          </div>
        </div>
      </ProfileCard>

      <ProfileCard title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
          <div className="pt-2">
            <Button>Update Password</Button>
          </div>
        </div>
      </ProfileCard>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) {
    redirect('/login');
  }

  // Main layout with conditional sidebar and content
  return (
    <div className="flex min-h-screen bg-gray-50">
      {!userData?.isAdmin && <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'profile' && renderProfileContent()}
          {activeTab === 'orders' && renderOrdersContent()}
          {activeTab === 'wishlist' && renderWishlistContent()}
          {activeTab === 'settings' && renderSettingsContent()}
        </div>
      </main>
    </div>
  );
}