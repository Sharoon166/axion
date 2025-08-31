'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  UserCheck,
  FileText,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  // Support both next-auth and localStorage fallback
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const isAdmin = Boolean(session?.user?.isAdmin || localUser?.isAdmin);
  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Admin"
        titleHighlight="Dashboard"
        subtitle="Manage your e-commerce platform"
      />

      <div className="max-w-[85rem] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Admin Panel
                </CardTitle>
                <CardDescription>Welcome back, {session?.user?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Button
                    variant={activeTab === 'overview' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('overview')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === 'orders' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('orders')}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    All Orders
                  </Button>
                  <Button
                    variant={activeTab === 'products' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('products')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </Button>
                  <Button
                    variant={activeTab === 'users' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                  <Button
                    variant={activeTab === 'quick-actions' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('quick-actions')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Actions
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$0.00</div>
                      <p className="text-xs text-muted-foreground">
                        Let&apos;s add first - revenue
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Let's add first - orders</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Let's add first - products</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Let's add first - users</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest orders from your customers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Let's add first - recent orders
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Products</CardTitle>
                      <CardDescription>Products that need restocking</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Let's add first - low stock</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Manage and track all customer orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Order Management</h3>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          View All Orders
                        </Button>
                      </div>
                      <p className="text-muted-foreground">
                        Use the sidebar to navigate to different order management sections.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Add, edit, and manage your product catalog</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Product Catalog</h3>
                        <Button
                          onClick={() => router.push('/admin/products')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Manage Products
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Blog Posts</h3>
                        <Button
                          onClick={() => router.push('/admin/blogs')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Manage Blogs
                        </Button>
                      </div>
                      <p className="text-muted-foreground">
                        Manage your product inventory, categories, and pricing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage customer accounts and admin users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Customer Accounts</h3>
                        <Button>
                          <Users className="w-4 h-4 mr-2" />
                          View All Users
                        </Button>
                      </div>
                      <p className="text-muted-foreground">
                        Monitor user activity, manage roles, and handle customer support.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quick Actions Tab */}
              <TabsContent value="quick-actions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => router.push('/admin/products/new')}
                        className="h-20 flex-col bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="w-6 h-6 mb-2" />
                        Add Product
                      </Button>
                      <Button
                        onClick={() => router.push('/admin/blogs/new')}
                        className="h-20 flex-col bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="w-6 h-6 mb-2" />
                        Add Blog Post
                      </Button>
                      <Button
                        onClick={() => router.push('/admin/products')}
                        className="h-20 flex-col bg-orange-600 hover:bg-orange-700"
                      >
                        <Package className="w-6 h-6 mb-2" />
                        Manage Products
                      </Button>
                      <Button
                        onClick={() => router.push('/admin/blogs')}
                        className="h-20 flex-col bg-purple-600 hover:bg-purple-700"
                      >
                        <FileText className="w-6 h-6 mb-2" />
                        Manage Blogs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure your e-commerce platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Platform Configuration</h3>
                      <p className="text-muted-foreground">
                        Manage system settings, payment methods, shipping options, and more.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
