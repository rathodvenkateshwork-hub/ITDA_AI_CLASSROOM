import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getApiBase } from '@/api/client';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Send, Trash2, CheckCircle, AlertTriangle, ChevronDown, Users, Zap, List, Eye, EyeOff, StopCircle } from 'lucide-react';

interface ScannedResponse {
  student_id: string;
  option: string;
  student_name?: string;
  timestamp: number;
  submitted: boolean;
}

type ParsedQR =
  | { kind: 'response'; student_id: string; option: string }
  | { kind: 'student-id'; qr_data: string };

interface QuizSession {
  id: number;
  title: string;
  session_code: string;
  status: string;
  questions: any[];
}

export default function TeacherQuizScanner() {
  const API = getApiBase();

  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuizSession | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [scannedResponses, setScannedResponses] = useState<ScannedResponse[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [showScanned, setShowScanned] = useState(true);

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>('qr-reader');
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await fetch(`${API}/api/qr-quiz/sessions?status=active`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [API]);

  // Select session and load questions
  const selectSession = async (session: QuizSession) => {
    setSelectedSession(session);
    try {
      const res = await fetch(`${API}/api/qr-quiz/sessions/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
        // Auto-select the active/collecting question
        const activeQ = data.questions?.find((q: any) => q.status === 'displayed' || q.status === 'collecting');
        if (activeQ) setCurrentQuestionId(activeQ.id);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  // Parse QR code data: expected format "student_id|option"
  const parseQRCode = (data: string): ParsedQR | null => {
    const parts = data.split('|');
    if (parts.length === 2) {
      const student_id = parts[0].trim();
      const option = parts[1].trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(option) && student_id) {
        return { kind: 'response', student_id, option };
      }
    }

    try {
      const parsed = JSON.parse(data);
      if (parsed && (parsed.student_id || parsed.student_unique_id)) {
        return { kind: 'student-id', qr_data: data };
      }
    } catch {
      // ignore parse error
    }

    return null;
  };

  // Handle a successful scan
  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Debounce: skip duplicate scans within 2 seconds
    const now = Date.now();
    if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) return;
    lastScanRef.current = decodedText;
    lastScanTimeRef.current = now;

    const parsed = parseQRCode(decodedText);
    if (!parsed) {
      setError(`Invalid QR code: ${decodedText}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (parsed.kind === 'student-id') {
      try {
        const res = await fetch(`${API}/api/students/qr/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_data: parsed.qr_data }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Unable to fetch student details');
          setTimeout(() => setError(''), 3000);
          return;
        }
        setSuccessMsg(`Student: ${data.full_name} | ID: ${data.student_unique_id || data.id} | Class: ${data.class_name || 'N/A'}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch {
        setError('Unable to fetch student details');
        setTimeout(() => setError(''), 3000);
      }
      return;
    }

    // Check for duplicate in current scans
    const isDuplicate = scannedResponses.some(
      r => r.student_id === parsed.student_id && !r.submitted
    );

    if (isDuplicate) {
      // Update the option for this student (re-scan = change answer)
      setScannedResponses(prev =>
        prev.map(r =>
          r.student_id === parsed.student_id && !r.submitted
            ? { ...r, option: parsed.option, timestamp: now }
            : r
        )
      );
      setSuccessMsg(`Updated: Student ${parsed.student_id} → ${parsed.option}`);
    } else {
      const newResp: ScannedResponse = {
        student_id: parsed.student_id,
        option: parsed.option,
        timestamp: now,
        submitted: false,
      };
      setScannedResponses(prev => [...prev, newResp]);
      setSuccessMsg(`Scanned: Student ${parsed.student_id} → ${parsed.option}`);
    }
    setTimeout(() => setSuccessMsg(''), 2000);

    // Auto-submit single response
    if (autoSubmit && currentQuestionId) {
      try {
        await fetch(`${API}/api/qr-quiz/responses/single`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQuestionId,
            student_id: parseInt(parsed.student_id),
            selected_option: parsed.option,
          }),
        });
      } catch (err) {
        console.error('Auto-submit failed:', err);
      }
    }
  }, [scannedResponses, autoSubmit, currentQuestionId, API]);

  // Start camera scanning
  const startScanning = async () => {
    if (!currentQuestionId) {
      setError('Select a question first');
      return;
    }
    try {
      const qr = new Html5Qrcode(scannerContainerRef.current);
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => onScanSuccess(decodedText),
        () => {} // ignore errors (no QR found in frame)
      );
      setScanning(true);
      setError('');
    } catch (err: any) {
      setError(`Camera error: ${err?.message || err}`);
    }
  };

  // Stop camera scanning
  const stopScanning = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

  // Batch submit all unsubmitted responses
  const batchSubmit = async () => {
    if (!currentQuestionId) return;
    const unsubmitted = scannedResponses.filter(r => !r.submitted);
    if (unsubmitted.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/qr-quiz/responses/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestionId,
          responses: unsubmitted.map(r => ({
            student_id: parseInt(r.student_id),
            selected_option: r.option,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScannedResponses(prev => prev.map(r => ({ ...r, submitted: true })));
        setSuccessMsg(`Submitted ${data.inserted} responses`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Submission failed');
      }
    } catch (err: any) {
      setError(`Submit error: ${err.message}`);
    }
    setSubmitting(false);
  };

  // Display current question on board
  const displayQuestion = async (questionId: number) => {
    try {
      await fetch(`${API}/api/qr-quiz/questions/${questionId}/display`, { method: 'PUT' });
      setCurrentQuestionId(questionId);
      setScannedResponses([]);
      setSuccessMsg('Question displayed on board!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError(`Failed to display: ${err.message}`);
    }
  };

  // Reveal answer
  const revealAnswer = async () => {
    if (!currentQuestionId) return;
    try {
      await fetch(`${API}/api/qr-quiz/questions/${currentQuestionId}/reveal`, { method: 'PUT' });
      setSuccessMsg('Answer revealed on board!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(`Reveal failed: ${err.message}`);
    }
  };

  // Clear scanned responses list
  const clearResponses = () => {
    setScannedResponses([]);
  };

  const unsubmittedCount = scannedResponses.filter(r => !r.submitted).length;
  const currentQuestion = selectedSession?.questions?.find((q: any) => q.id === currentQuestionId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">QR Quiz Scanner</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-500">{scanning ? 'Scanning' : 'Idle'}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Session Selector */}
        {!selectedSession ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700">Select Quiz Session</h2>
            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                No active quiz sessions found. Create one from the admin panel.
              </div>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className="w-full bg-white rounded-xl p-4 text-left shadow-sm border hover:border-blue-500 transition-colors"
                >
                  <p className="font-semibold text-gray-800">{s.title}</p>
                  <p className="text-sm text-gray-500">Code: <span className="font-mono font-bold">{s.session_code}</span></p>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Session Info */}
            <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-800">{selectedSession.title}</p>
                <p className="text-sm text-blue-600 font-mono">{selectedSession.session_code}</p>
              </div>
              <button onClick={() => { stopScanning(); setSelectedSession(null); }} className="text-sm text-blue-600 underline">Change</button>
            </div>

            {/* Question Selector */}
            <div className="bg-white rounded-xl shadow-sm border p-3">
              <p className="text-sm font-medium text-gray-500 mb-2">Questions</p>
              <div className="space-y-2">
                {selectedSession.questions?.map((q: any, i: number) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentQuestionId(q.id)}
                      className={`flex-1 text-left p-2 rounded-lg text-sm ${currentQuestionId === q.id ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-50 text-gray-700'}`}
                    >
                      Q{i + 1}: {q.question_text.substring(0, 50)}...
                    </button>
                    <button
                      onClick={() => displayQuestion(q.id)}
                      className="shrink-0 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                      title="Display on board"
                    >
                      Display
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-700">{successMsg}</p>
              </div>
            )}

            {/* Camera Preview */}
            <div className="bg-black rounded-xl overflow-hidden">
              <div id={scannerContainerRef.current} className={scanning ? 'w-full' : 'hidden'} />
              {!scanning && (
                <div className="h-48 flex items-center justify-center text-white/50">
                  <CameraOff className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {!scanning ? (
                <button
                  onClick={startScanning}
                  disabled={!currentQuestionId}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" /> Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-semibold"
                >
                  <StopCircle className="w-5 h-5" /> Stop Scanning
                </button>
              )}
              <button
                onClick={revealAnswer}
                disabled={!currentQuestionId}
                className="bg-purple-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              >
                <Eye className="w-5 h-5" /> Reveal
              </button>
            </div>

            {/* Auto-submit toggle */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border">
              <span className="text-sm text-gray-700">Auto-submit on scan</span>
              <button
                onClick={() => setAutoSubmit(prev => !prev)}
                className={`relative w-12 h-6 rounded-full transition-colors ${autoSubmit ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSubmit ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Scanned Responses */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Scanned: {scannedResponses.length}</span>
                  {unsubmittedCount > 0 && !autoSubmit && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{unsubmittedCount} pending</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowScanned(p => !p)} className="text-gray-400 p-1">
                    {showScanned ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={clearResponses} className="text-gray-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {showScanned && (
                <div className="max-h-48 overflow-y-auto divide-y">
                  {scannedResponses.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No scans yet</p>
                  ) : (
                    scannedResponses.map((r, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between text-sm">
                        <span className="text-gray-700">Student #{r.student_id}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold px-2 py-0.5 rounded ${r.option === 'A' ? 'bg-red-100 text-red-700' : r.option === 'B' ? 'bg-blue-100 text-blue-700' : r.option === 'C' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {r.option}
                          </span>
                          {r.submitted && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Batch Submit Button (when auto-submit is off) */}
            {!autoSubmit && unsubmittedCount > 0 && (
              <button
                onClick={batchSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              >
                <Send className="w-5 h-5" /> Submit {unsubmittedCount} Responses
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
