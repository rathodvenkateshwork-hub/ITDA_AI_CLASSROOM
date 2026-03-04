import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Download, Search, FileText, Video, PresentationIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const mockMaterials = [
  {
    id: 1,
    title: 'Number Systems - Complete Guide',
    type: 'notes',
    chapter: 'Number Systems',
    subject: 'Mathematics',
    uploadedBy: 'Rajesh Kumar',
    uploadDate: '2024-03-01',
    size: '2.5 MB',
    downloads: 45
  },
  {
    id: 2,
    title: 'Polynomials - Interactive Presentation',
    type: 'ppt',
    chapter: 'Polynomials',
    subject: 'Mathematics',
    uploadedBy: 'Rajesh Kumar',
    uploadDate: '2024-03-02',
    size: '8.3 MB',
    downloads: 32
  },
  {
    id: 3,
    title: 'Atoms and Molecules - Video Lecture',
    type: 'video',
    chapter: 'Atoms and Molecules',
    subject: 'Science',
    uploadedBy: 'Arun Singh',
    uploadDate: '2024-03-03',
    size: '125 MB',
    downloads: 67
  },
];

const getTypeIcon = (type) => {
  switch (type) {
    case 'notes':
      return <FileText className="w-4 h-4" />;
    case 'ppt':
      return <PresentationIcon className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'notes':
      return 'bg-blue-100 text-blue-700';
    case 'ppt':
      return 'bg-orange-100 text-orange-700';
    case 'video':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function StudyMaterialsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState(mockMaterials);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'notes',
    chapter: '',
    subject: ''
  });

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMaterial = () => {
    if (formData.title && formData.chapter) {
      const newMaterial = {
        id: materials.length + 1,
        ...formData,
        uploadedBy: 'Admin',
        uploadDate: new Date().toISOString().split('T')[0],
        size: '0 MB',
        downloads: 0
      };
      setMaterials([...materials, newMaterial]);
      setFormData({ title: '', type: 'notes', chapter: '', subject: '' });
      setIsAddingMaterial(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Materials</h1>
        <p className="text-gray-600">Upload, manage, and organize study materials for all chapters and topics</p>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search materials by title, chapter, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Material title"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label>Chapter</Label>
                <Input
                  value={formData.chapter}
                  onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                  placeholder="Chapter name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="notes">Study Notes</option>
                  <option value="ppt">Presentation (PPT)</option>
                  <option value="video">Video Lecture</option>
                  <option value="image">Image/Diagram</option>
                </select>
              </div>
              <Button onClick={handleAddMaterial} className="w-full bg-blue-600 hover:bg-blue-700">
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{materials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Study Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{materials.filter(m => m.type === 'notes').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Presentations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{materials.filter(m => m.type === 'ppt').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{materials.filter(m => m.type === 'video').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Study Materials ({filteredMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-center">Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getTypeColor(material.type)}`}>
                        {getTypeIcon(material.type)}
                        {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{material.subject}</TableCell>
                    <TableCell className="text-sm">{material.chapter}</TableCell>
                    <TableCell>{material.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-gray-600">{material.uploadDate}</TableCell>
                    <TableCell className="text-sm text-gray-600">{material.size}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{material.downloads}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 hover:bg-blue-100 rounded transition">
                          <Download className="w-4 h-4 text-blue-600" />
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
