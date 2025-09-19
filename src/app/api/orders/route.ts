import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Products';
import { Types } from 'mongoose';
import { OrderItem } from '@/types';

interface OrderQuery {
  user?: string | Types.ObjectId;
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.orderItems || !Array.isArray(body.orderItems) || body.orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one order item is required' },
        { status: 400 },
      );
    }

    if (!body.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 },
      );
    }

    if (!body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 },
      );
    }

    // Process order items to ensure sale information is included
    const processedOrderItems = body.orderItems.map((item: OrderItem) => ({
      ...item,
      saleName: item.saleName || null,
      salePercent: item.salePercent || null,
    }));

    // Create new order
    const order = new Order({
      user: body.user || body.userId || null,
      customerEmail: body.customerEmail || null,
      orderItems: processedOrderItems,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      itemsPrice: body.itemsPrice || 0,
      shippingPrice: body.shippingPrice || 0,
      taxPrice: body.taxPrice || 0,
      totalPrice: body.totalPrice || 0,
      isPaid: false,
      isDelivered: false,
      paymentResult: body.paymentResult || {},
    });

    const createdOrder = await order.save();

    // Update product stock for each item in the order
    for (const item of body.orderItems) {
      try {
        const product = await Product.findById(item.product);
        if (!product) {
          console.warn(`Product not found: ${item.product}`);
          continue;
        }

        // For non-variant products, just update the main stock
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: -item.quantity } }
        );

        // If the product has variants but no variant info is provided in the order,
        // we'll just log a warning and continue
        if (product.variants && product.variants.length > 0 && (!item.variants || item.variants.length === 0)) {
          console.warn(`Product has variants but order item doesn't specify any: ${item.product}`);
          // We still update the main stock as a fallback (already done above)
          continue;
        }

        // Handle variant products if variant info is provided
        if (item.variants && item.variants.length > 0) {
          const variantName = item.variants[0].variantName;
          const optionValue = item.variants[0].optionValue;

          // Find the variant in the database
          const variant = product.variants.find((v: { name: string }) => v.name === variantName);
          if (!variant) {
            console.warn(`Variant not found: ${variantName} in product ${item.product}`);
            continue;
          }

          // Find the option in the variant
          const optionIndex = variant.options.findIndex(
            (opt: { label: string; value: string }) => 
              opt.label === optionValue || opt.value === optionValue
          );

          if (optionIndex === -1) {
            console.warn(`Option not found: ${optionValue} in variant ${variantName}`);
            continue;
          }

          // Build the update query
          interface UpdateQuery {
            $inc: { [key: string]: number };
            $set?: { [key: string]: unknown };
            [key: string]: unknown;
          }
          
          const updateQuery: UpdateQuery = {
            $inc: {}
          };
          
          // Update the specific variant option's stockModifier
          updateQuery.$inc[`variants.$[v].options.${optionIndex}.stockModifier`] = -item.quantity;
          
          // Also update the main stock (already done above, but we can do it here as well for consistency)
          updateQuery.$inc.stock = -item.quantity;

          // Execute the update
          await Product.updateOne(
            { _id: item.product },
            updateQuery,
            {
              arrayFilters: [
                { 'v._id': variant._id }
              ]
            }
          );
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.product}:`, error);
        // Even if there's an error, we still want to update the main stock as a fallback
        try {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.quantity } }
          );
        } catch (fallbackError) {
          console.error(`Fallback stock update failed for product ${item.product}:`, fallbackError);
        }
      }
    }

    return NextResponse.json({ success: true, data: createdOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connection with timeout
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 10000)),
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
        case 'paid':
          query.isPaid = true;
          break;
        case 'delivered':
          query.isDelivered = true;
          break;
        case 'cancelled':
          query.isCancelled = true;
          break;
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
        Order.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
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
        warning: 'Fetched without population due to error',
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);

    if (error instanceof Error) {
      if (error.message === 'DB timeout') {
        return NextResponse.json(
          { success: false, error: 'Database connection timeout' },
          { status: 504 },
        );
      }
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
