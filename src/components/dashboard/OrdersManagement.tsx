'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: Array<{
    name: string;
    qty: number;
    image: string;
    price: number;
    product: {
      _id: string;
      name: string;
      slug: string;
    };
  }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentResult?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  paidAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Order status counts
  const [orderStats, setOrderStats] = useState({
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const result = await response.json();
        const orders = result.success ? result.data : [];
        setOrders(orders);
        
        // Calculate stats
        const stats = orders.reduce((acc: any, order: Order) => {
          if (order.isCancelled) acc.cancelled++;
          else if (order.isDelivered) acc.delivered++;
          else if (order.isPaid) acc.shipped++;
          else acc.processing++;
          return acc;
        }, { processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
        
        setOrderStats(stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'processing') matchesStatus = !order.isPaid && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'shipped') matchesStatus = order.isPaid && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'delivered') matchesStatus = order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'cancelled') matchesStatus = order.isCancelled;
    }
    
    return matchesSearch && matchesStatus;
  });

  const getOrderStatus = (order: Order) => {
    if (order.isCancelled) return 'cancelled';
    if (order.isDelivered) return 'delivered';
    if (order.isPaid) return 'shipped';
    return 'processing';
  };

  const getStatusColor = (order: Order) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (order: Order) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleOrderClick = (order: Order) => {
    router.push(`/order/${order._id}`);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const formData = new FormData();
      if (newStatus === 'delivered') {
        formData.append('isDelivered', 'true');
      } else if (newStatus === 'paid') {
        formData.append('isPaid', 'true');
      } else if (newStatus === 'cancelled') {
        formData.append('isCancelled', 'true');
      }
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: formData
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh orders
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
      </div>

      {/* Order Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processing}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.shipped}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.delivered}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.cancelled}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Orders will appear here when customers place them</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr 
                        key={order._id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">#{order._id.slice(-8)}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.user.name}</p>
                            <p className="text-sm text-gray-500">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getStatusColor(order)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(order)}
                            {getOrderStatus(order)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">Rs.{order.totalPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
                <DialogDescription>Order ID: #{selectedOrder?._id.slice(-8)}</DialogDescription>
              </div>
              <div className="flex gap-2">
                {selectedOrder && !selectedOrder.isPaid && !selectedOrder.isCancelled && (
                  <Button 
                    variant="outline"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'paid')}
                  >
                    Mark as Paid
                  </Button>
                )}
                {selectedOrder && selectedOrder.isPaid && !selectedOrder.isDelivered && !selectedOrder.isCancelled && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'delivered')}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {selectedOrder && !selectedOrder.isCancelled && !selectedOrder.isDelivered && (
                  <Button 
                    variant="destructive"
                    onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Price:</span>
                      <span>Rs.{selectedOrder.itemsPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span>Rs.{selectedOrder.shippingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span>Rs.{selectedOrder.taxPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-600">Total:</span>
                      <span>Rs.{selectedOrder.totalPrice.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { 
                          status: 'Ordered', 
                          date: new Date(selectedOrder.createdAt).toLocaleString(), 
                          completed: true 
                        },
                        { 
                          status: 'Payment Confirmed', 
                          date: selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString() : 'Pending', 
                          completed: selectedOrder.isPaid 
                        },
                        { 
                          status: 'Shipped', 
                          date: selectedOrder.isPaid ? 'In Progress' : 'Pending Payment', 
                          completed: selectedOrder.isPaid && !selectedOrder.isDelivered
                        },
                        { 
                          status: 'Delivered', 
                          date: selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString() : 'Pending', 
                          completed: selectedOrder.isDelivered 
                        }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            item.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`} />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className={item.completed ? 'text-gray-900' : 'text-gray-500'}>
                                {item.status}
                              </span>
                              <span className="text-sm text-gray-500">{item.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Customer Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{selectedOrder.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedOrder.user.email}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Shipping Address:</span>
                      <div className="text-right max-w-xs">
                        <p>{selectedOrder.shippingAddress.fullName}</p>
                        <p>{selectedOrder.shippingAddress.address}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium ${selectedOrder.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedOrder.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>{selectedOrder.paymentMethod}</span>
                    </div>
                    {selectedOrder.paymentResult && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <span>{selectedOrder.paymentResult.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Email:</span>
                          <span>{selectedOrder.paymentResult.email_address}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Products Table - Full Width */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-medium text-gray-600">Product</th>
                            <th className="text-left py-2 font-medium text-gray-600">Name</th>
                            <th className="text-left py-2 font-medium text-gray-600">Quantity</th>
                            <th className="text-left py-2 font-medium text-gray-600">Product Price</th>
                            <th className="text-left py-2 font-medium text-gray-600">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.orderItems?.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                  <Image
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="py-3 font-medium">{item.name}</td>
                              <td className="py-3">{item.qty}</td>
                              <td className="py-3">Rs.{item.price.toLocaleString()}</td>
                              <td className="py-3 font-semibold">Rs.{(item.price * item.qty).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          Total: <span className="text-blue-600">Rs.{selectedOrder.totalPrice.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}