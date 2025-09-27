import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { Types } from 'mongoose';
import { OrderData, OrderItem, Product } from '@/types';
import { reduceStockForOrder } from '@/lib/stockManager';

// Extend the Order document with additional properties
type PopulatedOrder = Omit<OrderData, 'user' | 'orderItems'> & {
  _id: Types.ObjectId;
  user:
    | {
        _id: Types.ObjectId;
        name?: string;
        email?: string;
      }
    | Types.ObjectId
    | null;
  orderItems: Array<{
    _id: Types.ObjectId;
    product:
      | Types.ObjectId
      | { _id: Types.ObjectId; name?: string; slug?: string; images?: string[] };
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

    // Process order items to include sale info and preserve full nested variant paths
    const processedOrderItems = body.orderItems.map((item: OrderItem) => ({
      ...item,
      saleName: item.saleName || null,
      salePercent: item.salePercent || null,
      // Preserve nested variants so stock updates target exact nodes
      variants: Array.isArray(item.variants)
        ? item.variants.map((variant) => ({
            variantName: variant.variantName,
            optionValue: variant.optionValue,
            optionLabel: variant.optionLabel ?? variant.optionValue,
            optionDetails: variant.optionDetails,
            subVariants: Array.isArray(variant.subVariants)
              ? variant.subVariants.map((sv) => ({
                  subVariantName: sv.subVariantName,
                  optionValue: sv.optionValue,
                  optionLabel: sv.optionLabel ?? sv.optionValue,
                  optionDetails: sv.optionDetails,
                  subSubVariants: Array.isArray(sv.subSubVariants)
                    ? sv.subSubVariants.map((ssv) => ({
                        subSubVariantName: ssv.subSubVariantName,
                        optionValue: ssv.optionValue,
                        optionLabel: ssv.optionLabel ?? ssv.optionValue,
                        optionDetails: ssv.optionDetails,
                      }))
                    : [],
                }))
              : [],
          }))
        : [],
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
      const successfulReductions = stockResults.filter((result) => result.success);
      console.log(
        `Successfully reduced stock for ${successfulReductions.length} products in order ${createdOrder.orderId}`,
      );

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
      user: orderResponse.user
        ? {
            _id: orderResponse.user._id?.toString(),
            name: orderResponse.user.name || 'Guest User',
            email: orderResponse.user.email || 'guest@example.com',
          }
        : null,
      orderItems: orderResponse.orderItems.map(
        (item: {
          _id: Types.ObjectId;
          product: Product;
          name: string;
          qty: number;
          quantity: number;
          image: string;
          price: number;
          color: string;
          size?: string;
        }) => {
          // Handle the product field based on its type
          let productData = null;
          const product = item.product;

          if (product) {
            if (product instanceof Types.ObjectId) {
              productData = product.toString();
            } else if (typeof product === 'object' && product !== null) {
              // It's a Product object
              productData = {
                _id: product._id ? String(product._id) : '',
                name: product.name ? String(product.name) : '',
                slug: product.slug ? String(product.slug) : '',
              };
            } else if (typeof product === 'string') {
              productData = product;
            }
          }

          return {
            ...item,
            _id: item._id.toString(),
            product: productData,
          };
        },
      ),
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
    let lastError;
    while (retries > 0) {
      try {
        await Promise.race([
          dbConnect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 10000)), // Increased timeout
        ]);
        break;
      } catch (error) {
        lastError = error;
        retries--;
        console.warn(`Database connection attempt failed, ${retries} retries left:`, error);
        if (retries === 0) throw lastError;
        await new Promise((resolve) => setTimeout(resolve, 2000 * (4 - retries))); // Exponential backoff
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
      // Get orders with improved error handling for population
      const [orders, total] = await Promise.all([
        (async () => {
          try {
            // First try with population
            const populatedOrders = await Order.find(query)
              .populate({
                path: 'user',
                select: 'name email',
                options: {
                  strictPopulate: false,
                },
              })
              .populate({
                path: 'orderItems.product',
                select: 'name slug',
                options: { strictPopulate: false },
              })
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limitNum)
              .lean();

            return populatedOrders.map((order) => {
              const typedOrder = order as unknown as PopulatedOrder;
              // Ensure orderId is included
              const orderId =
                typedOrder.orderId || `ORD_${typedOrder._id.toString().slice(-8).toUpperCase()}`;

              // Handle user population with better error checking
              let userInfo: { name: string; email: string };
              if (
                typedOrder.user &&
                typeof typedOrder.user === 'object' &&
                !(typedOrder.user instanceof Types.ObjectId)
              ) {
                // User is populated
                userInfo = {
                  name: typedOrder.user.name || 'Guest User',
                  email: typedOrder.user.email || 'guest@example.com',
                };
              } else {
                // User is not populated or is an ObjectId
                userInfo = { name: 'Guest User', email: 'guest@example.com' };
              }

              return {
                ...typedOrder,
                _id: typedOrder._id.toString(),
                orderId,
                user: userInfo,
                // Convert any ObjectId fields to strings with better error handling
                orderItems: typedOrder.orderItems.map((item) => ({
                  ...item,
                  _id: item._id.toString(),
                  product:
                    typeof item.product === 'object' &&
                    item.product !== null &&
                    !(item.product instanceof Types.ObjectId)
                      ? {
                          ...item.product,
                          _id: item.product._id.toString(),
                        }
                      : item.product?.toString() || 'unknown',
                })),
              };
            });
          } catch (populationError) {
            console.warn('Population failed, trying without population:', populationError);

            // Fallback: fetch without population
            const rawOrders = await Order.find(query)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limitNum)
              .lean();

            return rawOrders.map((order) => {
              const typedOrder = order as unknown as PopulatedOrder;
              return {
                ...typedOrder,
                _id: typedOrder._id.toString(),
                orderId:
                  typedOrder.orderId || `ORD_${typedOrder._id.toString().slice(-8).toUpperCase()}`,
                user: { name: 'Guest User', email: 'guest@example.com' },
                orderItems: typedOrder.orderItems.map((item) => ({
                  ...item,
                  _id: item._id.toString(),
                  product:
                    typeof item.product === 'object' &&
                    item.product !== null &&
                    !(item.product instanceof Types.ObjectId)
                      ? item.product._id.toString()
                      : item.product?.toString() || 'unknown',
                })),
              };
            });
          }
        })(),
        Order.countDocuments(query),
      ]);

      // Filter out orders with null users if userId was specified
      const filteredOrders = userId
        ? orders.filter((order) => order.user && order.user.name !== 'Guest User')
        : orders;

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
    } catch (queryError) {
      console.error('Database query failed:', queryError);
      throw queryError;
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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders. Please check your connection and try again.',
      },
      { status: 500 },
    );
  }
}
