import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getImageUrl } from '@/lib/utils';
import { OrderData, OrderItem } from '@/types';
import DownloadPDFButton from '@/app/order/[id]/DownloadPDFButton';

async function getOrderById(orderId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/${orderId}`,
      {
        cache: 'no-store',
      },
    );

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

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getOrderById(id);
  if (!res.success) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    );
  }
  const order: OrderData = res.data;
  const orderId=order.orderId;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Details</h1>
            <div className="space-y-1 mt-1">
              <p className="text-sm sm:text-base text-gray-600">
                <span className="font-medium">Order ID:</span> {order.orderId || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Reference:</span> #{String(id || '').slice(-8)}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <DownloadPDFButton order={order} orderId={orderId} />
          </div>
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
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 font-medium">Order Date:</span>
                    <span className="text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 font-medium">Payment Method:</span>
                    <span className="text-gray-900">{order.paymentMethod}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 font-medium">Delivery Type:</span>
                    <span className="text-gray-900">Standard</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 font-medium">Items:</span>
                    <span className="text-gray-900">{order.orderItems?.length || 0}</span>
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
                      date:
                        new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) +
                        ', ' +
                        new Date(order.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        }),
                      completed: true,
                    },
                    {
                      status: 'Confirmed',
                      date: order.confirmedAt
                        ? new Date(order.confirmedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) +
                          ', ' +
                          new Date(order.confirmedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : 'Pending',
                      completed: Boolean(order.isConfirmed),
                    },
                    {
                      status: 'Shipped',
                      date: order.shippedAt
                        ? new Date(order.shippedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) +
                          ', ' +
                          new Date(order.shippedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : order.isConfirmed
                          ? 'In Progress'
                          : 'Pending',
                      completed: Boolean(order.isShipped) && !order.isDelivered,
                    },
                    {
                      status: 'Delivered',
                      date: order.deliveredAt
                        ? new Date(order.deliveredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) +
                          ', ' +
                          new Date(order.deliveredAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : 'Pending',
                      completed: Boolean(order.isDelivered),
                    },
                  ].map((item, index, steps) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full z-10 ${item.completed ? 'bg-blue-600' : 'bg-gray-300'}`}
                        />
                        {index < steps.length - 1 && (
                          <div className="absolute top-3 left-1/2 w-0.5 h-full -translate-x-1/2 bg-gray-200">
                            <div
                              className="w-full bg-blue-600 transition-all duration-500 ease-in-out"
                              style={{ height: item.completed ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pb-8 -mt-1">
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}
                          >
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

            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-600">
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Quantity</th>
                          <th className="pb-3">Sale</th>
                          <th className="pb-3">Product Price</th>
                          <th className="pb-3">Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.orderItems?.map((item: OrderItem, index: number) => (
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
                            <td className="py-4">
                              {typeof item.salePercent === 'number' &&
                              item.salePercent > 0 ? (
                                <span className="text-green-700 font-medium">
                                  {item.saleName ? `${item.saleName}: ` : ''}
                                  {item.salePercent}% OFF
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-4">Rs. {item.price?.toLocaleString()}</td>
                            <td className="py-4 font-semibold">
                              Rs. {(item.price * item.qty)?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {order.orderItems?.map((item: OrderItem, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-2 truncate">{item.name}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{item.qty}</span>
                            </div>
                            {typeof item.salePercent === 'number' &&
                              item.salePercent > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Sale:</span>
                                  <span className="font-medium text-green-700">
                                    {item.saleName ? `${item.saleName}: ` : ''}
                                    {item.salePercent}% OFF
                                  </span>
                                </div>
                              )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-medium">
                                Rs. {item.price?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-1">
                              <span className="text-gray-600 font-medium">Total:</span>
                              <span className="font-semibold text-green-600">
                                Rs. {(item.price * item.qty)?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold">
                      Total:{' '}
                      <span className="text-xl sm:text-2xl text-(--color-logo)">
                        Rs. {order.totalPrice?.toLocaleString()}
                      </span>
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
                <div className="space-y-1">
                  <span className="text-gray-600 font-medium">Name:</span>
                  <p className="text-gray-900">{order.user?.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <p className="text-gray-900 break-all">{order.user?.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <p className="text-gray-900">{order.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-600 font-medium">Shipping Address:</span>
                  <div className="bg-gray-50  rounded-lg">
                    <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                    <p className="text-gray-700">{order.shippingAddress?.address}</p>
                    <p className="text-gray-700">
                      {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                    </p>
                    <p className="text-gray-700">{order.shippingAddress?.country || 'Pakistan'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
