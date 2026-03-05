import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiBase } from '@/api/client';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, Trophy, Users, Clock, Wifi, WifiOff, BarChart3, Zap } from 'lucide-react';

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  time_limit_seconds: number;
  points: number;
  explanation?: string;
  status: string;
}

interface LeaderboardEntry {
  rank: number;
  student_id: number;
  student_name: string;
  total_points: number;
  total_correct: number;
}

interface RevealData {
  question_id: number;
  correct_option: string;
  explanation?: string;
  distribution: Record<string, number>;
  total_responses: number;
  correct_count: number;
  accuracy: number;
  leaderboard_top5: LeaderboardEntry[];
}

const OPTION_COLORS = {
  A: { bg: 'bg-red-500', light: 'bg-red-100 text-red-800', bar: 'bg-red-400' },
  B: { bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-800', bar: 'bg-blue-400' },
  C: { bg: 'bg-yellow-500', light: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400' },
  D: { bg: 'bg-green-500', light: 'bg-green-100 text-green-800', bar: 'bg-green-400' },
};

type BoardPhase = 'waiting' | 'question' | 'collecting' | 'reveal' | 'leaderboard' | 'complete';

export default function QuizBoardDisplay() {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get('code') || '';
  const API = getApiBase();

  const [phase, setPhase] = useState<BoardPhase>('waiting');
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load session by code
  useEffect(() => {
    if (!sessionCode) return;
    const loadSession = async () => {
      try {
        const res = await fetch(`${API}/api/qr-quiz/sessions/code/${sessionCode}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    };
    loadSession();
  }, [sessionCode, API]);

  // SSE connection
  useEffect(() => {
    if (!session?.id) return;
    const es = new EventSource(`${API}/api/qr-quiz/session/${session.id}/stream`);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => setConnected(true));

    es.addEventListener('question_displayed', (e) => {
      const q = JSON.parse(e.data);
      setCurrentQuestion(q);
      setScanCount(0);
      setRevealData(null);
      setPhase('collecting');
      setTimer(q.time_limit_seconds || 30);
    });

    es.addEventListener('scan_count_updated', (e) => {
      const data = JSON.parse(e.data);
      setScanCount(data.total_scanned);
    });

    es.addEventListener('answer_revealed', (e) => {
      const data = JSON.parse(e.data);
      setRevealData(data);
      setLeaderboard(data.leaderboard_top5 || []);
      setPhase('reveal');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    });

    es.addEventListener('session_completed', () => {
      setPhase('complete');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    });

    es.addEventListener('session_started', () => setPhase('waiting'));

    es.onerror = () => setConnected(false);

    return () => { es.close(); };
  }, [session?.id, API]);

  // Countdown timer
  useEffect(() => {
    if (phase === 'collecting' && timer > 0) {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  // ── Waiting Screen ─────────────────────────────────────────
  if (!sessionCode || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4">📋</div>
          <h1 className="text-5xl font-bold">QR Quiz Board</h1>
          <p className="text-xl text-blue-200">Add <code className="bg-white/10 px-2 py-1 rounded">?code=XXXXXX</code> to URL to connect to a session</p>
        </div>
      </div>
    );
  }

  // ── Waiting for Question ───────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center gap-3 text-green-400">
            {connected ? <Wifi className="w-8 h-8" /> : <WifiOff className="w-8 h-8 text-red-400" />}
            <span className="text-xl">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
          <h1 className="text-6xl font-bold">{session.title || 'Quiz Session'}</h1>
          <div className="bg-white/10 rounded-2xl p-8 inline-block">
            <p className="text-blue-200 text-lg mb-2">Session Code</p>
            <p className="text-7xl font-mono font-bold tracking-widest">{session.session_code}</p>
          </div>
          <p className="text-2xl text-blue-200 animate-pulse">Waiting for teacher to display a question...</p>
          <p className="text-lg text-blue-300">{session.questions?.length || 0} questions ready</p>
        </div>
      </div>
    );
  }

  // ── Collecting Responses ───────────────────────────────────
  if (phase === 'collecting' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="bg-white/10 px-4 py-2 rounded-xl text-lg font-mono">
              Q{currentQuestion.question_number}/{session.questions?.length || '?'}
            </span>
            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg text-sm">
              <Zap className="w-4 h-4 inline mr-1" />{currentQuestion.points} pts
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
              <Users className="w-5 h-5" />
              <span className="text-2xl font-bold">{scanCount}</span>
              <span className="text-sm text-blue-200">scanned</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-3xl font-mono font-bold ${timer <= 5 ? 'bg-red-500/30 text-red-300 animate-pulse' : 'bg-white/10'}`}>
              <Clock className="w-6 h-6" />
              {timer}s
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 mb-8">
          <h2 className="text-4xl font-bold leading-relaxed text-center">{currentQuestion.question_text}</h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-6">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <div key={opt} className={`${OPTION_COLORS[opt].bg} rounded-2xl p-8 flex items-center gap-6 shadow-xl`}>
              <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center text-3xl font-bold shrink-0">{opt}</div>
              <p className="text-2xl font-semibold">{currentQuestion[`option_${opt.toLowerCase()}` as keyof Question] as string}</p>
            </div>
          ))}
        </div>

        {/* Collecting indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-green-500/20 text-green-300 px-6 py-3 rounded-full text-xl">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            Scanning in progress — Hold up your QR cards!
          </div>
        </div>
      </div>
    );
  }

  // ── Answer Reveal ──────────────────────────────────────────
  if (phase === 'reveal' && currentQuestion && revealData) {
    const maxDist = Math.max(...Object.values(revealData.distribution), 1);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="bg-white/10 px-4 py-2 rounded-xl text-lg font-mono">
            Q{currentQuestion.question_number} — Results
          </span>
          <div className="flex items-center gap-4">
            <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5 inline mr-2" />{revealData.accuracy}% correct
            </span>
            <span className="bg-white/10 px-4 py-2 rounded-xl">
              <Users className="w-5 h-5 inline mr-2" />{revealData.total_responses} responses
            </span>
          </div>
        </div>

        {/* Question with correct answer */}
        <div className="bg-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-center mb-4">{currentQuestion.question_text}</h2>
          {revealData.explanation && (
            <p className="text-center text-blue-200 text-lg">{revealData.explanation}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Options with distribution */}
          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const count = revealData.distribution[opt] || 0;
              const isCorrect = opt === revealData.correct_option;
              const pct = revealData.total_responses > 0 ? Math.round((count / revealData.total_responses) * 100) : 0;
              return (
                <div key={opt} className={`rounded-xl p-4 flex items-center gap-4 ${isCorrect ? 'bg-green-500/30 ring-2 ring-green-400' : 'bg-white/5'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${OPTION_COLORS[opt].bg}`}>{opt}</div>
                  <div className="flex-1">
                    <p className="text-lg font-medium">{currentQuestion[`option_${opt.toLowerCase()}` as keyof Question] as string}</p>
                    <div className="mt-1 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${OPTION_COLORS[opt].bar} rounded-full transition-all duration-1000`} style={{ width: `${(count / maxDist) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-blue-200">{pct}%</p>
                  </div>
                  {isCorrect && <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400" /> Leaderboard</h3>
            <div className="space-y-3">
              {revealData.leaderboard_top5?.map((entry, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${i === 0 ? 'bg-yellow-500/20 ring-1 ring-yellow-400' : 'bg-white/5'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-orange-400 text-white' : 'bg-white/20'}`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{entry.student_name}</p>
                    <p className="text-sm text-blue-200">{entry.total_correct} correct</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-300">{entry.total_points} pts</p>
                </div>
              ))}
              {(!revealData.leaderboard_top5 || revealData.leaderboard_top5.length === 0) && (
                <p className="text-blue-200 text-center py-4">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Session Complete ───────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
        <div className="text-center space-y-8">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
          <h1 className="text-6xl font-bold">Quiz Complete!</h1>
          <p className="text-2xl text-blue-200">Great job everyone! 🎉</p>
          {leaderboard.length > 0 && (
            <div className="bg-white/10 rounded-2xl p-8 max-w-lg mx-auto">
              <h3 className="text-2xl font-bold mb-4">Final Leaderboard</h3>
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <span className={`text-3xl ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}`}>{i < 3 ? '' : `#${entry.rank}`}</span>
                  <span className="text-3xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
                  <span className="flex-1 text-xl font-medium">{entry.student_name}</span>
                  <span className="text-xl font-bold text-yellow-300">{entry.total_points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto" />
        <p className="text-xl">Loading session...</p>
      </div>
    </div>
  );
}
