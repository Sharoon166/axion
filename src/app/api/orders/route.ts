import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { Types } from 'mongoose';
import { OrderData, OrderItem, Product } from '@/types';
import { reduceStockForOrder } from '@/lib/stockManager';

// Extend the Order document with additional properties
type PopulatedOrder = Omit<OrderData, 'user' | 'orderItems'> & {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    name?: string;
    email?: string;
  } | Types.ObjectId | null;
  orderItems: Array<{
    _id: Types.ObjectId;
    product: Types.ObjectId | { _id: Types.ObjectId; name?: string; slug?: string; images?: string[] };
    quantity: number;
    price: number;
  }>;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
};

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

    // Process order items to ensure sale information and variants are included
    const processedOrderItems = body.orderItems.map((item: OrderItem) => ({
      ...item,
      saleName: item.saleName || null,
      salePercent: item.salePercent || null,
      // Ensure variants are properly mapped
      variants: item.variants ? item.variants.map(variant => ({
        variantName: variant.variantName,
        optionValue: variant.optionValue,
        optionLabel: variant.optionValue // Use optionValue as optionLabel for compatibility
      })) : []
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
    
    // Ensure orderId is included in the response
    const orderResponse = createdOrder.toObject();
    orderResponse.orderId = createdOrder.orderId;

    // Debug: Log the created order with orderId
    console.log('Created order with ID:', createdOrder.orderId);

    // Reduce stock for each item in the order
    try {
      const stockResults = await reduceStockForOrder(createdOrder.orderItems);
      const successfulReductions = stockResults.filter(result => result.success);
      console.log(`Successfully reduced stock for ${successfulReductions.length} products in order ${createdOrder.orderId}`);
      
      if (successfulReductions.length < stockResults.length) {
        console.warn(`Some products' stock could not be updated for order ${createdOrder.orderId}`);
      }
    } catch (error) {
      console.error(`Error reducing stock for order ${createdOrder.orderId}:`, error);
      // Don't fail the order creation if stock reduction fails
      // The order is still created, but stock might not be updated
    }

    // Prepare the response with proper type safety
    const responseData = {
      ...orderResponse,
      _id: orderResponse._id.toString(),
      orderId: orderResponse.orderId,
      user: orderResponse.user ? {
        _id: orderResponse.user._id?.toString(),
        name: orderResponse.user.name || 'Guest User',
        email: orderResponse.user.email || 'guest@example.com'
      } : null,
      orderItems: orderResponse.orderItems.map((item: { _id: Types.ObjectId; product: Product; name: string; qty: number; quantity: number; image: string; price: number; color: string; size?: string; }) => {
        // Handle the product field based on its type
        let productData= null;
        const product = item.product;
        
        if (product) {
          if (product instanceof Types.ObjectId) {
            productData = product.toString();
          } else if (typeof product === 'object' && product !== null) {
            // It's a Product object
            productData = {
              _id: product._id ? String(product._id) : '',
              name: product.name ? String(product.name) : '',
              slug: product.slug ? String(product.slug) : ''
            };
          } else if (typeof product === 'string') {
            productData = product;
          }
        }
        
        return {
          ...item,
          _id: item._id.toString(),
          product: productData
        };
      })
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Enhanced connection with retry mechanism
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const page = Number(searchParams.get('page')) || 1;

    const query: OrderQuery = {};

    // Enhanced user filtering with proper ObjectId handling
    if (userId && userId !== 'undefined' && userId !== 'null') {
      try {
        query.user = new Types.ObjectId(userId);
      } catch {
        // If userId is not a valid ObjectId, try string match
        query.user = userId;
      }
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

    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (page - 1) * limitNum;

    try {
      // Get orders with user population
      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate({
            path: 'user',
            select: 'name email',
            options: { 
              strictPopulate: false,
            }
          })
          .populate({
            path: 'orderItems.product',
            select: 'name slug',
            options: { strictPopulate: false }
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean()
          .then(orders => {
            // Type assertion to handle the populated order
            const populatedOrders = orders as unknown as PopulatedOrder[];
            return populatedOrders.map(order => {
              // Ensure orderId is included
              const orderId = order.orderId || `ORD_${order._id.toString().slice(-8).toUpperCase()}`;
              
              // Handle user population
              let userInfo: { name: string; email: string };
              if (order.user && typeof order.user === 'object' && !(order.user instanceof Types.ObjectId)) {
                // User is populated
                userInfo = { 
                  name: order.user.name || 'Guest User',
                  email: order.user.email || 'guest@example.com'
                };
              } else {
                // User is not populated or is an ObjectId
                userInfo = { name: 'Guest User', email: 'guest@example.com' };
              }
              
              return {
                ...order,
                _id: order._id.toString(),
                orderId,
                user: userInfo,
                // Convert any ObjectId fields to strings
                orderItems: order.orderItems.map(item => ({
                  ...item,
                  _id: item._id.toString(),
                  product: typeof item.product === 'object' && item.product !== null && !(item.product instanceof Types.ObjectId)
                    ? {
                        ...item.product,
                        _id: item.product._id.toString()
                      }
                    : item.product?.toString()
                }))
              };
            });
          }),
        Order.countDocuments(query),
      ]);

      // Filter out orders with null users if userId was specified
      const filteredOrders = userId ? orders.filter(order => order.user) : orders;

      return NextResponse.json({
        success: true,
        data: filteredOrders,
        pagination: {
          page,
          limit: limitNum,
          total: userId ? filteredOrders.length : total,
          pages: Math.ceil((userId ? filteredOrders.length : total) / limitNum),
        },
      });
    } catch (populationError) {
      console.warn('Population failed, trying without:', populationError);
      
      // Fallback: try without population
      try {
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
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error fetching orders:', error);

    if (error instanceof Error) {
      if (error.message === 'DB timeout') {
        return NextResponse.json(
          { success: false, error: 'Database connection timeout. Please try again.' },
          { status: 504 },
        );
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch orders. Please check your connection and try again.' 
    }, { status: 500 });
  }
}
