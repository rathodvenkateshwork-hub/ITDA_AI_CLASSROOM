import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search, Mail, Phone, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { fetchAll, registerTeacher, type AllDataResponse } from '@/api/client';

interface Teacher {
  id: string;
  name: string;
  email: string;
  schoolId: string;
  classIds: string[];
  subjects: string[];
}

interface School {
  id: string;
  name: string;
  code: string;
}

export default function TeacherManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    school: '',
    subject: '',
    experience: ''
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    school: ''
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    school: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAll();
      setTeachers(data.teachers);
      setSchools(data.schools);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      school: ''
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.school) {
      errors.school = 'School selection is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleAddTeacher = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const full_name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      await registerTeacher({
        full_name,
        email: formData.email.trim(),
        school_id: formData.school,
        password: formData.password,
      });

      toast({
        title: "Success",
        description: "Teacher registered successfully!",
      });

      // Reset form and close dialog
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        school: '',
        subject: '',
        experience: ''
      });
      setFormErrors({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        school: ''
      });
      setIsAddingTeacher(false);

      // Reload data to show new teacher
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register teacher",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSchoolName = (schoolId: string): string => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : schoolId;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Teacher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({...formData, firstName: e.target.value});
                      setFormErrors({...formErrors, firstName: ''});
                    }}
                    placeholder="Enter first name"
                    className={formErrors.firstName ? 'border-red-500' : ''}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({...formData, lastName: e.target.value});
                      setFormErrors({...formErrors, lastName: ''});
                    }}
                    placeholder="Enter last name"
                    className={formErrors.lastName ? 'border-red-500' : ''}
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    setFormErrors({...formErrors, email: ''});
                  }}
                  placeholder="teacher@school.com"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    setFormErrors({...formErrors, password: ''});
                  }}
                  placeholder="Minimum 8 characters"
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
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
                <Label>School *</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) => {
                    setFormData({...formData, school: value});
                    setFormErrors({...formErrors, school: ''});
                  }}
                >
                  <SelectTrigger className={formErrors.school ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.school && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.school}</p>
                )}
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
              <Button 
                onClick={handleAddTeacher} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Teacher'
                )}
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
                        <span className="text-sm">-</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getSchoolName(teacher.schoolId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subject, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {subject}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600">
                      {teacher.classIds ? teacher.classIds.length : 0}
                    </TableCell>
                    <TableCell className="text-center font-semibold">-</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="p-2 hover:bg-blue-100 rounded transition"
                          aria-label="View teacher details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-2 hover:bg-yellow-100 rounded transition"
                          aria-label="Edit teacher"
                        >
                          <Edit className="w-4 h-4 text-yellow-600" />
                        </button>
                        <button 
                          className="p-2 hover:bg-red-100 rounded transition"
                          aria-label="Delete teacher"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No teachers found. Click "Register Teacher" to add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
