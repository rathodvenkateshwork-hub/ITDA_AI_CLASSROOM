import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { studentBulkUpload } from "@/api/client";
import { useNavigate } from "react-router-dom";

interface BulkResult {
  success: boolean;
  id?: string;
  student_unique_id?: string;
  error?: string;
  data?: any;
}

const StudentBulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const parseCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const cols = line.split(",");
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ? cols[i].trim() : "";
      });
      // convert numeric fields
      if (obj.roll_no !== undefined) obj.roll_no = Number(obj.roll_no);
      return obj;
    });
    return data;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResults(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    try {
      const parsed = await parseCsv(f);
      setRows(parsed);
    } catch (err) {
      setError("Failed to parse CSV");
    }
  };

  const handleUpload = async () => {
    if (!rows.length) {
      setError("No data to upload");
      return;
    }
    setError(null);
    try {
      const r = await studentBulkUpload(rows);
      setResults(r.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const successCount = results ? results.filter((r) => r.success).length : 0;
  const failureCount = results ? results.filter((r) => !r.success).length : 0;

  return (
    <DashboardLayout title="Bulk Upload Students">
      <div className="space-y-4">
        <p className="text-sm">
          Upload a CSV file with headers: <code>full_name,roll_no,section,school_id,class_id,password</code> (password optional).
        </p>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        {rows.length > 0 && (
          <p className="text-sm">Parsed {rows.length} rows. Ready to upload.</p>
        )}
        <Button disabled={rows.length === 0} onClick={handleUpload}>
          Upload
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {results && (
          <div className="mt-4">
            <p className="text-sm">Success: {successCount}</p>
            <p className="text-sm">Failed: {failureCount}</p>
            {failureCount > 0 && (
              <ul className="list-disc list-inside text-xs text-destructive">
                {results
                  .filter((r) => !r.success)
                  .map((r, idx) => (
                    <li key={idx}>{r.error || JSON.stringify(r.data)}</li>
                  ))}
              </ul>
            )}
          </div>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default StudentBulkUpload;
