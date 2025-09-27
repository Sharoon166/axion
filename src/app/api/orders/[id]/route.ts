import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { OrderData } from '@/types';
import { Types } from 'mongoose';
import { restoreStockForCancelledOrder } from '@/lib/stockManager';
import type { SelectedVariant } from '@/lib/productVariants';

type PopulatedOrder = Omit<OrderData, 'user' | 'orderItems'> & {
  user: {
    _id: Types.ObjectId;
    name?: string;
    email?: string;
  } | Types.ObjectId | null;
  orderItems: Array<{
    _id: Types.ObjectId;
    product: Types.ObjectId | { _id: Types.ObjectId; name?: string; slug?: string; images?: string[] };
    quantity?: number;
    qty?: number;
    price: number;
    variants?: SelectedVariant[];
  }>;
  orderId?: string;
};

// Interface for the update data
interface OrderUpdateData {
  isPaid?: boolean;
  paidAt?: Date | null;
  isDelivered?: boolean;
  deliveredAt?: Date | null;
  isCancelled?: boolean;
  cancelledAt?: Date | null;
  cancellationReason?: string;
  $set?: {
    'shipping.trackingNumber'?: string;
    'shipping.carrier'?: string;
    'shipping.updatedAt'?: Date;
  };
}

// Helper function to handle database connection with retries
async function ensureDbConnection(): Promise<boolean> {
  try {
    await dbConnect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Extract and validate ID
    const { id } = await params;
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, error: 'Valid order ID is required' },
        { status: 400 }
      );
    }

    try {
      // Try to fetch order with full population
      const order = await Order.findById(id)
        .populate({
          path: 'user',
          select: 'name email',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'orderItems.product',
          select: 'name slug images',
          options: { strictPopulate: false }
        })
        .lean() as unknown as PopulatedOrder;

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Ensure orderId is included in the response
      const orderResponse = {
        ...order,
        _id: order._id.toString(),
        orderId: order.orderId || `ORD_${order._id.toString().slice(-8).toUpperCase()}`,
        // Convert any ObjectId fields to strings
        orderItems: order.orderItems.map(item => ({
          ...item,
          _id: item._id.toString(),
          product: typeof item.product === 'object' && item.product !== null && !(item.product instanceof Types.ObjectId)
            ? {
                ...item.product,
                _id: item.product._id.toString()
              }
            : item.product?.toString()
        })),
        // Handle user population
        user: order.user && typeof order.user === 'object' && !(order.user instanceof Types.ObjectId)
          ? {
              _id: order.user._id.toString(),
              name: order.user.name || 'Guest User',
              email: order.user.email || 'guest@example.com'
            }
          : { _id: order.user?.toString() || 'guest', name: 'Guest User', email: 'guest@example.com' }
      };

      return NextResponse.json({
        success: true,
        data: orderResponse,
      });
    } catch (populationError) {
      console.warn('Population failed, trying without:', populationError);
      
      // Fallback: fetch without population
      const order = await Order.findById(id).lean() as unknown as PopulatedOrder;

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Ensure orderId is included in the fallback response
      const orderResponse = {
        ...order,
        _id: order._id.toString(),
        orderId: order.orderId || `ORD_${order._id.toString().slice(-8).toUpperCase()}`,
        // Convert any ObjectId fields to strings
        orderItems: order.orderItems.map(item => ({
          ...item,
          _id: item._id.toString(),
          product: typeof item.product === 'object' && item.product !== null && !(item.product instanceof Types.ObjectId)
            ? {
                ...item.product,
                _id: item.product._id.toString()
              }
            : item.product?.toString()
        })),
        // Handle user population
        user: order.user && typeof order.user === 'object' && !(order.user instanceof Types.ObjectId)
          ? {
              _id: order.user._id.toString(),
              name: order.user.name || 'Guest User',
              email: order.user.email || 'guest@example.com'
            }
          : { _id: order.user?.toString() || 'guest', name: 'Guest User', email: 'guest@example.com' }
      };

      return NextResponse.json({
        success: true,
        data: orderResponse,
        warning: 'Fetched without population due to error'
      });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Extract and validate ID
    const { id } = await params;
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, error: 'Valid order ID is required' },
        { status: 400 }
      );
    }

    // Parse form data from the request
    const formData = await request.formData();
    const updateData: OrderUpdateData = {};

    // Handle payment status
    if (formData.has('isPaid')) {
      updateData.isPaid = formData.get('isPaid') === 'true';
      updateData.paidAt = updateData.isPaid ? new Date() : null;
    }

    // Handle delivery status
    if (formData.has('isDelivered')) {
      updateData.isDelivered = formData.get('isDelivered') === 'true';
      updateData.deliveredAt = updateData.isDelivered ? new Date() : null;
    }

    // Handle cancellation
    if (formData.has('isCancelled')) {
      updateData.isCancelled = formData.get('isCancelled') === 'true';
      if (updateData.isCancelled) {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = formData.get('cancellationReason')?.toString() || '';
      } else {
        updateData.cancelledAt = null;
        updateData.cancellationReason = '';
      }
    }

    // Handle tracking info
    const trackingNumber = formData.get('trackingNumber');
    const carrier = formData.get('carrier');
    if (trackingNumber || carrier) {
      updateData.$set = {
        ...updateData.$set,
        'shipping.updatedAt': new Date(),
      };
      if (trackingNumber) {
        updateData.$set['shipping.trackingNumber'] = trackingNumber.toString();
      }
      if (carrier) {
        updateData.$set['shipping.carrier'] = carrier.toString();
      }
    }

    // Get current order to enforce business rules
    const currentOrder = await Order.findById(id).lean<PopulatedOrder | null>();
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prevent updates to already-cancelled orders unless the action is cancelling now
    const isCancellingNow = formData.get('isCancelled') === 'true';
    const isAlreadyCancelled = currentOrder.isCancelled === true;
    const isOnlyCancellationUpdate = isCancellingNow && Object.keys(updateData).every((k) => ['isCancelled', 'cancelledAt', 'cancellationReason'].includes(k));
    if (isAlreadyCancelled && !isOnlyCancellationUpdate) {
      return NextResponse.json(
        { success: false, error: 'Cancelled orders cannot be updated' },
        { status: 400 }
      );
    }

    // Update order
    const updated = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({ path: 'user', select: 'name email', options: { strictPopulate: false } })
      .populate({ path: 'orderItems.product', select: 'name slug images', options: { strictPopulate: false } })
      .lean() as unknown as PopulatedOrder | null;

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If just cancelled, restore stock (best-effort)
    if (isCancellingNow && !isAlreadyCancelled) {
      try {
        const itemsForStock: Parameters<typeof restoreStockForCancelledOrder>[0] = updated.orderItems
          .map((item) => {
            // Derive string product id from possible shapes
            let productId: string | undefined;
            const prod = (item).product;
            if (prod && typeof prod === 'object' && !(prod instanceof Types.ObjectId)) {
              productId = prod._id?.toString?.();
            } else if (prod) {
              productId = prod.toString?.() ?? String(prod);
            }

            const quantity = item.quantity ?? item.qty ?? 0;

            return {
              product: (productId || ''),
              quantity,
              variants: item.variants,
            };
          })
          // filter out any invalid items that failed to resolve product id
          .filter((i) => typeof i.product === 'string' && i.product.length > 0);

        await restoreStockForCancelledOrder(itemsForStock);
      } catch (e) {
        console.error('Stock restoration failed on cancellation:', e);
      }
    }

    // Normalize response similar to GET
    const orderResponse = {
      ...updated,
      _id: updated._id.toString(),
      orderId: updated.orderId || `ORD_${updated._id.toString().slice(-8).toUpperCase()}`,
      orderItems: updated.orderItems.map(item => ({
        ...item,
        _id: item._id.toString(),
        product: typeof item.product === 'object' && item.product !== null && !(item.product instanceof Types.ObjectId)
          ? {
              ...item.product,
              _id: item.product._id.toString()
            }
          : (item.product as Types.ObjectId | string | undefined)?.toString()
      })),
      user: updated.user && typeof updated.user === 'object' && !(updated.user instanceof Types.ObjectId)
        ? {
            _id: updated.user._id.toString(),
            name: updated.user.name || 'Guest User',
            email: updated.user.email || 'guest@example.com'
          }
        : { _id: updated.user?.toString() || 'guest', name: 'Guest User', email: 'guest@example.com' }
    };

    return NextResponse.json({ success: true, data: orderResponse });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}