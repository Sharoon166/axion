import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    let query: any = {};

    // Filter by user if specified
    if (userId) {
      query.user = userId;
    }

    // Filter by status if specified
    if (status) {
      if (status === 'paid') query.isPaid = true;
      if (status === 'delivered') query.isDelivered = true;
      if (status === 'cancelled') query.isCancelled = true;
    }

    let ordersQuery = Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name slug')
      .sort({ createdAt: -1 });

    // Apply limit if specified
    if (limit) {
      ordersQuery = ordersQuery.limit(Number(limit));
    }

    const orders = await ordersQuery;

    return NextResponse.json({
      success: true,
      data: orders.map((order) => order.toObject()),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const orderData = {
      user: formData.get('user'),
      orderItems: JSON.parse(formData.get('orderItems') as string),
      shippingAddress: JSON.parse(formData.get('shippingAddress') as string),
      paymentMethod: formData.get('paymentMethod'),
      itemsPrice: Number(formData.get('itemsPrice')),
      shippingPrice: Number(formData.get('shippingPrice')),
      taxPrice: Number(formData.get('taxPrice')),
      totalPrice: Number(formData.get('totalPrice')),
    };

    const order = await Order.create(orderData);

    return NextResponse.json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 },
    );
  }
}