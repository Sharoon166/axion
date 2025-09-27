import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Products';

interface OrderDocument {
  _id: string;
  orderItems: Array<{
    name: string;
    qty: number;
    quantity: number;
    color?: string;
    size?: string;
    image: string;
    price: number;
    product: string;
    variants?: Array<{
      variantName: string;
      optionValue: string;
      optionLabel?: string;
    }>;
  }>;
  isCancelled: boolean;
  isDelivered: boolean;
  isConfirmed: boolean;
  isShipped: boolean;
}

interface ProductDocument {
  _id: string;
  name: string;
  variants?: Array<{
    name: string;
    type: string;
    required: boolean;
    options: Array<{
      label: string;
      value: string;
      priceModifier: number;
      stockModifier: number;
    }>;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Get the order
    const order = await Order.findById(id).lean() as OrderDocument | null;
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get product details for each order item
    const orderItemsWithProductDetails = await Promise.all(
      order.orderItems.map(async (item) => {
        const product = await Product.findById(item.product).lean() as ProductDocument | null;
        return {
          orderItem: item,
          productDetails: product ? {
            name: product.name,
            variants: product.variants
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId: id,
        orderStatus: {
          isCancelled: order.isCancelled,
          isDelivered: order.isDelivered,
          isConfirmed: order.isConfirmed,
          isShipped: order.isShipped
        },
        orderItemsAnalysis: orderItemsWithProductDetails.map((item, index) => ({
          index,
          hasVariants: !!(item.orderItem.variants && item.orderItem.variants.length > 0),
          orderItemVariants: item.orderItem.variants || [],
          productHasVariants: !!(item.productDetails?.variants && item.productDetails.variants.length > 0),
          productVariants: item.productDetails?.variants || [],
          productName: item.productDetails?.name || 'Unknown'
        }))
      }
    });
  } catch (error) {
    console.error('Error debugging order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug order' },
      { status: 500 }
    );
  }
}