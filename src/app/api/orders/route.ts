import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { OrderItem } from '@/types';
import Product from '@/models/Products';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const query: Record<string, string | boolean | File> = {};

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

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order id' }, { status: 400 });
    }

    let update: Record<string, string | boolean | File> = {};
    const ct = req.headers.get('content-type') || '';

    if (ct.includes('application/json')) {
      update = await req.json();
    } else if (ct.includes('multipart/form-data')) {
      const fd = await req.formData();
      for (const [key, value] of fd.entries()) {
        if (value === 'true') update[key] = true;
        else if (value === 'false') update[key] = false;
        else update[key] = value;
      }
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const paramsObj = Object.fromEntries(new URLSearchParams(text));
      for (const [k, v] of Object.entries(paramsObj)) {
        if (v === 'true') update[k] = true;
        else if (v === 'false') update[k] = false;
        else update[k] = v;
      }
    } else {
      try { update = await req.json(); } catch { }
    }

    const allowed = [
      'isPaid', 'isDelivered', 'isCancelled',
      'paidAt', 'deliveredAt', 'cancelledAt',
      'cancellationReason'
    ];
    const sanitized: Record<string, string | boolean | File | Date> = {};
    for (const k of allowed) if (k in update) sanitized[k] = update[k];

    if (sanitized.isPaid === true && !sanitized.paidAt) sanitized.paidAt = new Date();
    if (sanitized.isDelivered === true && !sanitized.deliveredAt) sanitized.deliveredAt = new Date();
    if (sanitized.isCancelled === true && !sanitized.cancelledAt) sanitized.cancelledAt = new Date();

    const order = await Order.findByIdAndUpdate(id, { $set: sanitized }, { new: true });
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: order.toObject() });
  } catch (err:unknown) {
    console.error('Order update failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update order', details: err },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    console.log('Order request body:', JSON.stringify(body, null, 2));

    // Log each order item to debug
    body.orderItems?.forEach((item: OrderItem, index: number) => {
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
      orderItems: body.orderItems.map((item:OrderItem) => ({
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
      // New lifecycle defaults
      isConfirmed: false,
      confirmedAt: null,
      isShipped: false,
      shippedAt: null,
      isDelivered: false,
      deliveredAt: null,
      isCancelled: false,
      cancelledAt: null,
    };

    console.log('Processed order data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    // Decrement product stock for each ordered item
    try {
      const updates = order.orderItems.map(async (item: { product?: string; quantity?: number; qty?: number }) => {
        const qty = Number(item.quantity || item.qty || 0);
        if (!item.product || qty <= 0) return;
        // Fetch current stock
        const prod = await Product.findById(item.product).select('stock');
        if (!prod) return;
        const newStock = Math.max(0, Number(prod.stock || 0) - qty);
        await Product.findByIdAndUpdate(item.product, { $set: { stock: newStock } });
      });
      await Promise.all(updates);
    } catch (stockErr) {
      console.error('Stock decrement failed:', stockErr);
    }

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