import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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

    // Fetch order with error handling for population
    const order = await Order.findById(id)
      .populate({
        path: 'user',
        select: 'name email',
      })
      .populate({
        path: 'orderItems.product',
        select: 'name slug images',
      })
      .lean(); // Use lean() instead of toObject() for better performance

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
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

    // Parse form data
    const formData = await request.formData();
    const updateData: OrderUpdateData = {};

    // Handle payment status
    if (formData.has('isPaid')) {
      updateData.isPaid = formData.get('isPaid') === 'true';
      if (updateData.isPaid) {
        updateData.paidAt = new Date();
      } else {
        updateData.paidAt = null;
      }
    }

    // Handle delivery status
    if (formData.has('isDelivered')) {
      updateData.isDelivered = formData.get('isDelivered') === 'true';
      if (updateData.isDelivered) {
        updateData.deliveredAt = new Date();
      } else {
        updateData.deliveredAt = null;
      }
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
        'shipping.updatedAt': new Date()
      };

      if (trackingNumber) {
        updateData.$set['shipping.trackingNumber'] = trackingNumber.toString();
      }

      if (carrier) {
        updateData.$set['shipping.carrier'] = carrier.toString();
      }
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true // Ensure validations are run
      }
    )
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'orderItems.product',
        select: 'name slug images'
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}