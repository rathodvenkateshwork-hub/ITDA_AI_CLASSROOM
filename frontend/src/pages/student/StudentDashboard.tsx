import React from 'react';
import { ArrowRight, TrendingUp, Award, Zap, BookOpen, Target, Star } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';

const mockDashboardData = {
  stats: {
    totalPoints: 2450,
    quizzesCompleted: 23,
    materialsViewed: 45,
    currentStreak: 7,
    overallScore: 82,
    rank: 8,
    className: '10-A'
  },
  recentActivity: [
    {
      id: 1,
      type: 'quiz',
      title: 'Chapter 5 Quiz: Quadratic Equations',
      score: 92,
      date: '2024-03-06',
      subject: 'Mathematics'
    },
    {
      id: 2,
      type: 'material',
      title: 'Photosynthesis - Video Lecture',
      duration: '15 mins',
      date: '2024-03-06',
      subject: 'Science'
    },
    {
      id: 3,
      type: 'quiz',
      title: 'Chapter 3 Quiz: Periodic Table',
      score: 78,
      date: '2024-03-05',
      subject: 'Science'
    },
    {
      id: 4,
      type: 'badge',
      title: 'Quiz Master Badge Earned',
      badge: '🏆',
      date: '2024-03-05',
      subject: 'Achievement'
    }
  ],
  badges: [
    { id: 1, name: 'Fast Learner', description: 'Complete 5 chapters in a week', earned: true, icon: '⚡', progress: 100 },
    { id: 2, name: 'Quiz Master', description: 'Score 90+ in 10 quizzes', earned: true, icon: '🏆', progress: 100 },
    { id: 3, name: 'Consistent', description: 'Maintain 7-day learning streak', earned: true, icon: '🔥', progress: 100 },
    { id: 4, name: 'Knowledge Master', description: 'Study 50 materials', earned: false, icon: '📚', progress: 90 }
  ],
  weakAreas: [
    { subject: 'English', percentage: 68, topics: ['Grammar', 'Comprehension'] },
    { subject: 'History', percentage: 71, topics: ['Ancient Period', 'Medieval History'] }
  ],
  strongAreas: [
    { subject: 'Mathematics', percentage: 92, topics: ['Algebra', 'Geometry'] },
    { subject: 'Science', percentage: 88, topics: ['Physics', 'Chemistry'] }
  ]
};

export default function StudentDashboard() {
  return (
    <StudentLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-purple-600 text-2xl font-bold">{mockDashboardData.stats.totalPoints}</div>
                <div className="text-xs text-gray-600 mt-1">Learning Points</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-green-600 text-2xl font-bold">{mockDashboardData.stats.overallScore}%</div>
                <div className="text-xs text-gray-600 mt-1">Overall Score</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-blue-600 text-2xl font-bold">#{mockDashboardData.stats.rank}</div>
                <div className="text-xs text-gray-600 mt-1">Class Rank</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-orange-600 text-2xl font-bold">{mockDashboardData.stats.currentStreak}</div>
                <div className="text-xs text-gray-600 mt-1">Day Streak 🔥</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-indigo-600 text-2xl font-bold">{mockDashboardData.stats.quizzesCompleted}</div>
                <div className="text-xs text-gray-600 mt-1">Quizzes Done</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-pink-600 text-2xl font-bold">{mockDashboardData.stats.materialsViewed}</div>
                <div className="text-xs text-gray-600 mt-1">Materials Studied</div>
              </div>
            </div>
          </div>

          {/* Strong & Weak Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Strong Areas
              </h2>
              <div className="space-y-3">
                {mockDashboardData.strongAreas.map((area, idx) => (
                  <div key={idx} className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{area.subject}</h3>
                      <span className="text-sm font-bold text-green-600">{area.percentage}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {area.topics.map((topic, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Areas */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                Areas to Improve
              </h2>
              <div className="space-y-3">
                {mockDashboardData.weakAreas.map((area, idx) => (
                  <div key={idx} className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{area.subject}</h3>
                      <span className="text-sm font-bold text-red-600">{area.percentage}%</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {area.topics.map((topic, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {mockDashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {activity.type === 'quiz' && <Zap className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'material' && <BookOpen className="w-4 h-4 text-green-600" />}
                        {activity.type === 'badge' && <Award className="w-4 h-4 text-yellow-600" />}
                        <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                        <span>{activity.subject}</span>
                        <span>•</span>
                        <span>{activity.date}</span>
                      </div>
                    </div>
                    {activity.type === 'quiz' && (
                      <span className="text-sm font-bold text-blue-600">{activity.score}%</span>
                    )}
                    {activity.type === 'material' && (
                      <span className="text-sm text-gray-600">{activity.duration}</span>
                    )}
                    {activity.type === 'badge' && (
                      <span className="text-2xl">{activity.badge}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Achievements Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Badges Earned
            </h3>
            <div className="space-y-3">
              {mockDashboardData.badges.filter(b => b.earned).map((badge) => (
                <div key={badge.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="flex-1">
                      <p className="font-small text-gray-900">{badge.name}</p>
                      <p className="text-xs text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Next Badge
            </h3>
            {mockDashboardData.badges.filter(b => !b.earned).length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                {mockDashboardData.badges.filter(b => !b.earned)[0] && (
                  <>
                    <p className="font-semibold text-gray-900 mb-2">
                      {mockDashboardData.badges.filter(b => !b.earned)[0].name}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      {mockDashboardData.badges.filter(b => !b.earned)[0].description}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all"
                        style={{ width: `${mockDashboardData.badges.filter(b => !b.earned)[0].progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {mockDashboardData.badges.filter(b => !b.earned)[0].progress}% complete
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-md transition-shadow">
                📖 Browse Materials
              </button>
              <button className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                ⚡ Take a Quiz
              </button>
              <button className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors">
                💬 Chat with AI
              </button>
            </div>
          </div>

          {/* Study Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-purple-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Study Tip</h3>
            <p className="text-sm text-gray-700">
              Try breaking your study sessions into 25-minute intervals with short breaks. This technique, called the Pomodoro Method, can significantly improve your focus and retention!
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

