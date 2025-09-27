import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { restoreStockForCancelledOrder } from '@/lib/stockManager';
import { OrderItem } from '@/types';

interface StockUpdateResult {
  success: boolean;
  productId: string;
  error?: string;
}

interface OrderDocument {
  _id: string;
  orderItems: OrderItem[];
  isCancelled: boolean;
  isDelivered: boolean;
  isConfirmed: boolean;
  isShipped: boolean;
  user?: string;
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure database connection with retry
    let retries = 3;
    while (retries > 0) {
      try {
        await Promise.race([
          dbConnect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 8000)),
        ]);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const { id } = await params;
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, error: 'Valid order ID is required' },
        { status: 400 },
      );
    }

    // Get status from query params or body
    const { searchParams } = new URL(request.url);
    let status = searchParams.get('status');

    if (!status) {
      try {
        const body = await request.json();
        status = body.status;
      } catch {
        // If body parsing fails, continue with null status
      }
    }

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['ordered', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Get the current order to check if we need to restore stock
    const currentOrder = (await Order.findById(id).lean()) as OrderDocument | null;
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Disallow status changes for cancelled orders
    if (currentOrder.isCancelled) {
      return NextResponse.json(
        { success: false, error: 'Cancelled orders cannot be updated' },
        { status: 400 },
      );
    }

    // Check if order is being cancelled and wasn't cancelled before
    const isBeingCancelled = status === 'cancelled' && !currentOrder.isCancelled;

    // Prepare update data based on status
    const updateData: Record<string, unknown> = {};
    const now = new Date();

    // Reset all status fields first
    updateData.isConfirmed = false;
    updateData.isShipped = false;
    updateData.isDelivered = false;
    updateData.isCancelled = false;
    updateData.confirmedAt = null;
    updateData.shippedAt = null;
    updateData.deliveredAt = null;
    updateData.cancelledAt = null;

    // Set the appropriate status
    switch (status) {
      case 'confirmed':
        updateData.isConfirmed = true;
        updateData.confirmedAt = now;
        break;
      case 'shipped':
        updateData.isConfirmed = true;
        updateData.isShipped = true;
        updateData.confirmedAt = now;
        updateData.shippedAt = now;
        break;
      case 'delivered':
        updateData.isConfirmed = true;
        updateData.isShipped = true;
        updateData.isDelivered = true;
        updateData.confirmedAt = now;
        updateData.shippedAt = now;
        updateData.deliveredAt = now;
        break;
      case 'cancelled':
        updateData.isCancelled = true;
        updateData.cancelledAt = now;
        break;
      // 'ordered' status keeps all fields as false (already set above)
    }

    // Restore stock if order is being cancelled
    if (isBeingCancelled) {
      try {
        console.log(`Restoring stock for cancelled order ${id}`);
        const stockResults: StockUpdateResult[] = await restoreStockForCancelledOrder(
          currentOrder.orderItems,
        );

        const failedRestorations = stockResults.filter((result) => !result.success);
        if (failedRestorations.length > 0) {
          console.warn(`Some stock restorations failed for order ${id}:`, failedRestorations);
        }

        const successfulRestorations = stockResults.filter((result) => result.success);
        console.log(
          `Successfully restored stock for ${successfulRestorations.length} products in order ${id}`,
        );
      } catch (error) {
        console.error(`Error restoring stock for cancelled order ${id}:`, error);
        // Don't fail the order cancellation if stock restoration fails
        // Log the error and continue with the status update
      }
    }

    // Update the order
    const order = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate({
        path: 'user',
        select: 'name email',
        options: { strictPopulate: false },
      })
      .populate({
        path: 'orderItems.product',
        select: 'name slug images',
        options: { strictPopulate: false },
      })
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating order status:', error);

    if (error instanceof Error && error.message === 'DB timeout') {
      return NextResponse.json(
        { success: false, error: 'Database connection timeout. Please try again.' },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 },
    );
  }
}
