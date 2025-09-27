import { OrderData } from '@/types';
import { orderMonitor } from './orderMonitor';

interface OrderFetchOptions {
  userId?: string;
  status?: string;
  limit?: number;
  page?: number;
  retries?: number;
  timeout?: number;
}

interface OrderFetchResult {
  success: boolean;
  data: OrderData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

class OrderService {
  private static instance: OrderService;
  private cache = new Map<string, { data: OrderFetchResult; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private pendingRequests = new Map<string, Promise<OrderFetchResult>>();

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  private getCacheKey(options: OrderFetchOptions): string {
    return JSON.stringify(options);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  async fetchOrders(options: OrderFetchOptions = {}): Promise<OrderFetchResult> {
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // Check if there's already a pending request for the same options
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.performFetch(options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful results
      if (result.success) {
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
      
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performFetch(options: OrderFetchOptions): Promise<OrderFetchResult> {
    const {
      userId,
      status,
      limit,
      page,
      retries = 3,
      timeout = 10000
    } = options;

    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());

    const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch orders');
        }

        // Record successful request
        const responseTime = Date.now() - startTime;
        orderMonitor.recordRequest(true, responseTime);

        return result;
      } catch (error) {
        console.warn(`Order fetch attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          // Record failed request
          const responseTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
          orderMonitor.recordRequest(false, responseTime, errorMessage);
          
          return {
            success: false,
            data: [],
            error: errorMessage
          };
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      data: [],
      error: 'Max retries exceeded'
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(options?: Partial<OrderFetchOptions>): void {
    if (!options) {
      this.clearCache();
      return;
    }

    // Remove cache entries that match the given options
    for (const [key, _] of this.cache) {
      const parsedKey = JSON.parse(key);
      let shouldInvalidate = true;
      console.log(_)
      
      for (const [optionKey, optionValue] of Object.entries(options)) {
        if (parsedKey[optionKey] !== optionValue) {
          shouldInvalidate = false;
          break;
        }
      }
      
      if (shouldInvalidate) {
        this.cache.delete(key);
      }
    }
  }
}

export const orderService = OrderService.getInstance();