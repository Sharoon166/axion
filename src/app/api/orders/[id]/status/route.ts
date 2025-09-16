export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const { id } = await params;
    console.log(`[UPDATE_STATUS] Received request for Order ID: ${id}`);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order id' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    let status = searchParams.get('status');

    if (!status) {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await req.json().catch(() => ({}));
        status = body?.status;
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        const text = await req.text();
        const paramsObj = Object.fromEntries(new URLSearchParams(text));
        status = (paramsObj as Record<string, string>).status;
      } else if (ct.includes('multipart/form-data')) {
        const fd = await req.formData();
        status = (fd.get('status') as string) || null;
      }
    }

    const allowed = ['ordered', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
    if (!status || !allowed.includes(status as 'ordered' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing status' },
        { status: 400 }
      );
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const update: Record<string, boolean | Date | null> = {};

    if (status === 'ordered') {
      update.isConfirmed = false;
      update.isShipped = false;
      update.isDelivered = false;
      update.isCancelled = false;
      update.confirmedAt = null;
      update.shippedAt = null;
      update.deliveredAt = null;
      update.cancelledAt = null;
    } else if (status === 'confirmed') {
      update.isConfirmed = true;
      update.isShipped = false;
      update.isDelivered = false;
      update.isCancelled = false;
      update.confirmedAt = existingOrder.confirmedAt || new Date();
      update.shippedAt = null;
      update.deliveredAt = null;
      update.cancelledAt = null;
    } else if (status === 'shipped') {
      update.isConfirmed = true;
      update.isShipped = true;
      update.isDelivered = false;
      update.isCancelled = false;
      update.confirmedAt = existingOrder.confirmedAt || new Date();
      update.shippedAt = existingOrder.shippedAt || new Date();
      update.deliveredAt = null;
      update.cancelledAt = null;
    } else if (status === 'delivered') {
      update.isConfirmed = true;
      update.isShipped = true;
      update.isDelivered = true;
      update.isCancelled = false;
      update.confirmedAt = existingOrder.confirmedAt || new Date();
      update.shippedAt = existingOrder.shippedAt || new Date();
      update.deliveredAt = existingOrder.deliveredAt || new Date();
      update.cancelledAt = null;
    } else if (status === 'cancelled') {
      update.isCancelled = true;
      update.isDelivered = false; // Explicitly set, might be redundant but safe
      update.isShipped = false;
      update.cancelledAt = new Date();
    }

    console.log(`[UPDATE_STATUS] New Status: ${status}`);
    console.log(`[UPDATE_STATUS] Update Payload:`, JSON.stringify(update, null, 2));

    const order = await Order.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!order) {
      console.error(`[UPDATE_STATUS] FAILED: Order with ID ${id} not found.`);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    console.log(`[UPDATE_STATUS] SUCCESS: Updated order data:`, JSON.stringify(order.toObject(), null, 2));

    return NextResponse.json({ success: true, data: order.toObject() });
  } catch (err) {
    console.error('Update order status failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
