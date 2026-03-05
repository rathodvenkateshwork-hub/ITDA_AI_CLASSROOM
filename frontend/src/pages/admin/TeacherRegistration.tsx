import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "./RegistrationForms";

const TeacherRegistration: React.FC = () => {
  return (
    <DashboardLayout title="Teacher Registration">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Registration</CardTitle>
        </CardHeader>
        <div className="p-4">
          <TeacherForm />
          <p className="text-sm text-right mt-2">
            <a href="/admin/bulk/teachers" className="text-blue-600 hover:underline">Bulk upload teachers (CSV)</a>
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherRegistration;
