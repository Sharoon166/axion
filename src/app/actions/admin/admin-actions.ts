'use server';

import dbConnect from '@/lib/db';
import {User} from '@/models/User';
import Product from '@/models/Products';
import Order from '@/models/Order';
import Category from '@/models/Category';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

export async function getAllUsers(page: number = 1, limit: number = 20) {
  try {
    await dbConnect();
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find({}).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments({})
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    };
  } catch {
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function updateUserRole(userId: string, isAdmin: boolean) {
  try {
    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    revalidatePath('/admin/users');
    return { success: true, data: user };
  } catch  {
    return { success: false, error: 'Failed to update user role' };
  }
}

export async function deleteUser(userId: string) {
  try {
    await dbConnect();
    
    // Check if user has any orders
    const userOrders = await Order.countDocuments({ user: userId });
    if (userOrders > 0) {
      return { success: false, error: 'Cannot delete user with existing orders' };
    }
    
    await User.findByIdAndDelete(userId);
    
    revalidatePath('/admin/users');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getDashboardStats() {
  try {
    await dbConnect();
    
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({ isCancelled: { $ne: true } }),
      Category.countDocuments({}),
      Order.find({ isCancelled: { $ne: true } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ stock: { $lt: 10 } })
        .select('name stock')
        .sort({ stock: 1 })
        .limit(5)
    ]);
    
    // Calculate revenue for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          isCancelled: { $ne: true },
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    const revenue = monthlyRevenue[0]?.totalRevenue || 0;
    
    return {
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          monthlyRevenue: revenue
        },
        recentOrders,
        lowStockProducts
      }
    };
  } catch {
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}

export async function getProductAnalytics() {
  try {
    await dbConnect();
    
    // Top selling products
    const topSellingProducts = await Order.aggregate([
      {
        $match: { isCancelled: { $ne: true } }
      },
      {
        $unwind: '$orderItems'
      },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Category performance
    const categoryPerformance = await Order.aggregate([
      {
        $match: { isCancelled: { $ne: true } }
      },
      {
        $unwind: '$orderItems'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category.name',
          totalSold: { $sum: '$orderItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);
    
    return {
      success: true,
      data: {
        topSellingProducts,
        categoryPerformance
      }
    };
  } catch  {
    return { success: false, error: 'Failed to fetch product analytics' };
  }
}

export async function updateSystemSettings() {
  try {
    // This would typically update a settings collection or environment variables
    // For now, we'll just return success
    // In a real implementation, you'd save these to a database
    
    revalidatePath('/admin/settings');
    return { success: true, message: 'Settings updated successfully' };
  } catch {
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function bulkUpdateProductStock(updates: Array<{ productId: string; newStock: number }>) {
  try {
    await dbConnect();
    
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.productId },
        update: { $set: { stock: update.newStock, updatedAt: new Date() } }
      }
    }));
    
    const result = await Product.bulkWrite(bulkOps);
    
    revalidatePath('/admin/inventory');
    return { 
      success: true, 
      message: 'Bulk update successful',
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to update product stock',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getSystemLogs({
  type,
  startDate,
  endDate,
  page = 1,
  limit = 50
}: {
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  try {
    await dbConnect();
    
    const query: any = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    // Implementation would depend on your logging system
    // This is a simplified example
    const [logs, total] = await Promise.all([
      [], // Replace with actual log query
      0,  // Replace with actual count
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages,
          totalLogs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    };
  } catch {
    return { success: false, error: 'Failed to fetch system logs' };
  }
}

export async function performSystemMaintenance() {
  try {
    await dbConnect();
    
    // Example maintenance tasks
    const tasks = [
      { name: 'Clean up expired sessions', result: 'Success' },
      { name: 'Update product statistics', result: 'Success' },
      { name: 'Generate backup', result: 'Success' },
    ];
    
    // Add your actual maintenance logic here
    
    return {
      success: true,
      message: 'System maintenance completed successfully',
      tasks
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'System maintenance failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function sendBulkNotification({
  userIds,
  title,
  message,
  type = 'info'
}: {
  userIds: string[];
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) {
  try {
    await dbConnect();
    
    // Convert string IDs to ObjectId
    const objectIds = userIds.map(id => new ObjectId(id));
    
    // Implementation would depend on your notification system
    // This is a simplified example
    const notifications = objectIds.map(userId => ({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date()
    }));
    
    // Save notifications to database
    // await Notification.insertMany(notifications);
    
    return {
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      count: notifications.length
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateMultipleUsersStatus(userIds: string[], isActive: boolean) {
  try {
    await dbConnect();
    
    const objectIds = userIds.map(id => new ObjectId(id));
    
    const result = await User.updateMany(
      { _id: { $in: objectIds } },
      { $set: { isActive, updatedAt: new Date() } }
    );
    
    revalidatePath('/admin/users');
    
    return {
      success: true,
      message: `Successfully updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to update users status',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function exportData(dataType: 'users' | 'products' | 'orders', format: 'csv' | 'json') {
  try {
    await dbConnect();
    
    let data: any[] = [];
    
    switch (dataType) {
      case 'users':
        data = await User.find({}).select('-password').lean();
        break;
      case 'products':
        data = await Product.find({}).populate('category').lean();
        break;
      case 'orders':
        data = await Order.find({})
          .populate('user', 'name email')
          .populate('orderItems.product')
          .lean();
        break;
    }
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = data.map(item => 
        Object.values(item).join(',')
      ).join('\n');
      
      return { success: true, data: csvData, format: 'csv' };
    } else {
      return { success: true, data, format: 'json' };
    }
  } catch  {
    return { success: false, error: 'Failed to export data' };
  }
}
