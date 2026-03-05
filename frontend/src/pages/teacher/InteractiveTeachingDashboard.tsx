import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InteractiveTeachingDashboard = () => {
  const { teacherId, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [engagementData, setEngagementData] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [contextChunks, setContextChunks] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!teacherId || !selectedClass || !selectedSubject) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/rag/teacher/${teacherId}/dashboard/class/${selectedClass}/subject/${selectedSubject}`
        );
        const data = await response.json();
        setDashboard(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [teacherId, selectedClass, selectedSubject]);

  // Start interactive session
  const startSession = async (sessionType) => {
    try {
      setGeneratingContent(false);
      
      const sessionData = {
        teacher_id: teacherId,
        class_id: selectedClass,
        subject_id: selectedSubject,
        chapter_id: selectedChapter,
        chapter_session_id: selectedSession,
        session_date: new Date().toISOString(),
        session_type: sessionType,
        student_count: dashboard?.class?.student_count || 30,
      };

      const response = await fetch(`/api/rag/interactive-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const session = await response.json();
      setCurrentSession(session);

      // Retrieve context
      await retrieveContext(session.id, sessionType);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Retrieve RAG context
  const retrieveContext = async (sessionId, sessionType) => {
    try {
      const response = await fetch(`/api/rag/interactive-session/${sessionId}/retrieve-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${sessionType} for class ${selectedClass} subject ${selectedSubject}`,
          limit: 10,
        }),
      });

      const data = await response.json();
      setContextChunks(data.chunks);
    } catch (error) {
      console.error('Error retrieving context:', error);
    }
  };

  // Generate PPT
  const generatePPT = async () => {
    try {
      setGeneratingContent(true);

      const response = await fetch(`/api/rag/interactive-session/${currentSession.id}/generate-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Class ${selectedClass} - ${selectedSubject}`,
          num_slides: 10,
        }),
      });

      const content = await response.json();
      setGeneratedContent({
        type: 'ppt',
        ...content,
      });
    } catch (error) {
      console.error('Error generating PPT:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Generate Quiz
  const generateQuiz = async () => {
    try {
      setGeneratingContent(true);

      const response = await fetch(`/api/rag/interactive-session/${currentSession.id}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Quiz - Class ${selectedClass}`,
          num_questions: 10,
          difficulty: 'intermediate',
        }),
      });

      const content = await response.json();
      setGeneratedContent({
        type: 'quiz',
        ...content,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Get YouTube recommendations
  const getYouTubeRecommendations = async () => {
    try {
      setGeneratingContent(true);

      const response = await fetch(
        `/api/rag/interactive-session/${currentSession.id}/get-youtube-recommendations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const content = await response.json();
      setGeneratedContent({
        type: 'youtube',
        ...content,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Complete session
  const completeSession = async () => {
    try {
      await fetch(`/api/rag/interactive-session/${currentSession.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      setCurrentSession(null);
      setGeneratedContent(null);
      setContextChunks([]);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  if (!isAuthenticated || !teacherId) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-900">Authentication Required</h2>
        <p className="text-red-700">Please log in to access the interactive teaching dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interactive Teaching Dashboard</h1>
          <p className="text-lg text-gray-600">AI-Powered Content Generation & Real-Time Engagement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls & Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Class Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Class & Subject</h2>
              
              <div className="space-y-4">
                {/* Class Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={selectedClass || ''}
                    onChange={(e) => {
                      setSelectedClass(parseInt(e.target.value));
                      setSelectedSubject(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class...</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={selectedSubject || ''}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedChapter(null);
                    }}
                    disabled={!selectedClass}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Subject...</option>
                    {['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'].map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                {/* Chapter Dropdown */}
                {selectedSubject && dashboard && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
                    <select
                      value={selectedChapter || ''}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Chapters</option>
                      {dashboard.chapters && dashboard.chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Session Dropdown */}
                {selectedChapter && dashboard && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Session</label>
                    <select
                      value={selectedSession || ''}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Session...</option>
                      {dashboard.chapter_sessions && dashboard.chapter_sessions.map((sess) => (
                        <option key={sess.id} value={sess.id}>{sess.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {!currentSession && selectedClass && selectedSubject && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => startSession('ppt_generation')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    📊 Generate PPT
                  </button>
                  <button
                    onClick={() => startSession('quiz_generation')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    📝 Create Quiz
                  </button>
                  <button
                    onClick={() => startSession('youtube_recommendation')}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    📹 YouTube Videos
                  </button>
                  <button
                    onClick={() => startSession('summary')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    📚 AI Summary
                  </button>
                </div>
              </div>
            )}

            {/* Session Status */}
            {currentSession && (
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Active Session</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> {currentSession.session_type}</p>
                  <p><span className="font-medium">Status:</span> <span className="text-green-600">Active</span></p>
                  <p><span className="font-medium">Duration:</span> {Math.round((Date.now() - new Date(currentSession.start_time)) / 60000)} min</p>
                </div>
                <button
                  onClick={completeSession}
                  className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Content Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Context Retrieval */}
            {currentSession && contextChunks.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📚 Retrieved Context ({contextChunks.length} chunks)</h2>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {contextChunks.map((chunk, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Chunk {chunk.chunk_number}</p>
                      <p className="text-sm text-gray-700 mt-1 truncate">{chunk.chunk_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Generation */}
            {currentSession && !generatedContent && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Content</h2>

                {currentSession.session_type === 'ppt_generation' && (
                  <button
                    onClick={generatePPT}
                    disabled={generatingContent}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {generatingContent ? '🔄 Generating PPT...' : '📊 Generate PPT Slides'}
                  </button>
                )}

                {currentSession.session_type === 'quiz_generation' && (
                  <button
                    onClick={generateQuiz}
                    disabled={generatingContent}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {generatingContent ? '🔄 Generating Quiz...' : '📝 Generate Quiz Questions'}
                  </button>
                )}

                {currentSession.session_type === 'youtube_recommendation' && (
                  <button
                    onClick={getYouTubeRecommendations}
                    disabled={generatingContent}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                  >
                    {generatingContent ? '🔄 Finding Videos...' : '📹 Get YouTube Recommendations'}
                  </button>
                )}

                {currentSession.session_type === 'summary' && (
                  <button
                    onClick={generateQuiz}
                    disabled={generatingContent}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                  >
                    {generatingContent ? '🔄 Generating Summary...' : '📚 Generate AI Summary'}
                  </button>
                )}
              </div>
            )}

            {/* Generated Content Display */}
            {generatedContent && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Generated Content</h2>
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* PPT Content */}
                {generatedContent.type === 'ppt' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">PPT Generated Successfully ✓</p>
                      <p className="text-sm text-gray-700 mt-2">{generatedContent.slides} slides created</p>
                      <a
                        href={generatedContent.content_url}
                        download
                        className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        📥 Download PPT
                      </a>
                    </div>
                  </div>
                )}

                {/* Quiz Content */}
                {generatedContent.type === 'quiz' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Quiz Generated Successfully ✓</p>
                      <p className="text-sm text-gray-700 mt-2">{generatedContent.questions} questions created</p>
                      <a
                        href={generatedContent.content_url}
                        download
                        className="mt-3 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        📥 Download Quiz
                      </a>
                    </div>
                  </div>
                )}

                {/* YouTube Recommendations */}
                {generatedContent.type === 'youtube' && (
                  <div className="space-y-4">
                    {generatedContent.recommendations?.map((video, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{video.channel}</p>
                            <p className="text-xs text-gray-500 mt-2">{video.views} views • {video.duration}</p>
                          </div>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Watch
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Stats */}
            {!currentSession && dashboard && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Materials Available</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboard.available_materials}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Chapter Sessions</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.chapter_sessions}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Recent Sessions</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboard.recent_sessions?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Chapters</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboard.chapters}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTeachingDashboard;
