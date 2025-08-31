"use client"
import { useState } from 'react';
import { toast } from 'sonner'; // You can use any toast library

// Import available actions
import {
  // User actions
  createUser,
  authenticateUser,

  // Product actions
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  getProductBySlug,

  // Order actions
  createOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderById,

  // Category actions
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,

  // Blog actions
  createBlog,

  // Project actions
  createProject,

  // Admin actions
  getAllUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getProductAnalytics,
  updateSystemSettings,
  bulkUpdateProductStock,
  exportData,
} from '@/app/actions';

export function useActions() {
  const [loading, setLoading] = useState(false);

  const handleAction = async <T>(
    action: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await action();
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      const message = errorMessage || 'An error occurred';
      toast.error(message);
      console.error('Action error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // User actions
  const userActions = {
    create: (formData: FormData) =>
      handleAction(
        () => createUser(formData),
        'User created successfully',
        'Failed to create user'
      ),
    authenticate: (email: string, password: string) =>
      handleAction(
        () => authenticateUser(email, password),
        'Authentication successful',
        'Authentication failed'
      ),
  };

  // Product actions
  const productActions = {
    create: (formData: FormData) =>
      handleAction(
        () => createProduct(formData),
        'Product created successfully',
        'Failed to create product'
      ),
    getAll: () => handleAction(() => getProducts()),
    update: (id: string, formData: FormData) =>
      handleAction(
        () => updateProduct(id, formData),
        'Product updated successfully',
        'Failed to update product'
      ),
    delete: (id: string) =>
      handleAction(
        () => deleteProduct(id),
        'Product deleted successfully',
        'Failed to delete product'
      ),
    getFeatured: (limit?: number) => handleAction(() => getFeaturedProducts(limit)),
    getByCategory: (categorySlug: string, limit?: number) =>
      handleAction(() => getProductsByCategory(categorySlug, limit)),
    getBySlug: (slug: string) => handleAction(() => getProductBySlug(slug)),
  };

  // Order actions
  const orderActions = {
    create: (orderData: any) =>
      handleAction(
        () => createOrder(orderData),
        'Order created successfully',
        'Failed to create order'
      ),
    getUserOrders: (userId: string) => handleAction(() => getAllOrders({ userId })),
    updateStatus: (orderId: string, status: 'paid' | 'delivered') => {
      const formData = new FormData();
      if (status === 'paid') {
        formData.append('isPaid', 'true');
      } else if (status === 'delivered') {
        formData.append('isDelivered', 'true');
      }
      return handleAction(
        () => updateOrderStatus(orderId, formData),
        'Order status updated',
        'Failed to update order status'
      );
    },
    getAll: (filters?: any) => handleAction(() => getAllOrders(filters || {})),
    getById: (orderId: string) => handleAction(() => getOrderById(orderId)),
  };

  // Category actions
  const categoryActions = {
    create: (formData: FormData) =>
      handleAction(
        () => createCategory(formData),
        'Category created successfully',
        'Failed to create category'
      ),
    getAll: () => handleAction(() => getCategories()),
    update: (id: string, formData: FormData) =>
      handleAction(
        () => updateCategory(id, formData),
        'Category updated successfully',
        'Failed to update category'
      ),
    delete: (id: string) =>
      handleAction(
        () => deleteCategory(id),
        'Category deleted successfully',
        'Failed to delete category'
      ),
  };

  // Blog actions
  const blogActions = {
    create: (formData: FormData) =>
      handleAction(
        () => createBlog(formData),
        'Blog created successfully',
        'Failed to create blog'
      ),
  };

  // Project actions
  const projectActions = {
    create: (formData: FormData) =>
      handleAction(
        () => createProject(formData),
        'Project created successfully',
        'Failed to create project'
      ),
  };

  // Admin actions
  const adminActions = {
    getAllUsers: (page?: number, limit?: number) =>
      handleAction(() => getAllUsers(page, limit)),
    updateUserRole: (userId: string, isAdmin: boolean) =>
      handleAction(
        () => updateUserRole(userId, isAdmin),
        'User role updated successfully',
        'Failed to update user role'
      ),
    deleteUser: (userId: string) =>
      handleAction(
        () => deleteUser(userId),
        'User deleted successfully',
        'Failed to delete user'
      ),
    getDashboardStats: () => handleAction(() => getDashboardStats()),
    getProductAnalytics: () => handleAction(() => getProductAnalytics()),
    updateSystemSettings: (settings: any) =>
      handleAction(
        () => updateSystemSettings(settings),
        'Settings updated successfully',
        'Failed to update settings'
      ),
    bulkUpdateStock: (updates: Array<{ productId: string; newStock: number }>) =>
      handleAction(
        () => bulkUpdateProductStock(updates),
        'Stock updated successfully',
        'Failed to update stock'
      ),
    exportData: (dataType: 'users' | 'products' | 'orders', format: 'csv' | 'json') =>
      handleAction(() => exportData(dataType, format)),
  };

  return {
    loading,
    user: userActions,
    product: productActions,
    order: orderActions,
    category: categoryActions,
    blog: blogActions,
    project: projectActions,
    admin: adminActions,
  };
}
