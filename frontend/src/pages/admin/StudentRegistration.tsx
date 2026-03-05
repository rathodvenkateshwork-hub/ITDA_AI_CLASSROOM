import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "./RegistrationForms";

const StudentRegistration: React.FC = () => {
  return (
    <DashboardLayout title="Student Registration">
      <Card>
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
        </CardHeader>
        <div className="p-4"> 
          <StudentForm />
          <p className="text-sm text-right mt-2">
            <a href="/admin/bulk/students" className="text-blue-600 hover:underline">Bulk upload students (CSV)</a>
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default StudentRegistration;
