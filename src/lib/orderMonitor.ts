interface OrderFetchMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError?: string;
  lastErrorTime?: Date;
}

class OrderMonitor {
  private static instance: OrderMonitor;
  private metrics: OrderFetchMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };
  private responseTimes: number[] = [];

  static getInstance(): OrderMonitor {
    if (!OrderMonitor.instance) {
      OrderMonitor.instance = new OrderMonitor();
    }
    return OrderMonitor.instance;
  }

  recordRequest(success: boolean, responseTime: number, error?: string): void {
    this.metrics.totalRequests++;
    this.responseTimes.push(responseTime);

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (error) {
        this.metrics.lastError = error;
        this.metrics.lastErrorTime = new Date();
      }
    }

    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    // Calculate average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  getMetrics(): OrderFetchMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
    this.responseTimes = [];
  }

  logStatus(): void {
    const successRate = this.getSuccessRate();
    console.log('📊 Order Fetch Metrics:');
    console.log(`   Total Requests: ${this.metrics.totalRequests}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Average Response Time: ${this.metrics.averageResponseTime.toFixed(0)}ms`);
    
    if (this.metrics.lastError) {
      console.log(`   Last Error: ${this.metrics.lastError} (${this.metrics.lastErrorTime})`);
    }
  }
}

export const orderMonitor = OrderMonitor.getInstance();