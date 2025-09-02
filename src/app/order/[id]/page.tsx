import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/utils';

async function getOrderById(orderId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { success: false, error: 'Order not found' };
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: 'Failed to fetch order' };
  }
}

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const res = await getOrderById(params.id);
  if (!res.success) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    );
  }
  const order: any = res.data;

  const getOrderStatus = () => {
    if (order.isCancelled) return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
    if (order.isDelivered) return { text: 'Delivered', color: 'bg-green-100 text-green-800' };
    if (order.isPaid) return { text: 'Paid', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  };

  const status = getOrderStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Details</h1>
            <p className="text-gray-600">Order ID: #{params.id.slice(-6)}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Update Status
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Summary & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Type:</span>
                      <span>Standard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{order.orderItems?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      status: 'Ordered', 
                      date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }), 
                      completed: true 
                    },
                    { 
                      status: 'Confirmed', 
                      date: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date(order.paidAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending', 
                      completed: order.isPaid 
                    },
                    { 
                      status: 'Shipping', 
                      date: order.isPaid ? 'In Progress' : 'Pending', 
                      completed: order.isPaid && !order.isDelivered
                    },
                    { 
                      status: 'Delivered', 
                      date: order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date(order.deliveredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending', 
                      completed: order.isDelivered 
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${item.completed ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>
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

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-600">
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Quantity</th>
                        <th className="pb-3">Product Price</th>
                        <th className="pb-3">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems?.map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-4">
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
                          <td className="py-4 font-medium">{item.name}</td>
                          <td className="py-4">{item.qty}</td>
                          <td className="py-4">{item.price?.toLocaleString()}</td>
                          <td className="py-4 font-semibold">{(item.price * item.qty)?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      Total: <span className="text-2xl">{order.totalPrice?.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer & Payment Details */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{order.user?.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{order.user?.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{order.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Shipping Address:</span>
                  <div className="mt-1">
                    <p className="font-medium">{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                    <p>{order.shippingAddress?.country || 'Pakistan'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Billing Address:</span>
                  <div className="mt-1">
                    <p className="font-medium">{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                    <p>{order.shippingAddress?.country || 'Pakistan'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <Badge className={status.color}>
                    {status.text}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">{order._id.slice(-10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gateway:</span>
                  <span className="font-medium">JazzCash</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


