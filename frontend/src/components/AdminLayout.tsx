import React, { useState } from 'react';
import { BarChart3, Calendar, Settings, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      active: location.pathname === '/admin'
    },
    {
      name: 'Schools',
      href: '/admin/schools',
      icon: '🏫',
      active: location.pathname === '/admin/schools'
    },
    {
      name: 'Teachers',
      href: '/admin/teachers',
      icon: '👨‍🏫',
      active: location.pathname === '/admin/teachers'
    },
    {
      name: 'Materials',
      href: '/admin/materials',
      icon: '📚',
      active: location.pathname === '/admin/materials'
    },
    {
      name: 'Quizzes',
      href: '/admin/quizzes',
      icon: '✏️',
      active: location.pathname === '/admin/quizzes'
    },
    {
      name: 'Activities',
      href: '/admin/activities',
      icon: '🎯',
      active: location.pathname === '/admin/activities',
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-purple-600 to-purple-700 text-white transition-all duration-300 flex flex-col shadow-lg`}>
        {/* Logo */}
        <div className="p-6 border-b border-purple-500">
          <div className="flex items-center justify-between">
            <div className={`${isSidebarOpen ? 'flex items-center gap-3' : 'flex justify-center'}`}>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                📚
              </div>
              {isSidebarOpen && <span className="font-bold text-lg">Learnbox</span>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.name} to={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'bg-white/20 text-white'
                  : 'text-purple-100 hover:bg-white/10'
              }`}>
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-purple-500 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-white/10 transition-all">
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-purple-500">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, Admin 👋</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back to Learnbox</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold"
            >
              A
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
