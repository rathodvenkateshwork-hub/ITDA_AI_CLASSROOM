import React, { useState } from 'react';
import { Calendar, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

const mockDashboardData = {
  stats: {
    totalSchools: 3,
    totalTeachers: 24,
    totalStudents: 385,
    avgStudentPerformance: 74.5,
  },
  schools: [
    {
      id: 1,
      name: 'Government High School, Hyderabad',
      code: 'GHS-HYD-001',
      classes: 4,
      teachers: 8,
      students: 181,
      progress: 85,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Modern Public School',
      code: 'MPS-HYD-002',
      classes: 2,
      teachers: 6,
      students: 102,
      progress: 72,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Central Academy',
      code: 'CA-HYD-003',
      classes: 2,
      teachers: 10,
      students: 102,
      progress: 78,
      status: 'Active'
    }
  ],
  recentTasks: [
    {
      id: 1,
      title: 'Review Teacher Performance Reports',
      status: 'pending',
      priority: 'high',
      dueDate: '2024-03-06',
      progress: 45
    },
    {
      id: 2,
      title: 'Approve New Study Materials',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-03-07',
      progress: 70
    },
    {
      id: 3,
      title: 'Update School Syllabus',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-03-08',
      progress: 30
    },
    {
      id: 4,
      title: 'Register New Teachers',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-03-05',
      progress: 100
    }
  ],
  schedule: [
    { time: '9:00 AM', event: 'Staff Meeting', duration: '1 hour' },
    { time: '10:30 AM', event: 'Review Performance Data', duration: '45 mins' },
    { time: '12:00 PM', event: 'Lunch Break', duration: '1 hour' },
    { time: '1:00 PM', event: 'Teacher 1-on-1 Sessions', duration: '2 hours' },
    { time: '3:30 PM', event: 'Admin Updates Call', duration: '30 mins' }
  ]
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'in-progress':
      return <Clock className="w-5 h-5 text-blue-600" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 border-l-4 border-l-green-600';
    case 'in-progress':
      return 'bg-blue-50 border-l-4 border-l-blue-600';
    case 'pending':
      return 'bg-yellow-50 border-l-4 border-l-yellow-600';
    default:
      return 'bg-gray-50';
  }
};

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Stats */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Schools</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.totalSchools}</div>
                <div className="text-xs text-gray-500 mt-2">Active institutions</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Teachers</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.totalTeachers}</div>
                <div className="text-xs text-gray-500 mt-2">Registered</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Students</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.totalStudents}</div>
                <div className="text-xs text-gray-500 mt-2">Enrolled</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Performance</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.avgStudentPerformance}%</div>
                <div className="text-xs text-gray-500 mt-2">Average</div>
              </div>
            </div>
          </div>

          {/* Schools Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Schools</h2>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-4">
              {mockDashboardData.schools.map((school) => (
                <div key={school.id} className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{school.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{school.code}</span>
                        <span className="flex items-center gap-1">📚 {school.classes} Classes</span>
                        <span className="flex items-center gap-1">👨‍🏫 {school.teachers} Teachers</span>
                        <span className="flex items-center gap-1">👥 {school.students} Students</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Overall Progress</span>
                      <span className="text-sm font-semibold text-gray-900">{school.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${school.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {mockDashboardData.recentTasks.map((task) => (
                <div key={task.id} className={`rounded-lg p-4 ${getStatusColor(task.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">Due {task.dueDate}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-300 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 inline-block">{task.progress}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Schedule */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Today's Schedule
            </h2>
            <div className="space-y-4">
              {mockDashboardData.schedule.map((item, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.time}</p>
                      <p className="text-sm text-gray-700 mt-1">{item.event}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow">
                  + Add School
                </button>
                <button
                  onClick={() => (window.location.href = "/admin/register/teacher")}
                  className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors"
                >
                  Register Teacher
                </button>
                <button
                  onClick={() => (window.location.href = "/admin/bulk/students")}
                  className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors"
                >
                  Bulk Upload Students
                </button>
                <button
                  onClick={() => (window.location.href = "/admin/bulk/teachers")}
                  className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors"
                >
                  Bulk Upload Teachers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
