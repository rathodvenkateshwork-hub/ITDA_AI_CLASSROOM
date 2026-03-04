import React, { useState } from 'react';
import { Menu, Settings, LogOut, Home, BookOpen, Users, CheckSquare, BarChart3, CalendarX } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'sessions', label: 'Sessions', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: CheckSquare },
  { id: 'grades', label: 'Grades', icon: BarChart3 },
  { id: 'quizzes', label: 'Quizzes', icon: Users },
  { id: 'leaves', label: 'Leaves', icon: CalendarX }
];

export default function TeacherLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`bg-gradient-to-b from-purple-600 to-purple-700 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-lg`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-lg font-bold">Teacher Portal</h1>}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-purple-600 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`/teacher/${item.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors cursor-pointer group"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 space-y-2 border-t border-purple-600">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors text-sm">
            <Settings className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-sm">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Hi, Teacher 👋</h2>
              <p className="text-sm text-gray-600">Welcome back to your teaching dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold">
                T
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
