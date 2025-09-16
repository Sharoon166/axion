import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name slug images');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const formData = await request.formData();

    const updateData: Record<string, string | boolean | File | Date | null> = {};

    // Handle payment status
    if (formData.get('isPaid') !== null) {
      updateData.isPaid = formData.get('isPaid') === 'true';
      if (updateData.isPaid) {
        updateData.paidAt = new Date();
      }
    }

    // Handle delivery status
    if (formData.get('isDelivered') !== null) {
      updateData.isDelivered = formData.get('isDelivered') === 'true';
      if (updateData.isDelivered) {
        updateData.deliveredAt = new Date();
      }
    }

    // Handle cancellation
    if (formData.get('isCancelled') !== null) {
      updateData.isCancelled = formData.get('isCancelled') === 'true';
      if (updateData.isCancelled) {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = formData.get('cancellationReason');
      }
    }

    // Handle tracking info
    if (formData.get('trackingNumber')) {
      updateData['shipping.trackingNumber'] = formData.get('trackingNumber');
      updateData['shipping.carrier'] = formData.get('carrier');
      updateData['shipping.updatedAt'] = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name email')
      .populate('orderItems.product', 'name slug images');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 },
    );
  }
}