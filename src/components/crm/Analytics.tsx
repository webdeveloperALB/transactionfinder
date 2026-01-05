import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const transactionData = [
  { month: 'Jan', successful: 65, failed: 12, pending: 23 },
  { month: 'Feb', successful: 59, failed: 15, pending: 26 },
  { month: 'Mar', successful: 80, failed: 8, pending: 12 },
  { month: 'Apr', successful: 81, failed: 10, pending: 9 },
  { month: 'May', successful: 56, failed: 20, pending: 24 },
  { month: 'Jun', successful: 55, failed: 25, pending: 20 },
];

const recoveryRateData = [
  { month: 'Jan', rate: 85 },
  { month: 'Feb', rate: 82 },
  { month: 'Mar', rate: 91 },
  { month: 'Apr', rate: 89 },
  { month: 'May', rate: 86 },
  { month: 'Jun', rate: 88 },
];

const paymentMethodData = [
  { name: 'Cryptocurrency', value: 55 },
  { name: 'Bank Transfer', value: 30 },
  { name: 'Wire Transfer', value: 15 },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

const stats = [
  {
    title: 'Success Rate',
    value: '88.5%',
    change: '+2.3%',
    trend: 'up'
  },
  {
    title: 'Avg Recovery Time',
    value: '4.2 hrs',
    change: '-12.5%',
    trend: 'down'
  },
  {
    title: 'Active Searches',
    value: '234',
    change: '+5.1%',
    trend: 'up'
  },
  {
    title: 'Customer Satisfaction',
    value: '96.8%',
    change: '+1.2%',
    trend: 'up'
  }
];

export function Analytics() {
  return (
    <div className="text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Analytics Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          const trendColor = stat.trend === 'up' ? 'text-green-500' : 'text-red-500';

          return (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  index === 0 ? 'bg-indigo-50' :
                  index === 1 ? 'bg-green-50' :
                  index === 2 ? 'bg-blue-50' :
                  'bg-purple-50'
                }`}>
                  <div className={`w-6 h-6 ${
                    index === 0 ? 'text-indigo-600' :
                    index === 1 ? 'text-green-600' :
                    index === 2 ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div className={`flex items-center ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-sm text-gray-500 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Transaction Status Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Transaction Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" name="Successful" fill="#4F46E5" />
                <Bar dataKey="failed" name="Failed" fill="#EF4444" />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recovery Rate Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Recovery Rate Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recoveryRateData}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  name="Recovery Rate"
                  stroke="#4F46E5" 
                  fillOpacity={1} 
                  fill="url(#rateGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Payment Methods Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            {[
              { label: 'Average Search Time', value: '4.2 hours', target: '6 hours' },
              { label: 'Transaction Success Rate', value: '88.5%', target: '85%' },
              { label: 'Customer Retention', value: '92.3%', target: '90%' },
              { label: 'Recovery Rate', value: '87.9%', target: '80%' }
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-gray-500">{metric.label}</h3>
                  <p className="text-xl font-bold">{metric.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="text-lg font-medium text-gray-600">{metric.target}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}