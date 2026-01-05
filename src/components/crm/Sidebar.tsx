import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Settings,
  LogOut 
} from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/crm' },
    { icon: Users, label: 'Customers', path: '/crm/customers' },
    { icon: Receipt, label: 'Transactions', path: '/crm/transactions' },
    { icon: Settings, label: 'Settings', path: '/crm/settings' },
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">
          Transaction CRM
        </h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${isActive 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800'}
            `}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 w-52">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit CRM</span>
        </button>
      </div>
    </div>
  );
}