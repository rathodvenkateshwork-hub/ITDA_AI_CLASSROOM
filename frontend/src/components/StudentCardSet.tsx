import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, GraduationCap, Printer } from 'lucide-react';

interface StudentData {
  id: string;
  student_unique_id?: string;
  name: string;
  rollNo: number;
  section?: string;
  className?: string;
  schoolName?: string;
}

interface Props {
  student: StudentData;
}

const OPTION_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  A: { bg: 'bg-red-500', text: 'text-red-700', hex: '#ef4444' },
  B: { bg: 'bg-blue-500', text: 'text-blue-700', hex: '#3b82f6' },
  C: { bg: 'bg-yellow-500', text: 'text-yellow-700', hex: '#eab308' },
  D: { bg: 'bg-green-500', text: 'text-green-700', hex: '#22c55e' },
};

const OPTION_BG_HEX: Record<string, string> = {
  A: '#fef2f2', B: '#eff6ff', C: '#fefce8', D: '#f0fdf4',
};

export default function StudentCardSet({ student }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const idQRValue = JSON.stringify({
    student_id: student.id,
    student_unique_id: student.student_unique_id,
    name: student.name,
    roll: student.rollNo,
    class: student.className || '',
  });

  // Draw one card to a canvas and return its data URL
  const renderCardToCanvas = useCallback((type: 'id' | 'A' | 'B' | 'C' | 'D'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const s = 3; // scale factor
      const W = 300, H = 380;
      canvas.width = W * s;
      canvas.height = H * s;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(s, s);

      // White rounded card background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 12);
      ctx.stroke();

      if (type === 'id') {
        // ID Card header
        ctx.fillStyle = '#1a9988';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, 56, [12, 12, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ITDA AI Classroom', W / 2, 24);
        ctx.font = '11px sans-serif';
        ctx.fillText('Student Identity Card', W / 2, 44);
      } else {
        // Option card header
        const color = OPTION_COLORS[type].hex;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(0, 0, W, 56, [12, 12, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Option ${type}`, W / 2, 38);
      }

      // Render QR SVG to image
      const qrValue = type === 'id' ? idQRValue : `${student.id}|${type}`;
      // Create a temporary QR code SVG
      const svgNS = 'http://www.w3.org/2000/svg';
      const tmpContainer = document.createElement('div');
      tmpContainer.style.position = 'absolute';
      tmpContainer.style.left = '-9999px';
      document.body.appendChild(tmpContainer);

      // Use ReactDOM-less approach: create the SVG string with qrcode lib
      // Instead, grab the SVG from the visible component
      const refId = type === 'id' ? 'qr-id-card' : `qr-opt-${type}`;
      const svgEl = document.getElementById(refId)?.querySelector('svg');

      if (svgEl) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
          const qrSize = 140;
          const qrX = (W - qrSize) / 2;
          const qrY = 72;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

          // Student info
          const infoY = qrY + qrSize + 20;
          ctx.fillStyle = '#1a2b3c';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(student.name, W / 2, infoY);

          ctx.fillStyle = '#6b7280';
          ctx.font = '11px sans-serif';
          ctx.fillText(`Roll: ${student.rollNo}${student.section ? ` | Sec: ${student.section}` : ''}`, W / 2, infoY + 18);
          if (student.className) ctx.fillText(student.className, W / 2, infoY + 34);

          // ID badge at bottom
          ctx.fillStyle = type === 'id' ? '#f0f9f8' : (OPTION_BG_HEX[type] || '#f3f4f6');
          ctx.beginPath();
          ctx.roundRect(50, H - 44, W - 100, 28, 6);
          ctx.fill();
          ctx.fillStyle = type === 'id' ? '#1a9988' : OPTION_COLORS[type]?.hex || '#666';
          ctx.font = 'bold 10px monospace';
          const label = type === 'id' ? `ID: ${student.student_unique_id || student.id}` : `${student.id}|${type}`;
          ctx.fillText(label, W / 2, H - 26);

          URL.revokeObjectURL(url);
          document.body.removeChild(tmpContainer);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = url;
      } else {
        document.body.removeChild(tmpContainer);
        resolve(canvas.toDataURL('image/png'));
      }
    });
  }, [student, idQRValue]);

  const downloadSingleCard = useCallback(async (type: 'id' | 'A' | 'B' | 'C' | 'D') => {
    const dataUrl = await renderCardToCanvas(type);
    const link = document.createElement('a');
    link.download = `${student.name.replace(/\s+/g, '-')}_${type === 'id' ? 'ID-Card' : `Option-${type}`}.png`;
    link.href = dataUrl;
    link.click();
  }, [renderCardToCanvas, student.name]);

  const downloadAllCards = useCallback(async () => {
    const types: ('id' | 'A' | 'B' | 'C' | 'D')[] = ['id', 'A', 'B', 'C', 'D'];

    // Create a combined canvas with all 5 cards
    const cardW = 300, cardH = 380, gap = 20, s = 3;
    const totalW = cardW * 5 + gap * 4;
    const totalH = cardH;
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = totalW * s;
    combinedCanvas.height = (totalH + 60) * s; // extra space for header
    const ctx = combinedCanvas.getContext('2d')!;
    ctx.scale(s, s);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, totalW, totalH + 60);

    // Title
    ctx.fillStyle = '#1a2b3c';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${student.name} — QR Cards (ID + Options A/B/C/D)`, totalW / 2, 30);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Roll: ${student.rollNo} | ID: ${student.student_unique_id || student.id}`, totalW / 2, 48);

    // Render each card
    for (let i = 0; i < types.length; i++) {
      const dataUrl = await renderCardToCanvas(types[i]);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const x = i * (cardW + gap);
          ctx.drawImage(img, x, 60, cardW, cardH);
          resolve();
        };
        img.src = dataUrl;
      });
    }

    const link = document.createElement('a');
    link.download = `${student.name.replace(/\s+/g, '-')}_All-QR-Cards.png`;
    link.href = combinedCanvas.toDataURL('image/png');
    link.click();
  }, [renderCardToCanvas, student]);

  const handlePrint = () => window.print();

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between print:hidden">
        <div>
          <h3 className="text-lg font-bold text-green-800">Student Cards Ready!</h3>
          <p className="text-sm text-green-600">ID card + 4 option QR cards for <strong>{student.name}</strong></p>
          <p className="text-xs text-green-700 mt-1">Generate unique QR code</p>
          <p className="text-xs font-mono text-green-800">Unique ID: {student.student_unique_id || student.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" /> Print All
          </Button>
          <Button size="sm" onClick={downloadAllCards} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" /> Download All Cards
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
        {/* ID Card */}
        <div className="flex flex-col items-center gap-2">
          <div id="qr-id-card" className="w-[240px] bg-white rounded-xl shadow-md border overflow-hidden print:w-[180px]">
            <div className="bg-teal-600 px-3 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <GraduationCap className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-xs">ITDA AI Classroom</span>
              </div>
              <p className="text-white/80 text-[10px]">Student Identity Card</p>
            </div>
            <div className="flex justify-center py-4">
              <div className="p-2 border rounded-lg">
                <QRCodeSVG value={idQRValue} size={120} level="M" />
              </div>
            </div>
            <div className="text-center px-3 pb-3">
              <h4 className="font-bold text-gray-800 text-sm">{student.name}</h4>
              <p className="text-gray-500 text-xs">Roll: {student.rollNo}{student.section ? ` | Sec: ${student.section}` : ''}</p>
              {student.className && <p className="text-gray-500 text-xs">{student.className}</p>}
              <div className="mt-2 bg-teal-50 rounded-md px-2 py-1">
                <code className="text-[10px] font-mono text-teal-700 font-bold">ID: {student.student_unique_id || student.id}</code>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => downloadSingleCard('id')} className="text-xs gap-1 print:hidden">
            <Download className="w-3 h-3" /> ID Card
          </Button>
        </div>

        {/* Option Cards A/B/C/D */}
        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
          <div key={opt} className="flex flex-col items-center gap-2">
            <div id={`qr-opt-${opt}`} className="w-[240px] bg-white rounded-xl shadow-md border overflow-hidden print:w-[180px]">
              <div className={`${OPTION_COLORS[opt].bg} px-3 py-2.5 text-center`}>
                <span className="text-white font-bold text-lg">Option {opt}</span>
              </div>
              <div className="flex justify-center py-4">
                <div className="p-2 border rounded-lg" style={{ borderColor: OPTION_COLORS[opt].hex + '40' }}>
                  <QRCodeSVG value={`${student.id}|${opt}`} size={120} level="M" />
                </div>
              </div>
              <div className="text-center px-3 pb-3">
                <h4 className="font-bold text-gray-800 text-sm">{student.name}</h4>
                <p className="text-gray-500 text-xs">Roll: {student.rollNo}{student.section ? ` | Sec: ${student.section}` : ''}</p>
                <div className="mt-2 rounded-md px-2 py-1" style={{ backgroundColor: OPTION_BG_HEX[opt] }}>
                  <code className="text-[10px] font-mono font-bold" style={{ color: OPTION_COLORS[opt].hex }}>{student.id}|{opt}</code>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => downloadSingleCard(opt)} className="text-xs gap-1 print:hidden">
              <Download className="w-3 h-3" /> Option {opt}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
