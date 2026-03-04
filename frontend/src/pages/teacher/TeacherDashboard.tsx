import React, { useState } from 'react';
import { ArrowRight, Users, BookOpen, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import TeacherLayout from '@/components/TeacherLayout';

type TopicLike = { id: string; chapterId: string; name: string; order: number; status: string; materials: Array<{ id: string; type: string; title: string; url: string }> };
type LiveSessionLike = { id: string; teacherId: string; classId: string; subjectId: string; chapterId: string; topicId: string; topicName: string; teacherName: string; className: string; subjectName: string; startTime: string; status: string; attendanceMarked: boolean; quizSubmitted: boolean };
import {
  BookOpen, Bot, Play, QrCode, CheckCircle2, XCircle, Lightbulb,
  Video, VideoOff, CalendarOff, CalendarCheck, FileText, Upload,
  Clock, ArrowLeft, ChevronRight, Trophy, Presentation, Image,
  PlayCircle, Film, FileDown, ChevronDown, Users, Radio,
  Microscope, Globe, Sparkles, Brain, BarChart3, MonitorPlay
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const mockDashboardData = {
  stats: {
    totalClasses: 4,
    totalStudents: 128,
    avgAttendance: 92,
    avgScore: 78.5,
  },
  classes: [
    {
      id: 1,
      name: '10-A',
      subject: 'Mathematics',
      students: 32,
      sessions: 18,
      avgScore: 78,
      progress: 72
    },
    {
      id: 2,
      name: '10-B',
      subject: 'Science',
      students: 30,
      sessions: 18,
      avgScore: 82,
      progress: 85
    },
    {
      id: 3,
      name: '11-A',
      subject: 'English',
      students: 33,
      sessions: 15,
      avgScore: 76,
      progress: 68
    },
    {
      id: 4,
      name: '12-A',
      subject: 'Mathematics',
      students: 33,
      sessions: 12,
      avgScore: 81,
      progress: 88
    }
  ],
  recentSessions: [
    {
      id: 1,
      title: 'Quadratic Equations - Session 2',
      class: '10-A',
      date: '2024-03-06',
      students: 28,
      duration: '45 mins'
    },
    {
      id: 2,
      title: 'Photosynthesis Practical',
      class: '10-B',
      date: '2024-03-06',
      students: 29,
      duration: '60 mins'
    },
    {
      id: 3,
      title: 'Shakespeare\'s Sonnets',
      class: '11-A',
      date: '2024-03-05',
      students: 31,
      duration: '45 mins'
    }
  ],
  upcomingTasks: [
    {
      id: 1,
      title: 'Grade Quiz - 10-A Geometry',
      due: '2024-03-07',
      priority: 'high',
      completed: false
    },
    {
      id: 2,
      title: 'Create Assignment - 11-A Literature',
      due: '2024-03-08',
      priority: 'medium',
      completed: false
    },
    {
      id: 3,
      title: 'Update Attendance - 12-A',
      due: '2024-03-06',
      priority: 'high',
      completed: true
    }
  ]
};

export default function TeacherDashboard() {
  return (
    <TeacherLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Stats */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Classes</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.totalClasses}</div>
                <div className="text-xs text-gray-500 mt-2">Total classes</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Students</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.totalStudents}</div>
                <div className="text-xs text-gray-500 mt-2">Total students</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Attendance</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.avgAttendance}%</div>
                <div className="text-xs text-gray-500 mt-2">Average</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-gray-600 text-sm font-medium mb-2">Performance</div>
                <div className="text-2xl font-bold text-gray-900">{mockDashboardData.stats.avgScore}%</div>
                <div className="text-xs text-gray-500 mt-2">Avg score</div>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-4">
              {mockDashboardData.classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Class {cls.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">📚 {cls.subject}</span>
                        <span className="flex items-center gap-1">👥 {cls.students} Students</span>
                        <span className="flex items-center gap-1">📝 {cls.sessions} Sessions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{cls.avgScore}%</span>
                      <p className="text-xs text-gray-600">Avg Score</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Course Progress</span>
                      <span className="text-sm font-semibold text-gray-900">{cls.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${cls.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {mockDashboardData.recentSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{session.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Class {session.class}</span>
                        <span>{session.date}</span>
                        <span>👥 {session.students} students</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 px-3 py-1 bg-purple-50 text-purple-600 rounded">
                      {session.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          {/* Tasks Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Pending Tasks
            </h3>
            <div className="space-y-3">
              {mockDashboardData.upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    task.completed
                      ? 'bg-green-50 border-l-green-600'
                      : task.priority === 'high'
                      ? 'bg-red-50 border-l-red-600'
                      : 'bg-yellow-50 border-l-yellow-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      className="mt-1"
                      readOnly
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Due {task.due}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow">
                + New Session
              </button>
              <button className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                Mark Attendance
              </button>
              <button className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                Request Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

