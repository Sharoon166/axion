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

    // Get cancellation reason from request body
    let cancellationReason = '';
    try {
      const body = await request.json();
      cancellationReason = body.cancellationReason || '';
    } catch {
      // If body parsing fails, continue with empty reason
    }

    // Get the current order
    const currentOrder = (await Order.findById(id).lean()) as OrderDocument | null;
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Check if order is already cancelled
    if (currentOrder.isCancelled) {
      return NextResponse.json(
        { success: false, error: 'Order is already cancelled' },
        { status: 400 },
      );
    }

    // Check if order can be cancelled (not delivered)
    if (currentOrder.isDelivered) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a delivered order' },
        { status: 400 },
      );
    }

    const now = new Date();

    // Restore stock before updating order status
    let stockRestorationResults: StockUpdateResult[] = [];
    try {
      console.log(`Restoring stock for cancelled order ${id}`);
      stockRestorationResults = await restoreStockForCancelledOrder(currentOrder.orderItems);

      const failedRestorations = stockRestorationResults.filter((result) => !result.success);
      if (failedRestorations.length > 0) {
        console.warn(`Some stock restorations failed for order ${id}:`, failedRestorations);
      }

      const successfulRestorations = stockRestorationResults.filter((result) => result.success);
      console.log(
        `Successfully restored stock for ${successfulRestorations.length} products in order ${id}`,
      );
    } catch (error) {
      console.error(`Error restoring stock for cancelled order ${id}:`, error);
      // Continue with cancellation even if stock restoration fails
    }

    // Update order status to cancelled
    const updateData = {
      isCancelled: true,
      cancelledAt: now,
      cancellationReason,
      // Reset other status fields
      isConfirmed: false,
      isShipped: false,
      isDelivered: false,
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
    };

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
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

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 },
      );
    }

    // Prepare response with stock restoration details
    const response = {
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully',
      stockRestoration: {
        attempted: stockRestorationResults.length,
        successful: stockRestorationResults.filter((r) => r.success).length,
        failed: stockRestorationResults.filter((r) => !r.success).length,
        details: stockRestorationResults,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error cancelling order:', error);

    if (error instanceof Error && error.message === 'DB timeout') {
      return NextResponse.json(
        { success: false, error: 'Database connection timeout. Please try again.' },
        { status: 504 },
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to cancel order' }, { status: 500 });
  }
}
