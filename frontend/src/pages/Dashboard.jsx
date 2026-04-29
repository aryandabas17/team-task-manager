import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Briefcase, ListTodo } from 'lucide-react';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981'];
const PRIORITY_COLORS = { LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#ef4444' };

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/api/dashboard');
      setMetrics(data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const statusData = [
    { name: 'To Do', value: metrics.tasksByStatus.TODO || 0 },
    { name: 'In Progress', value: metrics.tasksByStatus.IN_PROGRESS || 0 },
    { name: 'Done', value: metrics.tasksByStatus.DONE || 0 },
  ];

  const priorityData = Object.entries(metrics.tasksByPriority).map(([key, value]) => ({
    name: key,
    Tasks: value
  }));

  const statCards = [
    { title: 'Total Projects', value: metrics.projectsCount, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Total Tasks', value: metrics.totalTasks, icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Completed', value: metrics.completedTasks, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Pending', value: metrics.pendingTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Overdue', value: metrics.overdueTasks, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Here is what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks by Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F3F4F6' }}/>
                <Bar dataKey="Tasks" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Tasks</h3>
        {metrics.recentTasks && metrics.recentTasks.length > 0 ? (
          <div className="space-y-3">
            {metrics.recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">Project: {task.project?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                    task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    task.priority === 'HIGH' ? 'border-red-200 text-red-700 bg-red-50' :
                    task.priority === 'MEDIUM' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                    'border-green-200 text-green-700 bg-green-50'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            You don't have any recent tasks assigned to you.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
