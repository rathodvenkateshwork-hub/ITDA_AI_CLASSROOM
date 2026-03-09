import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm, RegisteredStudentData } from "./RegistrationForms";
import StudentCardSet from "@/components/StudentCardSet";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/DataContext";

const StudentRegistration: React.FC = () => {
  const [registeredStudent, setRegisteredStudent] = useState<RegisteredStudentData | null>(null);
  const { data, refetch } = useAppData();
  const schools = data.schools ?? [];
  const classes = data.classes ?? [];

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
            <StudentForm
              schools={schools.map((s) => ({ id: s.id, name: s.name }))}
              classes={classes.map((c) => ({ id: c.id, name: c.name, schoolId: c.schoolId, grade: c.grade }))}
              onRegistered={(studentData) => {
                setRegisteredStudent(studentData);
                refetch();
              }}
            />
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
