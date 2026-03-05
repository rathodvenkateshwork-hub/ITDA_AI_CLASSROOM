import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Download,
  Search,
  FileText,
  Video,
  PresentationIcon,
  BookOpen,
  Link2,
  Eye,
  ArrowRight,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Clock,
  Eye as EyeIcon,
  MoreHorizontal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TeacherMaterials = () => {
  const [teacherId] = React.useState(localStorage.getItem('teacher_id') || '1');
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('browse');
  const [myClasses, setMyClasses] = useState([]);
  
  const [assignmentForm, setAssignmentForm] = useState({
    material_id: '',
    class_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    optional: false,
    assignment_notes: '',
  });

  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all available materials
        const matsRes = await fetch('/api/materials?is_published=true');
        const matsData = await matsRes.json();
        setMaterials(matsData || []);

        // Fetch teacher's classes and assignments
        const assignRes = await fetch(`/api/materials/teacher/${teacherId}/assignments`);
        const assignData = await assignRes.json();
        setAssignments(assignData || []);

        // In a real app, fetch teacher's actual classes
        setMyClasses([
          { id: 1, name: 'Class 10-A', subject: 'Mathematics', section: 'A' },
          { id: 2, name: 'Class 10-B', subject: 'Mathematics', section: 'B' },
        ]);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacherId]);

  const handleAssignMaterial = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        teacher_id: parseInt(teacherId),
        material_id: parseInt(assignmentForm.material_id),
        class_id: parseInt(assignmentForm.class_id),
        assigned_date: assignmentForm.assigned_date,
        due_date: assignmentForm.due_date || null,
        optional: assignmentForm.optional,
        assignment_notes: assignmentForm.assignment_notes || null,
      };

      const response = await fetch('/api/materials/assign/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to assign material');

      // Refresh assignments
      const assignRes = await fetch(`/api/materials/teacher/${teacherId}/assignments`);
      const assignData = await assignRes.json();
      setAssignments(assignData || []);

      // Reset form
      setAssignmentForm({
        material_id: '',
        class_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
        optional: false,
        assignment_notes: '',
      });
      setShowAssignDialog(false);
    } catch (err) {
      console.error('Failed to assign material:', err);
      alert('Failed to assign material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'textbook':
        return <BookOpen className="w-4 h-4" />;
      case 'ppt':
        return <PresentationIcon className="w-4 h-4" />;
      case 'pdf':
      case 'worksheet':
        return <FileText className="w-4 h-4" />;
      case 'video':
      case 'youtube':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      textbook: 'bg-purple-100 text-purple-700',
      ppt: 'bg-orange-100 text-orange-700',
      pdf: 'bg-blue-100 text-blue-700',
      video: 'bg-red-100 text-red-700',
      worksheet: 'bg-green-100 text-green-700',
      youtube: 'bg-red-100 text-red-700',
      ref_link: 'bg-cyan-100 text-cyan-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getMaterialTypeLabel = (type) => {
    const labels = {
      textbook: 'Textbook',
      ppt: 'Presentation',
      pdf: 'PDF',
      video: 'Video',
      worksheet: 'Worksheet',
      youtube: 'YouTube',
      ref_link: 'Reference',
    };
    return labels[type] || 'Material';
  };

  const filteredMaterials = materials.filter(material =>
    material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate assignments by status
  const upcomingAssignments = assignments.filter(a => 
    new Date(a.due_date || a.assigned_date) >= new Date()
  );
  const pastAssignments = assignments.filter(a =>
    new Date(a.due_date || a.assigned_date) < new Date()
  );

  if (loading && materials.length === 0) {
    return <div className="p-8 text-center">Loading materials...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 My Learning Materials</h1>
        <p className="text-gray-600">Browse, assign, and manage learning resources for your classes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{filteredMaterials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{upcomingAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{myClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Materials Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {[
          { id: 'browse', label: 'Browse Materials' },
          { id: 'assigned', label: `My Assignments (${assignments.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              selectedTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Materials Tab */}
      {selectedTab === 'browse' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Assign Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Material to Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssignMaterial} className="space-y-4">
                  <div>
                    <Label>Select Material *</Label>
                    <select
                      required
                      value={assignmentForm.material_id}
                      onChange={(e) => setAssignmentForm({...assignmentForm, material_id: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Choose a material...</option>
                      {filteredMaterials.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Select Class *</Label>
                    <select
                      required
                      value={assignmentForm.class_id}
                      onChange={(e) => setAssignmentForm({...assignmentForm, class_id: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Choose a class...</option>
                      {myClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.section})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Assigned Date *</Label>
                      <Input
                        type="date"
                        required
                        value={assignmentForm.assigned_date}
                        onChange={(e) => setAssignmentForm({...assignmentForm, assigned_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={assignmentForm.due_date}
                        onChange={(e) => setAssignmentForm({...assignmentForm, due_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Assignment Notes</Label>
                    <textarea
                      value={assignmentForm.assignment_notes}
                      onChange={(e) => setAssignmentForm({...assignmentForm, assignment_notes: e.target.value})}
                      placeholder="Any instructions for students..."
                      className="w-full border rounded px-3 py-2 min-h-20"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assignmentForm.optional}
                      onChange={(e) => setAssignmentForm({...assignmentForm, optional: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Optional for students</span>
                  </label>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      Assign
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAssignDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Materials Grid */}
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No materials found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2">{material.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{material.category?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getTypeColor(material.material_type)}`}>
                        {getTypeIcon(material.material_type)}
                        {getMaterialTypeLabel(material.material_type)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{material.description}</p>
                    
                    {/* Meta Information */}
                    <div className="flex flex-wrap gap-2">
                      {material.grade_level && (
                        <span className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-2 py-1 rounded">
                          Grade {material.grade_level}
                        </span>
                      )}
                      <span className="text-xs bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 px-2 py-1 rounded capitalize">
                        {material.difficulty_level}
                      </span>
                      {material.view_count && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {material.view_count}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          // In a real app, open material viewer
                          window.open(material.file_url, '_blank');
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Set and open assign dialog
                          setAssignmentForm({...assignmentForm, material_id: material.id.toString()});
                          setShowAssignDialog(true);
                        }}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Assignments Tab */}
      {selectedTab === 'assigned' && (
        <div className="space-y-6">
          {/* Upcoming Assignments */}
          {upcomingAssignments.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Active Assignments
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {upcomingAssignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-lg transition">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{assignment.material?.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{assignment.material?.description}</p>
                          <div className="flex gap-4 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                            </span>
                            {assignment.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {assignment.optional && (
                              <span className="text-orange-600 font-medium">Optional</span>
                            )}
                          </div>
                          {assignment.assignment_notes && (
                            <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                              <strong>Notes:</strong> {assignment.assignment_notes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                            Unassign
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Assignments */}
          {pastAssignments.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Past Assignments
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {pastAssignments.map((assignment) => (
                  <Card key={assignment.id} className="opacity-75 hover:opacity-100 transition">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg line-through text-gray-600">{assignment.material?.title}</h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                            </span>
                            {assignment.due_date && (
                              <span>
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {assignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No material assignments yet. Start by assigning a material to your class!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;
