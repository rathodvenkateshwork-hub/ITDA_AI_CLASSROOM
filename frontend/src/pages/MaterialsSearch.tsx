import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBase } from '@/api/client';
import {
  Search as SearchIcon,
  Filter,
  X,
  FileText,
  Video,
  PresentationIcon,
  BookOpen,
  Link2,
  Eye,
  Download,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

const MaterialsSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    material_type: [],
    category: [],
    grade_level: [],
    difficulty_level: [],
    subject_id: [],
  });

  const [allFilterOptions, setAllFilterOptions] = useState({
    types: [
      { value: 'textbook', label: 'Textbook' },
      { value: 'ppt', label: 'Presentation' },
      { value: 'pdf', label: 'PDF' },
      { value: 'video', label: 'Video' },
      { value: 'worksheet', label: 'Worksheet' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'ref_link', label: 'Reference Link' },
    ],
    categories: [
      { value: 'textbook_chapter', label: 'Textbook Chapter' },
      { value: 'teaching_resource', label: 'Teaching Resource' },
      { value: 'study_guide', label: 'Study Guide' },
      { value: 'sample_problem', label: 'Sample Problem' },
      { value: 'assessment', label: 'Assessment' },
      { value: 'reference', label: 'Reference' },
    ],
    grades: [
      { value: 1, label: 'Grade 1' },
      { value: 2, label: 'Grade 2' },
      { value: 3, label: 'Grade 3' },
      { value: 4, label: 'Grade 4' },
      { value: 5, label: 'Grade 5' },
      { value: 6, label: 'Grade 6' },
      { value: 7, label: 'Grade 7' },
      { value: 8, label: 'Grade 8' },
      { value: 9, label: 'Grade 9' },
      { value: 10, label: 'Grade 10' },
    ],
    difficulties: [
      { value: 'basic', label: 'Basic' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  });

  const [subjects, setSubjects] = useState([]);

  const API = getApiBase();

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch all materials
        const matsRes = await fetch(`${API}/api/materials`);
        const matsData = await matsRes.json();
        setMaterials(matsData || []);
        setFilteredMaterials(matsData || []);

        // Fetch subjects
        const subjRes = await fetch(`${API}/api/admin/subjects`);
        const subjData = await subjRes.json();
        setSubjects(subjData || []);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Perform search whenever search query or filters change
  useEffect(() => {
    performSearch();
  }, [searchQuery, filters]);

  const performSearch = () => {
    let results = [...materials];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(material =>
        material.title?.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.category?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filters.material_type.length > 0) {
      results = results.filter(m => filters.material_type.includes(m.material_type));
    }

    // Filter by category
    if (filters.category.length > 0) {
      results = results.filter(m => filters.category.includes(m.category));
    }

    // Filter by grade level
    if (filters.grade_level.length > 0) {
      results = results.filter(m =>
        m.grade_level && filters.grade_level.includes(m.grade_level)
      );
    }

    // Filter by difficulty
    if (filters.difficulty_level.length > 0) {
      results = results.filter(m => filters.difficulty_level.includes(m.difficulty_level));
    }

    // Filter by subject
    if (filters.subject_id.length > 0) {
      results = results.filter(m => filters.subject_id.includes(m.subject_id));
    }

    setFilteredMaterials(results);
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [filterType]: newValues,
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      material_type: [],
      category: [],
      grade_level: [],
      difficulty_level: [],
      subject_id: [],
    });
    setSearchQuery('');
  };

  const isFiltered = Object.values(filters).some(arr => arr.length > 0) || searchQuery.trim() !== '';
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

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

  const getTypeLabel = (type) => {
    const labels = {
      textbook: 'Textbook',
      ppt: 'PPT',
      pdf: 'PDF',
      video: 'Video',
      worksheet: 'Worksheet',
      youtube: 'YouTube',
      ref_link: 'Link',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🔍 Search Materials</h1>
        <p className="text-gray-600">Find and filter learning materials across the platform</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 ${showFilters ? 'bg-blue-100 border-blue-300' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {isFiltered && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Material Type Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Material Type
                    {filters.material_type.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {filters.material_type.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {allFilterOptions.types.map(type => (
                      <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.material_type.includes(type.value)}
                          onChange={() => toggleFilter('material_type', type.value)}
                          className="rounded"
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Category
                    {filters.category.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {filters.category.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {allFilterOptions.categories.map(cat => (
                      <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(cat.value)}
                          onChange={() => toggleFilter('category', cat.value)}
                          className="rounded"
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Grade Level Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Grade Level
                    {filters.grade_level.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {filters.grade_level.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {allFilterOptions.grades.map(grade => (
                      <label key={grade.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.grade_level.includes(grade.value)}
                          onChange={() => toggleFilter('grade_level', grade.value)}
                          className="rounded"
                        />
                        <span className="text-sm">{grade.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    Difficulty
                    {filters.difficulty_level.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {filters.difficulty_level.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {allFilterOptions.difficulties.map(diff => (
                      <label key={diff.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.difficulty_level.includes(diff.value)}
                          onChange={() => toggleFilter('difficulty_level', diff.value)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{diff.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading materials...</div>
          ) : filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                {isFiltered ? (
                  <>
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No materials found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No materials available</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Results Info */}
              <div className="text-sm text-gray-600">
                Found <span className="font-semibold text-gray-900">{filteredMaterials.length}</span> material{filteredMaterials.length !== 1 ? 's' : ''}
                {isFiltered && <span className="ml-2">(filtered)</span>}
              </div>

              {/* Results List */}
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${getTypeColor(material.material_type)}`}>
                        {getTypeIcon(material.material_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{material.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{material.description}</p>

                            {/* Meta Tags */}
                            <div className="flex flex-wrap gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(material.material_type)}`}>
                                {getTypeLabel(material.material_type)}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {material.category?.replace(/_/g, ' ')}
                              </span>
                              {material.grade_level && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  Grade {material.grade_level}
                                </span>
                              )}
                              {material.difficulty_level && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full capitalize">
                                  {material.difficulty_level}
                                </span>
                              )}
                              {material.view_count && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {material.view_count} views
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                if (material.file_url || material.youtube_link) {
                                  window.open(material.youtube_link || material.file_url, '_blank');
                                }
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsSearch;
