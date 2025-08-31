'use server';

import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

export async function createOrder(formData: FormData) {
  try {
    await dbConnect();

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
    revalidatePath('/admin/orders');
    revalidatePath('/profile/orders');
    return { success: true, data: order.toObject() };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

export async function getOrders(userId?: string) {
  try {
    await dbConnect();
    const query = userId ? { user: userId } : {};
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name slug images')
      .sort({ createdAt: -1 });
    
    return { success: true, data: orders.map((order) => order.toObject()) };
  } catch (error) {
    return { success: false, error: 'Failed to fetch orders' };
  }
}

export async function getOrderById(id: string) {
  try {
    await dbConnect();
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name slug images');
    
    return { success: true, data: order ? order.toObject() : null };
  } catch (error) {
    return { success: false, error: 'Failed to fetch order' };
  }
}

export async function updateOrderStatus(id: string, formData: FormData) {
  try {
    await dbConnect();
    
    const updateData: any = {};
    
    if (formData.get('isPaid') !== null) {
      updateData.isPaid = formData.get('isPaid') === 'true';
      if (updateData.isPaid) updateData.paidAt = new Date();
    }
    
    if (formData.get('isDelivered') !== null) {
      updateData.isDelivered = formData.get('isDelivered') === 'true';
      if (updateData.isDelivered) updateData.deliveredAt = new Date();
    }
    
    if (formData.get('isCancelled') !== null) {
      updateData.isCancelled = formData.get('isCancelled') === 'true';
      if (updateData.isCancelled) {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = formData.get('cancellationReason');
      }
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePath('/admin/orders');
    revalidatePath('/profile/orders');
    return { success: true, data: order ? order.toObject() : null };
  } catch (error) {
    return { success: false, error: 'Failed to update order' };
  }
}

export async function cancelOrder(id: string, reason: string) {
  try {
    await dbConnect();
    const order = await Order.findByIdAndUpdate(
      id,
      {
        isCancelled: true,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      { new: true }
    );
    
    revalidatePath('/admin/orders');
    revalidatePath('/profile/orders');
    return { success: true, data: order ? order.toObject() : null };
  } catch (error) {
    return { success: false, error: 'Failed to cancel order' };
  }
}