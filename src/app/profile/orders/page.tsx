'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { Star, Search } from 'lucide-react';
import Loading from '@/loading';
import Link from 'next/link';

interface OrderListItem {
  id: string;
  orderId: string;
  name: string;
  status: string;
  date: string;
  price: string;
  rating: number;
  images: string[];
}

export default function OrderHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderData, setOrderData] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;
  type ApiOrderItem = {
    name: string;
    image: string;
    price: number;
    qty: number;
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          const response = await fetch(`/api/orders?userId=${user.id}`);
          if (response.ok) {
            const result = await response.json();
            const orders = result.success ? result.data : ([] as ApiOrder[]);
            type ApiOrder = {
              id?: string;
              _id?: string;
              orderId?: string;
              items?: Array<{ name?: string; image?: string }>;
              status?: string;
              images: string[];
              orderItems: ApiOrderItem[];
              createdAt: string;
              total?: number;
              totalPrice: number;
              isCancelled: boolean;
              isDelivered: boolean;
            };

            setOrderData(
              orders.map(
                (order: ApiOrder): OrderListItem => ({
                  id: order._id || '',
                  orderId: order.orderId || `ORD_${order._id?.slice(-8).toUpperCase() || ''}`,
                  name: order.orderItems?.[0]?.name || 'Order Items',
                  status: order.isCancelled
                    ? 'Cancelled'
                    : order.isDelivered
                      ? 'Delivered'
                      : 'In Progress',
                  date: new Date(order.createdAt).toLocaleDateString(),
                  price: `Rs. ${order.totalPrice.toLocaleString()}`,
                  rating: 5,
                  images: order.orderItems.map((item: ApiOrderItem) => item.image) || [],
                }),
              ),
            );
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on status, date, and search
  const filteredOrders = orderData.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Paginate filtered orders
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Order"
        titleHighlight="History"
        subtitle="Track all your purchases in their current status"
      />

      <div className="max-w-[85rem] mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

         

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by Order ID/Product Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
         <Loading/>
        ) : (
          <div >
            {paginatedOrders.map((order) => (
              <Link href={`/order/${order.id}`} key={order.id}>
              <Card key={order.id} className="shadow-sm mb-10 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={order.images[0] || '/product-1.jpg'}
                        alt={order.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-500">Ref: {order.id}</p>
                        </div>
                       
                      </div>
                      
                      <p className="text-gray-600">{order.name}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>

                      <div className="flex items-center gap-2">{renderStars(order.rating)}</div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className="text-2xl font-bold text-(--color-logo)">{order.price}</span>
                      <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span> 
                     
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>        
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        )}

        {/* No Results */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
