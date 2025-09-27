import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getImageUrl } from '@/lib/utils';
import { OrderData, OrderItem } from '@/types';
import DownloadPDFButton from '@/app/order/[id]/DownloadPDFButton';
import { CheckIcon, TruckIcon, PackageIcon } from 'lucide-react';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/components/ui/timeline';

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
  const orderId = order.orderId;

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

              {order.isCancelled && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-red-700 text-xs sm:text-sm font-medium">This order was cancelled{order.cancelledAt ? ` on ${new Date(order.cancelledAt).toLocaleDateString('en-US')}` : ''}.</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <DownloadPDFButton order={order} orderId={orderId} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Order Summary & Timeline */}
          <div className="lg:col-span-3 space-y-6">
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
                <div className="space-y-2 max-w-sm break-words">
                  <span className="text-gray-600 font-medium">Shipping Address:</span>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-medium text-gray-900 break-words">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p className="text-gray-700 break-words">{order.shippingAddress?.address}</p>
                    <p className="text-gray-700">
                      {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                    </p>
                    <p className="text-gray-700">{order.shippingAddress?.country || 'Pakistan'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
          <div className='lg:col-span-2'>
            {/* Order Timeline */}
            <Card className='h-full'>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline
                  defaultValue={
                    order.isDelivered ? 4 : order.isShipped ? 3 : order.isConfirmed ? 2 : 1
                  }
                >
                  <TimelineItem step={1}>
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineDate>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TimelineDate>
                      <TimelineTitle>Order Placed</TimelineTitle>
                      <TimelineIndicator className="group-data-completed/timeline-item:bg-(--color-logo) group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none">
                        <PackageIcon
                          className="group-not-data-completed/timeline-item:hidden"
                          size={16}
                        />
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent>
                      Your order has been successfully placed and is being processed.
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem step={2}>
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineDate>
                        {order.confirmedAt
                          ? new Date(order.confirmedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : 'Pending'}
                      </TimelineDate>
                      <TimelineTitle>Order Confirmed</TimelineTitle>
                      <TimelineIndicator className="group-data-completed/timeline-item:bg-(--color-logo) group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none">
                        <CheckIcon
                          className="group-not-data-completed/timeline-item:hidden"
                          size={16}
                        />
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent>
                      {order.isConfirmed
                        ? 'Your order has been confirmed and is being prepared for shipment.'
                        : 'Waiting for order confirmation from our team.'}
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem step={3}>
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineDate>
                        {order.shippedAt
                          ? new Date(order.shippedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : order.isConfirmed
                            ? 'In Progress'
                            : 'Pending'}
                      </TimelineDate>
                      <TimelineTitle>Order Shipped</TimelineTitle>
                      <TimelineIndicator className="group-data-completed/timeline-item:bg-(--color-logo) group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none">
                        <TruckIcon
                          className="group-not-data-completed/timeline-item:hidden"
                          size={16}
                        />
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent>
                      {order.isShipped
                        ? 'Your order is on its way! Track your package for real-time updates.'
                        : order.isConfirmed
                          ? 'Your order is being prepared for shipment.'
                          : 'Order needs to be confirmed before shipping.'}
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem step={4}>
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineDate>
                        {order.deliveredAt
                          ? new Date(order.deliveredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : 'Pending'}
                      </TimelineDate>
                      <TimelineTitle>Order Delivered</TimelineTitle>
                      <TimelineIndicator className="group-data-completed/timeline-item:bg-(--color-logo) group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center group-data-completed/timeline-item:border-none">
                        <CheckIcon
                          className="group-not-data-completed/timeline-item:hidden"
                          size={16}
                        />
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent>
                      {order.isDelivered
                        ? 'Your order has been successfully delivered. Thank you for your purchase!'
                        : "Your order will be delivered once it's shipped."}
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card className='mt-6'>
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
                        <td className="py-4">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {/* Enhanced Variant Details with Sub and SubSub Variants */}
                            {item.variants && item.variants.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {item.variants.map(
                                  (
                                    variant: {
                                      variantName: string;
                                      optionValue: string;
                                      optionLabel?: string;
                                      optionDetails?: {
                                        priceModifier?: number;
                                        sku?: string;
                                        customProperties?: Record<string, unknown>;
                                      };
                                      subVariants?: Array<{
                                        subVariantName: string;
                                        optionValue: string;
                                        optionLabel?: string;
                                        optionDetails?: {
                                          priceModifier?: number;
                                          sku?: string;
                                          customProperties?: Record<string, unknown>;
                                        };
                                        subSubVariants?: Array<{
                                          subSubVariantName: string;
                                          optionValue: string;
                                          optionLabel?: string;
                                          optionDetails?: {
                                            priceModifier?: number;
                                            sku?: string;
                                            customProperties?: Record<string, unknown>;
                                          };
                                        }>;
                                      }>;
                                    },
                                    idx: number,
                                  ) => (
                                    <div key={idx} className="text-xs rounded-r-lg py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold capitalize">
                                          {variant.variantName}:
                                        </span>
                                        <span className="bg-blue-200 px-2 py-1 rounded font-medium text-blue-900">
                                          {variant.optionValue}
                                        </span>
                                        {typeof variant.optionDetails?.priceModifier === 'number' &&
                                          variant.optionDetails.priceModifier !== 0 && (
                                            <span
                                              className={`px-2 py-1 rounded text-xs font-medium ${(variant.optionDetails?.priceModifier ?? 0) > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                              {(variant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}
                                              Rs.{variant.optionDetails?.priceModifier}
                                            </span>
                                          )}
                                      </div>

                                      {variant.optionDetails?.sku && (
                                        <div className="text-gray-600 mb-1">
                                          <span className="font-medium">SKU:</span> {variant.optionDetails.sku}
                                        </div>
                                      )}

                                      {variant.optionDetails?.customProperties &&
                                        Object.keys(variant.optionDetails.customProperties).length > 0 && (
                                          <div className="mb-2">
                                            <div className="font-medium text-gray-700 mb-1">Properties:</div>
                                            {Object.entries(variant.optionDetails.customProperties).map(([key, value]: [string, unknown]) => (
                                              <div key={key} className="text-gray-600 flex items-center gap-2">
                                                <span className="capitalize font-medium">
                                                  {key.replace(/_/g, ' ')}:
                                                </span>
                                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      {/* Sub-variants */}
                                      {variant.subVariants && variant.subVariants.length > 0 && (
                                        <div className="ml-3 mt-2 space-y-2 border-l-2 border-green-300 pl-3 bg-green-50 rounded-r p-2">
                                          <div className="font-semibold text-green-800 text-xs">Sub-variants:</div>
                                          {variant.subVariants.map((subVariant, subIdx) => (
                                            <div key={subIdx} className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-green-700">{subVariant.subVariantName}:</span>
                                                <span className="bg-green-200 px-2 py-0.5 rounded text-green-900 font-medium">
                                                  {subVariant.optionValue}
                                                </span>
                                                {typeof subVariant.optionDetails?.priceModifier === 'number' && subVariant.optionDetails.priceModifier !== 0 && (
                                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${(subVariant.optionDetails?.priceModifier ?? 0) > 0
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-cyan-100 text-cyan-800'
                                                    }`}>
                                                    {(subVariant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.{subVariant.optionDetails?.priceModifier}
                                                  </span>
                                                )}
                                              </div>

                                              {subVariant.optionDetails?.sku && (
                                                <div className="text-gray-600 ml-2">
                                                  <span className="font-medium">SKU:</span> {subVariant.optionDetails.sku}
                                                </div>
                                              )}

                                              {/* Sub-sub-variants */}
                                              {subVariant.subSubVariants && subVariant.subSubVariants.length > 0 && (
                                                <div className="ml-3 mt-1 space-y-1 border-l-2 border-purple-300 pl-3 bg-purple-50 rounded-r p-2">
                                                  <div className="font-semibold text-purple-800 text-xs">Sub-sub-variants:</div>
                                                  {subVariant.subSubVariants.map((subSubVariant, subSubIdx) => (
                                                    <div key={subSubIdx} className="flex items-center gap-2">
                                                      <span className="font-medium text-purple-700 text-xs">{subSubVariant.subSubVariantName}:</span>
                                                      <span className="bg-purple-200 px-2 py-0.5 rounded text-purple-900 font-medium text-xs">
                                                        {subSubVariant.optionValue}
                                                      </span>
                                                      {typeof subSubVariant.optionDetails?.priceModifier === 'number' && subSubVariant.optionDetails.priceModifier !== 0 && (
                                                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${(subSubVariant.optionDetails?.priceModifier ?? 0) > 0
                                                          ? 'bg-pink-100 text-pink-800'
                                                          : 'bg-teal-100 text-teal-800'
                                                          }`}>
                                                          {(subSubVariant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.{subSubVariant.optionDetails?.priceModifier}
                                                        </span>
                                                      )}
                                                      {subSubVariant.optionDetails?.sku && (
                                                        <span className="text-gray-500 text-xs ml-2">
                                                          SKU: {subSubVariant.optionDetails.sku}
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                            {/* Legacy color/size */}
                            {(item.color || item.size) && (
                              <div className="mt-1 flex gap-2 text-xs">
                                {item.color && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    Color: {item.color}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    Size: {item.size}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">{item.qty}</td>
                        <td className="py-4">
                          {typeof item.salePercent === 'number' && item.salePercent > 0 ? (
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

                      {/* Variant Details */}
                      {item.variants && item.variants.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {item.variants.map(
                            (
                              variant: {
                                variantName: string;
                                optionValue: string;
                                optionLabel?: string;
                                optionDetails?: {
                                  priceModifier?: number;
                                  sku?: string;
                                  customProperties?: Record<string, unknown>;
                                };
                                subVariants?: Array<{
                                  subVariantName: string;
                                  optionValue: string;
                                  optionLabel?: string;
                                  optionDetails?: {
                                    priceModifier?: number;
                                    sku?: string;
                                    customProperties?: Record<string, unknown>;
                                  };
                                  subSubVariants?: Array<{
                                    subSubVariantName: string;
                                    optionValue: string;
                                    optionLabel?: string;
                                    optionDetails?: {
                                      priceModifier?: number;
                                      sku?: string;
                                      customProperties?: Record<string, unknown>;
                                    };
                                  }>;
                                }>;
                              },
                              idx: number,
                            ) => (
                              <div key={idx} className="text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-700 capitalize">
                                    {variant.variantName}:
                                  </span>
                                  <span className="bg-blue-100 text-white font-semibold px-2 py-1 rounded" style={{ backgroundColor: variant.optionValue.toLowerCase() }}>
                                    {variant.optionValue}
                                  </span>
                                  {typeof variant.optionDetails?.priceModifier === 'number' &&
                                    variant.optionDetails.priceModifier !== 0 && (
                                      <span
                                        className={`px-2 py-1 rounded text-xs ${(variant.optionDetails?.priceModifier ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}
                                      >
                                        {(variant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.
                                        {variant.optionDetails?.priceModifier}
                                      </span>
                                    )}
                                </div>
                                {variant.optionDetails?.sku && (
                                  <div className="text-gray-500 mb-1">
                                    SKU: {variant.optionDetails?.sku}
                                  </div>
                                )}
                                {variant.optionDetails?.customProperties &&
                                  Object.keys(variant.optionDetails.customProperties).length > 0 && (
                                    <div className="space-y-1">
                                      {Object.entries(variant.optionDetails.customProperties).map(([key, value]: [string, unknown]) => (
                                        <div key={key} className="text-gray-600">
                                          <span className="capitalize">{key.replace(/_/g, ' ')}: </span>
                                          <span className="bg-gray-100 px-1 py-0.5 rounded">
                                            {typeof value === 'string' ? value : JSON.stringify(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                {/* Sub-variants */}
                                {variant.subVariants && variant.subVariants.length > 0 && (
                                  <div className="ml-2 mt-2 space-y-2 border-l border-green-200 pl-2 bg-green-50 rounded-r">
                                    <div className="font-semibold text-green-800 text-[10px] uppercase tracking-wide">Sub-variants</div>
                                    {variant.subVariants.map((subVariant, subIdx) => (
                                      <div key={subIdx} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-green-700">{subVariant.subVariantName}:</span>
                                          <span className="bg-green-200 px-2 py-0.5 rounded text-green-900 font-medium">
                                            {subVariant.optionValue}
                                          </span>
                                          {typeof subVariant.optionDetails?.priceModifier === 'number' && subVariant.optionDetails.priceModifier !== 0 && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${(subVariant.optionDetails?.priceModifier ?? 0) > 0 ? 'bg-orange-100 text-orange-800' : 'bg-cyan-100 text-cyan-800'}`}>
                                              {(subVariant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.{subVariant.optionDetails?.priceModifier}
                                            </span>
                                          )}
                                        </div>
                                        {subVariant.optionDetails?.sku && (
                                          <div className="text-gray-600 ml-2">
                                            <span className="font-medium">SKU:</span> {subVariant.optionDetails.sku}
                                          </div>
                                        )}

                                        {/* Sub-sub-variants */}
                                        {subVariant.subSubVariants && subVariant.subSubVariants.length > 0 && (
                                          <div className="ml-2 mt-1 space-y-1 border-l border-purple-200 pl-2 bg-purple-50 rounded-r">
                                            <div className="font-semibold text-purple-800 text-[10px] uppercase tracking-wide">Sub-sub-variants</div>
                                            {subVariant.subSubVariants.map((subSubVariant, subSubIdx) => (
                                              <div key={subSubIdx} className="flex items-center gap-2">
                                                <span className="font-medium text-purple-700 text-xs">{subSubVariant.subSubVariantName}:</span>
                                                <span className="bg-purple-200 px-2 py-0.5 rounded text-purple-900 font-medium text-xs">
                                                  {subSubVariant.optionValue}
                                                </span>
                                                {typeof subSubVariant.optionDetails?.priceModifier === 'number' && subSubVariant.optionDetails.priceModifier !== 0 && (
                                                  <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${(subSubVariant.optionDetails?.priceModifier ?? 0) > 0 ? 'bg-pink-100 text-pink-800' : 'bg-teal-100 text-teal-800'}`}>
                                                    {(subSubVariant.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.{subSubVariant.optionDetails?.priceModifier}
                                                  </span>
                                                )}
                                                {subSubVariant.optionDetails?.sku && (
                                                  <span className="text-gray-500 text-[10px] ml-2">SKU: {subSubVariant.optionDetails.sku}</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {/* Legacy color/size */}
                      {(item.color || item.size) && (
                        <div className="mb-3 flex gap-2 text-xs">
                          {item.color && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Color: {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{item.qty}</span>
                        </div>
                        {typeof item.salePercent === 'number' && item.salePercent > 0 && (
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
    </div>
  );
}