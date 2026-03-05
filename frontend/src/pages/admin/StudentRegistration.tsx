import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm, RegisteredStudentData } from "./RegistrationForms";
import StudentCardSet from "@/components/StudentCardSet";
import { Button } from "@/components/ui/button";

const StudentRegistration: React.FC = () => {
  const [registeredStudent, setRegisteredStudent] = useState<RegisteredStudentData | null>(null);

  return (
    <DashboardLayout title="Student Registration">
      {registeredStudent ? (
        <div className="space-y-4">
          <StudentCardSet
            student={{
              id: registeredStudent.id,
              student_unique_id: registeredStudent.student_unique_id,
              name: registeredStudent.name,
              rollNo: registeredStudent.rollNo,
              section: registeredStudent.section,
              className: registeredStudent.className,
              schoolName: registeredStudent.schoolName,
            }}
          />
          <div className="text-center print:hidden">
            <Button variant="outline" onClick={() => setRegisteredStudent(null)}>
              Register Another Student
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Registration</CardTitle>
          </CardHeader>
          <div className="p-4">
            <StudentForm onRegistered={(data) => setRegisteredStudent(data)} />
            <p className="text-sm text-right mt-2">
              <a href="/admin/bulk/students" className="text-blue-600 hover:underline">Bulk upload students (CSV)</a>
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default StudentRegistration;
