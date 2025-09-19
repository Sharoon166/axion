import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { Types } from 'mongoose';

interface OrderQuery {
  user?: string | Types.ObjectId;
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Connection with timeout
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 10000)
      )
    ]);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const page = Number(searchParams.get('page')) || 1;

    const query: OrderQuery = {};

    if (userId) {
      query.user = userId;
    }

    if (status) {
      switch (status) {
        case 'paid': query.isPaid = true; break;
        case 'delivered': query.isDelivered = true; break;
        case 'cancelled': query.isCancelled = true; break;
      }
    }

    const limitNum = Math.min(Number(limit) || 50, 100); // Cap at 100
    const skip = (page - 1) * limitNum;

    try {
      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('user', 'name email')
          .populate('orderItems.product', 'name slug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean()
          .exec(),
        Order.countDocuments(query)
      ]);

      return NextResponse.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch {
      // Fallback: try without population
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      return NextResponse.json({
        success: true,
        data: orders,
        warning: 'Fetched without population due to error'
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);

    if (error instanceof Error) {
      if (error.message === 'DB timeout') {
        return NextResponse.json(
          { success: false, error: 'Database connection timeout' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}