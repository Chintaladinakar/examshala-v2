import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardCard from '@/components/DashboardCard';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { label: 'Tests Created', value: '12', icon: '📝', color: 'bg-blue-50 text-blue-600' },
    { label: 'Tests Taken', value: '45', icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Average Score', value: '78%', icon: '📊', color: 'bg-purple-50 text-purple-600' },
  ];

  const recentActivity = [
    { title: 'Mathematics Quiz', action: 'Completed', time: '2 hours ago' },
    { title: 'Science Test', action: 'Created', time: '1 day ago' },
    { title: 'History Exam', action: 'Completed', time: '2 days ago' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <DashboardCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="flex gap-4">
              <Link
                href="/tests/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Create New Test
              </Link>
              <Link
                href="/tests"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
              >
                View All Tests
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
