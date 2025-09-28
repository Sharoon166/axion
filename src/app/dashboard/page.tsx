import { Suspense } from 'react';
import { getDashboardData } from '@/lib/actions/dashboard';
import DashboardClient from '@/components/dashboard/DashboardClient';
import Loading from '@/loading';


async function DashboardContent() {
  const dashboardData = await getDashboardData();
  
  return <DashboardClient initialDashboardData={dashboardData} />;
}

export default function DashboardRoute() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
