interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

export default function DashboardCard({
  label,
  value,
  icon,
  color = 'bg-blue-50 text-blue-600',
}: DashboardCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className={`inline-block p-3 rounded-lg ${color} mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
