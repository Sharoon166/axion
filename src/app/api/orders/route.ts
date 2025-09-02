import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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
    const body = await request.json();

    console.log('Order request body:', JSON.stringify(body, null, 2));
    
    // Log each order item to debug
    body.orderItems?.forEach((item: any, index: number) => {
      console.log(`Order item ${index}:`, item);
    });

    // Validate required fields
    if (!body.orderItems || !Array.isArray(body.orderItems) || body.orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!body.shippingAddress || !body.shippingAddress.fullName) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const orderData = {
      user: body.user || null,
      orderItems: body.orderItems.map((item: any) => ({
        name: item.name,
        qty: item.qty || item.quantity || 1,
        quantity: item.quantity || item.qty || 1,
        image: item.image,
        price: Number(item.price) || 0,
        product: String(item.product),
        color: item.color || 'Default',
        size: item.size || 'Standard'
      })),
      shippingAddress: {
        fullName: body.shippingAddress.fullName,
        address: body.shippingAddress.address,
        city: body.shippingAddress.city,
        postalCode: body.shippingAddress.postalCode,
        country: body.shippingAddress.country || 'Pakistan',
        phone: body.shippingAddress.phone || ''
      },
      paymentMethod: body.paymentMethod || 'Bank Transfer / JazzCash',
      itemsPrice: Number(body.itemsPrice) || 0,
      shippingPrice: Number(body.shippingPrice) || 0,
      taxPrice: Number(body.taxPrice) || 0,
      totalPrice: Number(body.totalPrice) || 0,
      customerEmail: body.customerEmail || '',
      isPaid: Boolean(body.isPaid),
      paidAt: body.isPaid ? new Date(body.paidAt) || new Date() : null,
    };

    console.log('Processed order data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    return NextResponse.json({
      success: true,
      data: order.toObject(),
    });
  } catch (error) {
    console.error('Detailed error creating order:', error);
    
    // Return more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create order',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 },
    );
  }
}