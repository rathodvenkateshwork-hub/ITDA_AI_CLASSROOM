import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  FileText,
  Video,
  PresentationIcon,
  BookOpen,
  Link2,
  Eye,
  UploadCloud,
  X,
  Settings,
  LayoutGrid,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getApiBase } from '@/api/client';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showYoutubeMaterialDialog, setShowYouTubeDialog] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'processing'; message: string } | null>(null);

  const API = getApiBase();

  // Form states
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject_id: '',
    chapter_id: '',
    topic_id: '',
    material_type: 'pdf',
    category: 'teaching_resource',
    description: '',
    grade_level: '',
    difficulty_level: 'intermediate',
    file_name: '',
    file_url: '',
    youtube_link: '',
    external_link: '',
    is_published: false,
  });

  const [textbookMapping, setTextbookMapping] = useState({
    textbook_name: 'TGSCERT',
    textbook_version: '',
    chapter_name: '',
    page_numbers: '',
    tgscert_reference: '',
  });

  // Material types and categories
  const materialTypes = [
    { value: 'textbook', label: 'Textbook Chapter', icon: BookOpen },
    { value: 'ppt', label: 'PowerPoint Presentation', icon: PresentationIcon },
    { value: 'pdf', label: 'PDF Document', icon: FileText },
    { value: 'video', label: 'Video Lecture', icon: Video },
    { value: 'worksheet', label: 'Worksheet', icon: FileText },
    { value: 'example', label: 'Worked Example', icon: FileText },
    { value: 'youtube', label: 'YouTube Link', icon: Video },
    { value: 'ref_link', label: 'Reference Link', icon: Link2 },
  ];

  const categories =  [
    { value: 'textbook_chapter', label: 'Textbook Chapter' },
    { value: 'teaching_resource', label: 'Teaching Resource' },
    { value: 'study_guide', label: 'Study Guide' },
    { value: 'sample_problem', label: 'Sample Problem' },
    { value: 'assessment', label: 'Assessment/Worksheet' },
    { value: 'reference', label: 'Reference Material' },
  ];

  const difficultyLevels = ['basic', 'intermediate', 'advanced'];
  
  // Fetch data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch materials
        const matsRes = await fetch(`${API}/api/materials`);
        const matsData = await matsRes.json();
        setMaterials(matsData || []);

        // Fetch subjects
        const subjRes = await fetch(`${API}/api/admin/subjects`);
        const subjData = await subjRes.json();
        setSubjects(subjData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch chapters when subject changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (materialForm.subject_id) {
        try {
          const res = await fetch(`${API}/api/admin/chapters?subject_id=${materialForm.subject_id}`);
          const data = await res.json();
          setChapters(data || []);
        } catch (err) {
          console.error('Failed to fetch chapters:', err);
        }
      } else {
        setChapters([]);
      }
    };
    fetchChapters();
  }, [materialForm.subject_id]);

  // Fetch topics when chapter changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (materialForm.chapter_id) {
        try {
          const res = await fetch(`${API}/api/admin/topics?chapter_id=${materialForm.chapter_id}`);
          const data = await res.json();
          setTopics(data || []);
        } catch (err) {
          console.error('Failed to fetch topics:', err);
        }
      } else {
        setTopics([]);
      }
    };
    fetchTopics();
  }, [materialForm.chapter_id]);

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...materialForm,
        subject_id: parseInt(materialForm.subject_id),
        chapter_id: materialForm.chapter_id ? parseInt(materialForm.chapter_id) : null,
        topic_id: materialForm.topic_id ? parseInt(materialForm.topic_id) : null,
        grade_level: materialForm.grade_level ? parseInt(materialForm.grade_level) : null,
      };

      setUploadStatus({ type: 'processing', message: 'Uploading material & running AI pipeline...' });

      const response = await fetch(`${API}/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create material');

      const newMaterial = await response.json();
      setMaterials([...materials, newMaterial]);

      const chunksCreated = newMaterial.chunks_created || 0;
      setUploadStatus({
        type: 'success',
        message: `Material uploaded successfully! ${chunksCreated > 0 ? `${chunksCreated} chunks created & embedded for AI.` : 'Add a description with content to enable AI features.'}`,
      });
      setTimeout(() => setUploadStatus(null), 8000);

      // Reset form
      setMaterialForm({
        title: '',
        subject_id: '',
        chapter_id: '',
        topic_id: '',
        material_type: 'pdf',
        category: 'teaching_resource',
        description: '',
        grade_level: '',
        difficulty_level: 'intermediate',
        file_name: '',
        file_url: '',
        youtube_link: '',
        external_link: '',
        is_published: false,
      });
      setShowUploadDialog(false);
    } catch (err) {
      console.error('Failed to upload material:', err);
      setUploadStatus({ type: 'error', message: 'Failed to upload material. Please try again.' });
      setTimeout(() => setUploadStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await fetch(`${API}/api/materials/${id}`, { method: 'DELETE' });
        setMaterials(materials.filter(m => m.id !== id));
      } catch (err) {
        console.error('Failed to delete material:', err);
        alert('Failed to delete material');
      }
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = materialTypes.find(t => t.value === type);
    const IconComponent = typeObj?.icon || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      textbook: 'bg-purple-100 text-purple-700',
      ppt: 'bg-orange-100 text-orange-700',
      pdf: 'bg-blue-100 text-blue-700',
      video: 'bg-red-100 text-red-700',
      worksheet: 'bg-green-100 text-green-700',
      example: 'bg-indigo-100 text-indigo-700',
      youtube: 'bg-red-100 text-red-700',
      ref_link: 'bg-cyan-100 text-cyan-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm ||
      material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'textbook') return matchesSearch && material.material_type === 'textbook';
    if (selectedTab === 'videos') return matchesSearch && (material.material_type === 'video' || material.material_type === 'youtube');
    if (selectedTab === 'presentations') return matchesSearch && material.material_type === 'ppt';
    if (selectedTab === 'worksheets') return matchesSearch && material.material_type === 'worksheet';

    return matchesSearch;
  });

  const stats = {
    total: materials.length,
    textbooks: materials.filter(m => m.material_type === 'textbook').length,
    videos: materials.filter(m => ['video', 'youtube'].includes(m.material_type)).length,
    presentations: materials.filter(m => m.material_type === 'ppt').length,
    worksheets: materials.filter(m => m.material_type === 'worksheet').length,
  };

  if (loading && materials.length === 0) {
    return <div className="p-8 text-center">Loading materials...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Materials Management</h1>
        <p className="text-gray-600">Upload, organize, and manage learning materials including textbooks, videos, PPTs, and resources</p>
      </div>

      {/* Upload Status Banner */}
      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          uploadStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          uploadStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {uploadStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
          {uploadStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {uploadStatus.type === 'processing' && <Loader2 className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />}
          <p className="text-sm font-medium">{uploadStatus.message}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Textbooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.textbooks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.videos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Presentations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.presentations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Worksheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.worksheets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search materials by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Learning Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    required
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    placeholder="Material title"
                  />
                </div>
                <div>
                  <Label>Material Type *</Label>
                  <select
                    required
                    value={materialForm.material_type}
                    onChange={(e) => setMaterialForm({...materialForm, material_type: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {materialTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject, Chapter, Topic */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <select
                    required
                    value={materialForm.subject_id}
                    onChange={(e) => setMaterialForm({...materialForm, subject_id: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Chapter</Label>
                  <select
                    value={materialForm.chapter_id}
                    onChange={(e) => setMaterialForm({...materialForm, chapter_id: e.target.value, topic_id: ''})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name || ch.chapter_name || `Chapter ${ch.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Topic</Label>
                  <select
                    value={materialForm.topic_id}
                    onChange={(e) => setMaterialForm({...materialForm, topic_id: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Topic</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.topic_name || `Topic ${t.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category and Level */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category *</Label>
                  <select
                    required
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Grade Level</Label>
                  <select
                    value={materialForm.grade_level}
                    onChange={(e) => setMaterialForm({...materialForm, grade_level: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Grade</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Difficulty Level</Label>
                  <select
                    value={materialForm.difficulty_level}
                    onChange={(e) => setMaterialForm({...materialForm, difficulty_level: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {difficultyLevels.map(level => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Links */}
              <div>
                <Label>Description</Label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                  placeholder="Describe the material content..."
                  className="w-full border rounded px-3 py-2 min-h-24"
                />
              </div>

              {['pdf', 'ppt', 'video'].includes(materialForm.material_type) && (
                <>
                  <div>
                    <Label>File Name</Label>
                    <Input
                      value={materialForm.file_name}
                    onChange={(e) => setMaterialForm({...materialForm, file_name: e.target.value})}
                      placeholder="e.g., chapter_1_textbook.pdf"
                    />
                  </div>
                  <div>
                    <Label>File URL / Upload Link</Label>
                    <Input
                      value={materialForm.file_url}
                      onChange={(e) => setMaterialForm({...materialForm, file_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {materialForm.material_type === 'youtube' && (
                <div>
                  <Label>YouTube Link</Label>
                  <Input
                    value={materialForm.youtube_link}
                    onChange={(e) => setMaterialForm({...materialForm, youtube_link: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {materialForm.material_type === 'ref_link' && (
                <div>
                  <Label>External Link</Label>
                  <Input
                    value={materialForm.external_link}
                    onChange={(e) => setMaterialForm({...materialForm, external_link: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Textbook Mapping (if uploading textbook chapter) */}
              {materialForm.material_type === 'textbook' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">TGSCERT Textbook Mapping</h3>
                  <div className="space-y-2">
                    <Input
                      value={textbookMapping.textbook_version}
                      onChange={(e) => setTextbookMapping({...textbookMapping, textbook_version: e.target.value})}
                      placeholder="e.g., Class 10, 2024 Edition"
                    />
                    <Input
                      value={textbookMapping.chapter_name}
                      onChange={(e) => setTextbookMapping({...textbookMapping, chapter_name: e.target.value})}
                      placeholder="Chapter name from textbook"
                    />
                    <Input
                      value={textbookMapping.page_numbers}
                      onChange={(e) => setTextbookMapping({...textbookMapping, page_numbers: e.target.value})}
                      placeholder="Page numbers (e.g., 45-67)"
                    />
                    <Input
                      value={textbookMapping.tgscert_reference}
                      onChange={(e) => setTextbookMapping({...textbookMapping, tgscert_reference: e.target.value})}
                      placeholder="TGSCERT reference code"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Upload Material
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {[
          { id: 'all', label: 'All Materials' },
          { id: 'textbook', label: 'Textbooks' },
          { id: 'videos', label: 'Videos' },
          { id: 'presentations', label: 'Presentations' },
          { id: 'worksheets', label: 'Worksheets' },
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

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials ({filteredMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No materials found. Start by uploading your first material!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Difficulty</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getTypeColor(material.material_type)}`}>
                          {getTypeIcon(material.material_type)}
                          {materialTypes.find(t => t.value === material.material_type)?.label.split(' ')[0]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{material.category?.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-sm">{material.grade_level ? `Grade ${material.grade_level}` : '-'}</TableCell>
                      <TableCell className="text-sm capitalize">{material.difficulty_level}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button className="p-2 hover:bg-blue-100 rounded transition" title="View">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-yellow-100 rounded transition" title="Edit">
                            <Edit className="w-4 h-4 text-yellow-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-2 hover:bg-red-100 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsManagement;
