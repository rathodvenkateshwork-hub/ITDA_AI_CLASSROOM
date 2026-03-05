import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiBase } from '@/api/client';
import {
  Download,
  Search,
  FileText,
  Video,
  PresentationIcon,
  BookOpen,
  Link2,
  Star,
  CheckCircle,
  Clock,
  Eye,
  ArrowRight,
  BookMarked,
  Share2,
  MessageSquare,
  Zap,
  Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const StudentMaterials = () => {
  const [studentId] = React.useState(localStorage.getItem('student_id') || '1');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('assigned');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studentProgress, setStudentProgress] = useState({});
  const [ratings, setRatings] = useState({});
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [ratingForm, setRatingForm] = useState({ material_id: '', rating: 0, feedback: '' });

  const API = getApiBase();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch materials for student's class
        const matsRes = await fetch(`${API}/api/materials/student/${studentId}/materials`);
        const matsData = await matsRes.json();
        setMaterials(matsData || []);

        // Fetch progress for each material
        if (matsData && matsData.length > 0) {
          const progressMap = {};
          for (const mat of matsData) {
            try {
              const progRes = await fetch(`${API}/api/materials/${mat.id}/student-progress?student_id=${studentId}`);
              const progData = await progRes.json();
              progressMap[mat.id] = progData;
            } catch (err) {
              console.error(`Failed to fetch progress for material ${mat.id}:`, err);
            }
          }
          setStudentProgress(progressMap);
        }
      } catch (err) {
        console.error('Failed to fetch materials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const handleViewMaterial = async (material) => {
    setSelectedMaterial(material);
    
    // Record material access
    try {
      await fetch(`${API}/api/materials/${material.id}/student-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parseInt(studentId),
          duration_viewed: 0,
        }),
      });
    } catch (err) {
      console.error('Failed to record material access:', err);
    }
    
    setShowDetailDialog(true);
  };

  const handleRateMaterial = async (e) => {
    e.preventDefault();
    if (!ratingForm.material_id || !ratingForm.rating) {
      alert('Please select a rating');
      return;
    }

    try {
      await fetch(`${API}/api/materials/${ratingForm.material_id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parseInt(studentId),
          rating: ratingForm.rating,
          feedback: ratingForm.feedback,
        }),
      });

      setRatings({
        ...ratings,
        [ratingForm.material_id]: ratingForm.rating,
      });

      setRatingForm({ material_id: '', rating: 0, feedback: '' });
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Failed to save rating:', err);
      alert('Failed to save rating');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'textbook':
        return <BookOpen className="w-5 h-5" />;
      case 'ppt':
        return <PresentationIcon className="w-5 h-5" />;
      case 'pdf':
      case 'worksheet':
        return <FileText className="w-5 h-5" />;
      case 'video':
      case 'youtube':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      textbook: 'from-purple-500 to-purple-600',
      ppt: 'from-orange-500 to-orange-600',
      pdf: 'from-blue-500 to-blue-600',
      video: 'from-red-500 to-red-600',
      worksheet: 'from-green-500 to-green-600',
      youtube: 'from-red-500 to-red-600',
      ref_link: 'from-cyan-500 to-cyan-600',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getMaterialTypeLabel = (type) => {
    const labels = {
      textbook: 'Textbook',
      ppt: 'Presentation',
      pdf: 'PDF Document',
      video: 'Video Lecture',
      worksheet: 'Worksheet',
      youtube: 'YouTube Video',
      ref_link: 'Reference Link',
    };
    return labels[type] || 'Material';
  };

  const filteredMaterials = materials.filter(material =>
    material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate materials by progress
  const completedMaterials = filteredMaterials.filter(m =>
    studentProgress[m.id]?.completed
  );
  const inProgressMaterials = filteredMaterials.filter(m =>
    studentProgress[m.id] && !studentProgress[m.id].completed && studentProgress[m.id].completion_percentage > 0
  );
  const notStartedMaterials = filteredMaterials.filter(m =>
    !studentProgress[m.id] || (studentProgress[m.id].completion_percentage === 0 && !studentProgress[m.id].completed)
  );

  if (loading && materials.length === 0) {
    return <div className="p-8 text-center">Loading your materials...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 My Learning Materials</h1>
        <p className="text-gray-600">Access all course materials, textbooks, and learning resources assigned to you</p>
      </div>

      {/* Stats */}
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
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedMaterials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{inProgressMaterials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{notStartedMaterials.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search materials by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto">
        {[
          { id: 'all', label: 'All Materials', count: filteredMaterials.length },
          { id: 'not-started', label: 'Not Started', count: notStartedMaterials.length },
          { id: 'in-progress', label: 'In Progress', count: inProgressMaterials.length },
          { id: 'completed', label: 'Completed', count: completedMaterials.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
              selectedTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} <span className="ml-1 text-sm font-semibold">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Materials Display */}
      {(() => {
        let displayMaterials = filteredMaterials;
        
        if (selectedTab === 'not-started') displayMaterials = notStartedMaterials;
        else if (selectedTab === 'in-progress') displayMaterials = inProgressMaterials;
        else if (selectedTab === 'completed') displayMaterials = completedMaterials;

        return displayMaterials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No materials found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMaterials.map((material) => {
              const progress = studentProgress[material.id] || {};
              const isCompleted = progress.completed;
              const completionPercentage = progress.completion_percentage || 0;
              const userRating = ratings[material.id] || 0;

              return (
                <Card
                  key={material.id}
                  className="hover:shadow-xl transition transform hover:scale-105 overflow-hidden"
                >
                  {/* Header with type badge */}
                  <div className={`h-32 bg-gradient-to-br ${getTypeColor(material.material_type)} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="currentColor" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white opacity-80">
                        {getTypeIcon(material.material_type)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isCompleted ? (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Done
                        </div>
                      ) : completionPercentage > 0 ? (
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {completionPercentage}%
                        </div>
                      ) : (
                        <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          New
                        </div>
                      )}
                    </div>
                  </div>

                  <CardHeader>
                    <h3 className="font-bold text-lg line-clamp-2">{material.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{getMaterialTypeLabel(material.material_type)}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">{material.description}</p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2">
                      {material.difficulty_level && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                          {material.difficulty_level}
                        </span>
                      )}
                      {material.grade_level && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Grade {material.grade_level}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {completionPercentage > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all duration-300"
                          style={{width: `${completionPercentage}%`}}
                        />
                      </div>
                    )}

                    {/* Rating */}
                    {userRating > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">Your rating:</span>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Dialog open={showDetailDialog && selectedMaterial?.id === material.id} onOpenChange={setShowDetailDialog}>
                        <DialogTrigger asChild>
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleViewMaterial(material)}
                          >
                            {material.material_type === 'video' || material.material_type === 'youtube' ? (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Play
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                View
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{material.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Material Viewer */}
                            <div className="bg-gray-900 rounded-lg overflow-hidden min-h-96 flex items-center justify-center text-white">
                              <div className="text-center">
                                {material.material_type === 'video' || material.material_type === 'youtube' ? (
                                  <>
                                    <Play className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-lg mb-4">Video Player</p>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => window.open(material.youtube_link || material.file_url, '_blank')}
                                    >
                                      Open Video
                                    </Button>
                                  </>
                                ) : material.material_type === 'pdf' ? (
                                  <>
                                    <FileText className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-lg mb-4">PDF Document</p>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => window.open(material.file_url, '_blank')}
                                    >
                                      Open PDF
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-lg mb-4">Material Preview</p>
                                    <Button
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => window.open(material.file_url, '_blank')}
                                    >
                                      Open Material
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-semibold">{getMaterialTypeLabel(material.material_type)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Difficulty</p>
                                <p className="font-semibold capitalize">{material.difficulty_level}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <p className="font-semibold capitalize">{material.category?.replace(/_/g, ' ')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Views</p>
                                <p className="font-semibold">{material.view_count || 0}</p>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Description</p>
                              <p className="text-gray-700">{material.description}</p>
                            </div>

                            {/* Rating Form */}
                            <div className="border-t pt-4">
                              <p className="font-semibold mb-3">Rate this material</p>
                              <form onSubmit={handleRateMaterial} className="space-y-3">
                                <input type="hidden" value={material.id} onChange={(e) => setRatingForm({...ratingForm, material_id: material.id})} />
                                <div className="flex gap-2">
                                  {[1,2,3,4,5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRatingForm({...ratingForm, material_id: material.id.toString(), rating: star})}
                                      className="transition"
                                    >
                                      <Star
                                        className={`w-6 h-6 ${ratingForm.material_id === material.id.toString() && ratingForm.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Share your feedback..."
                                  value={ratingForm.material_id === material.id.toString() ? ratingForm.feedback : ''}
                                  onChange={(e) => setRatingForm({...ratingForm, feedback: e.target.value})}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                />
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                  Submit Rating
                                </Button>
                              </form>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm" title="Save for later">
                        <BookMarked className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default StudentMaterials;
