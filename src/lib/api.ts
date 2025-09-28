import { toast } from 'sonner';
import { refreshDashboardData } from './actions/dashboard';

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  images: string[];
  featured: boolean;
  rating: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  pagination: PaginationInfo;
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Products API
  products = {
    getAll: (params: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      search?: string;
    } = {}) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.sort) query.append('sort', params.sort);
      if (params?.order) query.append('order', params.order);
      if (params?.search) query.append('search', params.search);
      
      return this.request<ProductListResponse>(`/products?${query.toString()}`);
    },

    getById: (id: string) => this.request<Product>(`/products/${id}`),

    getBySlug: (slug: string) => this.request<Product>(`/products/${slug}`),

    create: async (data: FormData) => {
      const promise = fetch('/api/products', {
        method: 'POST',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Creating product...',
        success: 'Product created successfully!',
        error: 'Failed to create product',
      });

      return promise;
    },

    update: async (slug: string, data: FormData) => {
      const promise = fetch(`/api/admin/products/${slug}`, {
        method: 'PUT',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Updating product...',
        success: 'Product updated successfully!',
        error: 'Failed to update product',
      });

      return promise;
    },

    delete: async (slug: string) => {
      const promise = fetch(`/api/products/${slug}`, {
        method: 'DELETE',
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Deleting product...',
        success: 'Product deleted successfully!',
        error: 'Failed to delete product',
      });

      return promise;
    },
  };

  // Categories API
  categories = {
    getAll: () => this.request<unknown[]>('/categories'),

    create: async (data: FormData) => {
      const promise = fetch('/api/categories', {
        method: 'POST',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Creating category...',
        success: 'Category created successfully!',
        error: 'Failed to create category',
      });

      return promise;
    },

    update: async (id: string, data: FormData) => {
      const promise = fetch(`/api/categories/${id}`, {
        method: 'PUT',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Updating category...',
        success: 'Category updated successfully!',
        error: 'Failed to update category',
      });

      return promise;
    },

    delete: async (id: string) => {
      const promise = fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Deleting category...',
        success: 'Category deleted successfully!',
        error: 'Failed to delete category',
      });

      return promise;
    },
  };

  // Blogs API
  blogs = {
    getAll: () => this.request<unknown[]>('/blogs'),

    getById: (id: string) => this.request<unknown>(`/blogs/${id}`),

    getBySlug: (slug: string) => this.request<unknown>(`/blogs/${slug}`),

    create: async (data: FormData) => {
      const promise = fetch('/api/blogs', {
        method: 'POST',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Creating blog post...',
        success: 'Blog post created successfully!',
        error: 'Failed to create blog post',
      });

      return promise;
    },

    update: async (slug: string, data: FormData) => {
      const promise = fetch(`/api/admin/blogs/${slug}`, {
        method: 'PUT',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Updating blog post...',
        success: 'Blog post updated successfully!',
        error: 'Failed to update blog post',
      });

      return promise;
    },

    delete: async (slug: string) => {
      const promise = fetch(`/api/blogs/${slug}`, {
        method: 'DELETE',
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Deleting blog post...',
        success: 'Blog post deleted successfully!',
        error: 'Failed to delete blog post',
      });

      return promise;
    },
  };

  // Users API
  users = {
    getAll: () => this.request<unknown[]>('/users'),

    create: async (data: FormData) => {
      const promise = fetch('/api/users', {
        method: 'POST',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Creating user...',
        success: 'User created successfully!',
        error: 'Failed to create user',
      });

      return promise;
    },

    update: async (id: string, data: FormData) => {
      const promise = fetch(`/api/users/${id}`, {
        method: 'PUT',
        body: data,
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Updating user...',
        success: 'User updated successfully!',
        error: 'Failed to update user',
      });

      return promise;
    },

    delete: async (id: string) => {
      const promise = fetch(`/api/users/${id}`, {
        method: 'DELETE',
      }).then(res => res.json());

      toast.promise(promise, {
        loading: 'Deleting user...',
        success: 'User deleted successfully!',
        error: 'Failed to delete user',
      });

      return promise;
    },
  };

  // Orders API
  orders = {
    getAll: () => this.request<unknown[]>('/orders'),

    getById: (id: string) => this.request<unknown>(`/orders/${id}`),

    create: async (data: OrderPayload) => {
      const promise = this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast.promise(promise, {
        loading: 'Creating order...',
        success: 'Order created successfully!',
        error: 'Failed to create order',
      });

      return promise;
    },

    updateStatus: async (id: string, status: 'ordered' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => {
      const promise = fetch(`/api/orders/${id}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }), // also sent in body; query alone also works
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Update failed');
        refreshDashboardData()
        return data;
      });
      
      toast.promise(promise, {
        loading: 'Updating order status...',
        success: 'Order status updated successfully!',
        error: (err) => err.message || 'Failed to update order status',
      });

      return promise;
    },

    cancel: async (id: string, cancellationReason?: string) => {
      const promise = fetch(`/api/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: cancellationReason || '' }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Cancellation failed');
        return data;
      });

      toast.promise(promise, {
        loading: 'Cancelling order and restoring stock...',
        success: (data) => {
          const stockInfo = data.stockRestoration;
          if (stockInfo && stockInfo.failed > 0) {
            return `Order cancelled! Stock restored for ${stockInfo.successful}/${stockInfo.attempted} products.`;
          }
          return 'Order cancelled successfully and stock restored!';
        },
        error: (err) => err.message || 'Failed to cancel order',
      });

      return promise;
    },
  };
}

export const api = new ApiClient();

// Payload types
export type OrderPayload = Record<string, unknown>;