import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Products';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const startTime = Date.now();
    await dbConnect();
    const connectionTime = Date.now() - startTime;
    
    // Test basic queries
    const [orderCount, productCount] = await Promise.all([
      Order.countDocuments().catch(() => -1),
      Product.countDocuments().catch(() => -1),
    ]);
    
    // Test population
    let populationTest = 'failed';
    try {
      const sampleOrder = await Order.findOne()
        .populate('user', 'name')
        .populate('orderItems.product', 'name')
        .lean();
      populationTest = sampleOrder ? 'success' : 'no_data';
    } catch (error) {
      populationTest = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        connectionTime: `${connectionTime}ms`,
        orderCount,
        productCount,
        populationTest,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}