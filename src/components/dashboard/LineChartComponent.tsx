'use client';

import { useState, useEffect } from 'react';
import LineChart from "./LineChart"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartComponentProps {
  data?: any[];
}

export default function LineChartComponent({ data }: LineChartComponentProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data && data.length > 0) {
      // Use provided data
      const processedData = data.map((item, index) => ({
        date: item.date || new Date().toISOString().split('T')[0],
        value: item.sales || item.revenue || item.value || 0,
        label: item.date || `Day ${index + 1}`,
      }));
      setChartData(processedData);
      setLoading(false);
    } else {
      // Fetch real data from API
      fetchSalesData();
    }
  }, [data]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Fetch orders for sales data
      const ordersRes = await fetch(`${baseUrl}/api/orders`);
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const orders = ordersData.data || [];
      
      // Generate sales data for last 7 days
      const salesData = generateSalesData(orders);
      setChartData(salesData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Fallback to sample data
      setChartData([
        { date: "2025-08-26", value: 0, label: "Aug 26" },
        { date: "2025-08-27", value: 0, label: "Aug 27" },
        { date: "2025-08-28", value: 0, label: "Aug 28" },
        { date: "2025-08-29", value: 0, label: "Aug 29" },
        { date: "2025-08-30", value: 0, label: "Aug 30" },
        { date: "2025-08-31", value: 0, label: "Aug 31" },
        { date: "2025-09-01", value: 0, label: "Sep 1" },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const generateSalesData = (orders: any[]) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      const dayRevenue = dayOrders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
      
      last7Days.push({
        date: dateStr,
        value: dayRevenue,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return last7Days;
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Sales Overview</CardTitle>
        <p className="text-sm text-gray-600">Revenue over the last 7 days</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-sm text-gray-500">Loading chart...</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-4">
            <LineChart 
              data={chartData} 
              height={350} 
              showTooltip={true} 
              color="#000000" 
              title="Daily Revenue (Rs.)"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
