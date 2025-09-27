import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { orderMonitor } from '@/lib/orderMonitor';

export async function GET() {
  try {
    const startTime = Date.now();

    // Test database connection
    await dbConnect();
    const dbConnectionTime = Date.now() - startTime;

    // Test basic order query
    const queryStartTime = Date.now();
    const orderCount = await Order.countDocuments({});
    const queryTime = Date.now() - queryStartTime;

    // Get monitoring metrics
    const metrics = orderMonitor.getMetrics();
    const successRate = orderMonitor.getSuccessRate();

    return NextResponse.json({
      success: true,
      health: {
        database: {
          connected: true,
          connectionTime: dbConnectionTime,
          queryTime: queryTime,
          totalOrders: orderCount,
        },
        orderFetching: {
          totalRequests: metrics.totalRequests,
          successRate: successRate,
          averageResponseTime: metrics.averageResponseTime,
          lastError: metrics.lastError,
          lastErrorTime: metrics.lastErrorTime,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        health: {
          database: {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
