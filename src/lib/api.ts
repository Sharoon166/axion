import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
    getAll: () => this.request<any[]>('/products'),
    
    getById: (id: string) => this.request<any>(`/products/${id}`),
    
    getBySlug: (slug: string) => this.request<any>(`/products/${slug}`),
    
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
    
    delete: async (id: string) => {
      const promise = fetch(`/api/products/${id}`, {
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
    getAll: () => this.request<any[]>('/categories'),
    
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
    getAll: () => this.request<any[]>('/blogs'),
    
    getById: (id: string) => this.request<any>(`/blogs/${id}`),
    
    getBySlug: (slug: string) => this.request<any>(`/blogs/${slug}`),
    
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
    
    delete: async (id: string) => {
      const promise = fetch(`/api/blogs/${id}`, {
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
    getAll: () => this.request<any[]>('/users'),
    
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
    getAll: () => this.request<any[]>('/orders'),
    
    getById: (id: string) => this.request<any>(`/orders/${id}`),
    
    create: async (data: any) => {
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
    
    updateStatus: async (id: string, status: string) => {
      const promise = this.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      toast.promise(promise, {
        loading: 'Updating order status...',
        success: 'Order status updated successfully!',
        error: 'Failed to update order status',
      });

      return promise;
    },
  };
}

export const api = new ApiClient();