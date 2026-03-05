import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiBase } from '@/api/client';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Users, Download } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  roll_number?: string;
  student_unique_id?: string;
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COLORS: Record<string, string> = {
  A: '#ef4444',
  B: '#3b82f6',
  C: '#eab308',
  D: '#22c55e',
};
const OPTION_BG: Record<string, string> = {
  A: '#fef2f2',
  B: '#eff6ff',
  C: '#fefce8',
  D: '#f0fdf4',
};

export default function PrintableQRCards() {
  const [searchParams] = useSearchParams();
  const API = getApiBase();

  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState(searchParams.get('class') || '');
  const [loading, setLoading] = useState(false);
  const [manualStudents, setManualStudents] = useState('');

  // Load students for a class
  useEffect(() => {
    if (!classId) return;
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/student/class/${classId}`);
        if (res.ok) setStudents(await res.json());
      } catch (err) {
        console.error('Failed to load students:', err);
      }
      setLoading(false);
    };
    loadStudents();
  }, [classId, API]);

  // Manually add students from IDs (comma-separated)
  const addManualStudents = () => {
    const ids = manualStudents.split(',').map(s => s.trim()).filter(Boolean);
    const manual: Student[] = ids.map((id, i) => ({
      id: parseInt(id) || i + 1000,
      name: `Student ${id}`,
      student_unique_id: id,
    }));
    setStudents(prev => [...prev, ...manual]);
    setManualStudents('');
  };

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Controls (hidden in print) */}
      <div className="print:hidden p-6 space-y-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">QR Answer Cards</h1>
        <p className="text-gray-500">Generate printable QR answer cards (A/B/C/D) for each student. Each QR encodes <code className="bg-gray-100 px-1 rounded">student_id|option</code>.</p>

        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Class ID</label>
            <input
              type="number"
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="border rounded-lg px-3 py-2 w-32"
              placeholder="e.g. 6"
            />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={manualStudents}
              onChange={e => setManualStudents(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Or enter student IDs: 1001, 1002, 1003"
            />
            <button onClick={addManualStudents} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
          </div>
        </div>

        {students.length > 0 && (
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
            <span className="text-green-700 font-medium"><Users className="inline w-4 h-4 mr-1" />{students.length} students loaded</span>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700"
            >
              <Printer className="w-5 h-5" /> Print Cards
            </button>
          </div>
        )}
      </div>

      {/* Printable Cards */}
      <div className="print:p-0 p-6">
        {students.map((student) => (
          <div key={student.id} className="break-inside-avoid mb-8 print:mb-4">
            {/* Student Header */}
            <div className="border-b-2 border-gray-800 pb-2 mb-3 print:pb-1 print:mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 print:text-base">{student.name}</h2>
                  <p className="text-sm text-gray-500 print:text-xs">
                    ID: {student.id}
                    {student.roll_number && ` | Roll: ${student.roll_number}`}
                    {student.student_unique_id && ` | UID: ${student.student_unique_id}`}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400 print:text-xs">
                  QR Answer Cards
                </div>
              </div>
            </div>

            {/* 4 QR Cards in a row */}
            <div className="grid grid-cols-4 gap-4 print:gap-2">
              {OPTIONS.map((opt) => {
                const qrValue = `${student.id}|${opt}`;
                return (
                  <div
                    key={opt}
                    className="border-2 rounded-xl p-3 print:p-2 flex flex-col items-center"
                    style={{ borderColor: OPTION_COLORS[opt], backgroundColor: OPTION_BG[opt] }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 print:w-8 print:h-8 print:text-lg print:mb-1"
                      style={{ backgroundColor: OPTION_COLORS[opt] }}
                    >
                      {opt}
                    </div>
                    <QRCodeSVG
                      value={qrValue}
                      size={120}
                      level="M"
                      includeMargin={false}
                      className="print:w-[80px] print:h-[80px]"
                    />
                    <p className="mt-2 text-xs text-gray-400 font-mono print:mt-1 print:text-[8px]">{qrValue}</p>
                  </div>
                );
              })}
            </div>

            {/* Cut line */}
            <div className="mt-3 border-t border-dashed border-gray-300 print:mt-2" />
          </div>
        ))}

        {students.length === 0 && (
          <div className="text-center text-gray-400 py-12 print:hidden">
            <QRCodeSVG value="sample" size={80} className="mx-auto mb-4 opacity-30" />
            <p>Enter a class ID or student IDs above to generate cards</p>
          </div>
        )}
      </div>
    </div>
  );
}
