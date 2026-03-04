import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const mockSchools = [
  {
    id: 1,
    name: 'Government High School, Hyderabad',
    code: 'GHS-HYD-001',
    district: 'Hyderabad',
    mandal: 'Charminar',
    classes: 4,
    teachers: 8,
    students: 181,
    sessions: 45,
    status: 'Active'
  },
  {
    id: 2,
    name: 'Modern Public School',
    code: 'MPS-HYD-002',
    district: 'Hyderabad',
    mandal: 'Kukatpally',
    classes: 2,
    teachers: 6,
    students: 102,
    sessions: 32,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Central Academy',
    code: 'CA-HYD-003',
    district: 'Hyderabad',
    mandal: 'Secunderabad',
    classes: 2,
    teachers: 10,
    students: 102,
    sessions: 28,
    status: 'Active'
  }
];

export default function SchoolManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState(mockSchools);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: '',
    mandal: ''
  });

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSchool = () => {
    if (formData.name && formData.code) {
      const newSchool = {
        id: schools.length + 1,
        ...formData,
        classes: 0,
        teachers: 0,
        students: 0,
        sessions: 0,
        status: 'Active'
      };
      setSchools([...schools, newSchool]);
      setFormData({ name: '', code: '', district: '', mandal: '' });
      setIsAddingSchool(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">School Management</h1>
        <p className="text-gray-600">View, add, and manage school institutions</p>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by school name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddingSchool} onOpenChange={setIsAddingSchool}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>School Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <Label>School Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., GHS-HYD-001"
                />
              </div>
              <div>
                <Label>District</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  placeholder="Enter district"
                />
              </div>
              <div>
                <Label>Mandal</Label>
                <Input
                  value={formData.mandal}
                  onChange={(e) => setFormData({...formData, mandal: e.target.value})}
                  placeholder="Enter mandal"
                />
              </div>
              <Button onClick={handleAddSchool} className="w-full bg-blue-600 hover:bg-blue-700">
                Add School
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools ({filteredSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>School Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Teachers</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{school.code}</TableCell>
                    <TableCell>{school.district}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{school.classes}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{school.teachers}</TableCell>
                    <TableCell className="text-center font-semibold text-purple-600">{school.students}</TableCell>
                    <TableCell className="text-center font-semibold text-orange-600">{school.sessions}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        school.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {school.status}
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

      {/* School Details View */}
      {selectedSchool && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>{selectedSchool.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Code</p>
                  <p className="text-lg font-semibold">{selectedSchool.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">District</p>
                  <p className="text-lg font-semibold">{selectedSchool.district}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mandal</p>
                  <p className="text-lg font-semibold">{selectedSchool.mandal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-green-600">{selectedSchool.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
