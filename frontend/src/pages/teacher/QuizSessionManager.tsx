import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '@/api/client';
import { Plus, Trash2, Play, ExternalLink, QrCode, Printer, ListChecks, CheckCircle, AlertTriangle } from 'lucide-react';

interface QuestionInput {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  time_limit_seconds: number;
  points: number;
}

interface QuizSession {
  id: number;
  title: string;
  session_code: string;
  status: string;
  class_id?: number;
  subject_id?: number;
  created_at: string;
  questions?: any[];
}

const emptyQuestion = (): QuestionInput => ({
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  time_limit_seconds: 30,
  points: 10,
});

export default function QuizSessionManager() {
  const API = getApiBase();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([emptyQuestion()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load sessions
  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/api/qr-quiz/sessions`);
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string | number) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const createSession = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    const valid = questions.every(q => q.question_text && q.option_a && q.option_b && q.option_c && q.option_d);
    if (!valid) { setError('All questions must have text and 4 options'); return; }

    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/qr-quiz/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          class_id: classId ? parseInt(classId) : undefined,
          subject_id: subjectId ? parseInt(subjectId) : undefined,
          questions: questions.map((q, i) => ({ ...q, question_number: i + 1 })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Session created! Code: ${data.session_code}`);
        setShowCreate(false);
        setTitle('');
        setQuestions([emptyQuestion()]);
        loadSessions();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create session');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setCreating(false);
  };

  const startSession = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/qr-quiz/sessions/${id}/start`, { method: 'PUT' });
      if (res.ok) loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const completeSession = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/qr-quiz/sessions/${id}/complete`, { method: 'PUT' });
      if (res.ok) loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-700';
      case 'active': case 'collecting': return 'bg-green-100 text-green-700';
      case 'submitted': case 'revealed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">QR Quiz Sessions</h1>
        <button
          onClick={() => setShowCreate(prev => !prev)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" /> New Quiz
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-700 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Create Session Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Create New Quiz Session</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Quiz Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g. Physics Chapter 3 Quiz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Class ID</label>
              <input
                type="number"
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Subject ID</label>
              <input
                type="number"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Questions ({questions.length})</h3>
              <button onClick={addQuestion} className="text-indigo-600 flex items-center gap-1 text-sm font-medium hover:text-indigo-800">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Question {idx + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter question text..."
                />
                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${opt === 'A' ? 'bg-red-500' : opt === 'B' ? 'bg-blue-500' : opt === 'C' ? 'bg-yellow-500' : 'bg-green-500'}`}>{opt}</span>
                      <input
                        type="text"
                        value={q[`option_${opt.toLowerCase()}` as keyof QuestionInput] as string}
                        onChange={e => updateQuestion(idx, `option_${opt.toLowerCase()}`, e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                        placeholder={`Option ${opt}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Correct Answer</label>
                    <select
                      value={q.correct_option}
                      onChange={e => updateQuestion(idx, 'correct_option', e.target.value)}
                      className="border rounded-lg px-2 py-1 ml-2 text-sm"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Time (s)</label>
                    <input
                      type="number"
                      value={q.time_limit_seconds}
                      onChange={e => updateQuestion(idx, 'time_limit_seconds', parseInt(e.target.value) || 30)}
                      className="border rounded-lg px-2 py-1 ml-2 w-20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Points</label>
                    <input
                      type="number"
                      value={q.points}
                      onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value) || 10)}
                      className="border rounded-lg px-2 py-1 ml-2 w-20 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={createSession}
              disabled={creating}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Quiz Session'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-gray-600 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            <ListChecks className="w-12 h-12 mx-auto mb-3" />
            <p>No quiz sessions yet. Create your first quiz!</p>
          </div>
        ) : (
          sessions.map(s => (
            <div key={s.id} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(s.status)}`}>{s.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-500 font-mono">Code: {s.session_code}</span>
                    <span className="text-sm text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'created' && (
                    <button onClick={() => startSession(s.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700">
                      <Play className="w-4 h-4" /> Start
                    </button>
                  )}
                  {(s.status === 'active' || s.status === 'collecting' || s.status === 'revealed') && (
                    <>
                      <button
                        onClick={() => navigate(`/teacher/quiz-scanner`)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"
                      >
                        <QrCode className="w-4 h-4" /> Scan
                      </button>
                      <button
                        onClick={() => window.open(`/teacher/quiz-board?code=${s.session_code}`, '_blank')}
                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                      >
                        <ExternalLink className="w-4 h-4" /> Board
                      </button>
                      <button onClick={() => completeSession(s.id)} className="text-gray-400 hover:text-red-500 px-2 py-1.5" title="End session">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/teacher/qr-cards?session=${s.id}`)}
                    className="text-gray-500 hover:text-gray-700 px-2 py-1.5"
                    title="Print QR Cards"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
