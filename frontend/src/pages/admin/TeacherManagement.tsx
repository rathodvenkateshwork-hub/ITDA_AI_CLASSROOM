import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const mockTeachers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@school.com',
    phone: '9876543210',
    school: 'GHS-HYD-001',
    subjects: ['Mathematics', 'Physics'],
    classes: 2,
    experience: 8,
    status: 'Active'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@school.com',
    phone: '9876543211',
    school: 'GHS-HYD-001',
    subjects: ['English', 'Hindi'],
    classes: 3,
    experience: 6,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Arun Singh',
    email: 'arun.singh@school.com',
    phone: '9876543212',
    school: 'MPS-HYD-002',
    subjects: ['Science', 'Chemistry'],
    classes: 2,
    experience: 10,
    status: 'Active'
  },
];

export default function TeacherManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState(mockTeachers);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    subject: '',
    experience: ''
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTeacher = () => {
    if (formData.name && formData.email) {
      const newTeacher = {
        id: teachers.length + 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        school: formData.school,
        subjects: [formData.subject],
        classes: 0,
        experience: parseInt(formData.experience) || 0,
        status: 'Active'
      };
      setTeachers([...teachers, newTeacher]);
      setFormData({ name: '', email: '', phone: '', school: '', subject: '', experience: '' });
      setIsAddingTeacher(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Teacher Management</h1>
        <p className="text-gray-600">Register, manage, and monitor teachers across schools</p>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by teacher name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddingTeacher} onOpenChange={setIsAddingTeacher}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Teacher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter teacher name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="teacher@school.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="10-digit phone number"
                />
              </div>
              <div>
                <Label>School</Label>
                <Input
                  value={formData.school}
                  onChange={(e) => setFormData({...formData, school: e.target.value})}
                  placeholder="Select school"
                />
              </div>
              <div>
                <Label>Primary Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label>Experience (years)</Label>
                <Input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleAddTeacher} className="w-full bg-blue-600 hover:bg-blue-700">
                Register Teacher
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Exp (yrs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium font-semibold">{teacher.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{teacher.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{teacher.school}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {teacher.subjects.map((subject, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{teacher.classes}</TableCell>
                    <TableCell className="text-center font-semibold">{teacher.experience}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {teacher.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 hover:bg-blue-100 rounded transition">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-yellow-100 rounded transition">
                          <Edit className="w-4 h-4 text-yellow-600" />
                        </button>
                        <button className="p-2 hover:bg-red-100 rounded transition">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
