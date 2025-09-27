import { useState, useEffect, useCallback } from 'react';
import LineChart from './LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderData, SalesData } from '@/types';
import { Loader2 } from 'lucide-react';

interface LineChartComponentProps {
  data?: OrderData[]; // full orders optionally passed in
}

export default function LineChartComponent({ data }: LineChartComponentProps) {
  const [chartData, setChartData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const ordersRes = await fetch(`${baseUrl}/api/orders`);
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const orders: OrderData[] = ordersData.data || [];

      const salesData = generateSalesData(orders);
      setChartData(salesData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setChartData([
        {
          date: '2025-08-26',
          value: 0,
          label: 'Aug 26',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-08-27',
          value: 0,
          label: 'Aug 27',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-08-28',
          value: 0,
          label: 'Aug 28',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-08-29',
          value: 0,
          label: 'Aug 29',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-08-30',
          value: 0,
          label: 'Aug 30',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-08-31',
          value: 0,
          label: 'Aug 31',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
        {
          date: '2025-09-01',
          value: 0,
          label: 'Sep 1',
          discountPercent: 0,
          categorySlugs: undefined,
          productIds: [],
          endsAt: '',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      const processedData: SalesData[] = data.map((item, index) => ({
        date: item.date || new Date().toISOString().split('T')[0],
        value: item.totalPrice || 0,
        label: item.date
          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : `Day ${index + 1}`,
        discountPercent: 0,
        categorySlugs: undefined,
        productIds: [],
        endsAt: '',
      }));
      setChartData(processedData);
      setLoading(false);
    } else {
      fetchSalesData();
    }
  }, [data, fetchSalesData]);

  const generateSalesData = (orders: OrderData[]): SalesData[] => {
    const last7Days: SalesData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateStr;
      });

      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      last7Days.push({
        date: dateStr,
        value: dayRevenue,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        discountPercent: 0,
        categorySlugs: undefined,
        productIds: [],
        endsAt: '',
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
            <Loader2 className='animate-spin size-6' />
          </div>
        ) : (
          <div>
            <LineChart
              data={chartData}
              height={250}
              showTooltip={true}
              color="#121212"
              title="Daily Revenue (Rs.)"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
