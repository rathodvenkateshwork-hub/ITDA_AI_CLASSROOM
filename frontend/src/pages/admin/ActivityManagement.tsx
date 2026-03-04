import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/AdminLayout';

const mockActivities = [
  {
    id: 1,
    name: 'Annual Science Fair 2024',
    category: 'academic',
    school: 'GHS-HYD-001',
    eventDate: '2024-04-15',
    registered: 24,
    maxParticipants: 50,
    status: 'Upcoming',
    description: 'Annual science fair with projects and demonstrations'
  },
  {
    id: 2,
    name: 'Inter-school Sports Day',
    category: 'sports',
    school: 'MPS-HYD-002',
    eventDate: '2024-04-20',
    registered: 35,
    maxParticipants: 100,
    status: 'Upcoming',
    description: 'Annual sports competition between schools'
  },
  {
    id: 3,
    name: 'Arts and Culture Fest',
    category: 'cultural',
    school: 'CA-HYD-003',
    eventDate: '2024-03-10',
    registered: 42,
    maxParticipants: 80,
    status: 'Completed',
    description: 'Cultural program with dance, music, and drama'
  },
];

const getCategoryColor = (category) => {
  switch (category) {
    case 'academic':
      return 'bg-blue-100 text-blue-700';
    case 'sports':
      return 'bg-green-100 text-green-700';
    case 'cultural':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Upcoming':
      return 'bg-yellow-100 text-yellow-700';
    case 'Ongoing':
      return 'bg-blue-100 text-blue-700';
    case 'Completed':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function ActivityManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState(mockActivities);
  const [filterCategory, setFilterCategory] = useState('All');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'academic',
    school: '',
    eventDate: '',
    maxParticipants: 50,
    description: ''
  });

  const filteredActivities = activities.filter(activity =>
    (activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     activity.school.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === 'All' || activity.category === filterCategory)
  );

  const handleAddActivity = () => {
    if (formData.name && formData.eventDate) {
      const newActivity = {
        id: activities.length + 1,
        ...formData,
        registered: 0,
        status: 'Upcoming'
      };
      setActivities([...activities, newActivity]);
      setFormData({
        name: '',
        category: 'academic',
        school: '',
        eventDate: '',
        maxParticipants: 50,
        description: ''
      });
      setIsAddingActivity(false);
    }
  };

  const occupancyPercentage = (registered, max) => {
    return Math.round((registered / max) * 100);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Management</h1>
        <p className="text-gray-600">Organize and manage academic, sports, and cultural activities</p>
      </div>

      {/* Search, Filter and Add */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search activities by name or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          <option value="All">All Categories</option>
          <option value="academic">Academic</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
        </select>
        <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Activity Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Annual Science Fair"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="academic">Academic</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                </select>
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
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                  placeholder="50"
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Activity description"
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <Button onClick={handleAddActivity} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Activity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Academic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activities.filter(a => a.category === 'academic').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activities.filter(a => a.category === 'sports').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activities.reduce((sum, a) => sum + a.registered, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead className="text-center">Registrations</TableHead>
                  <TableHead className="text-center">Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(activity.category)}`}>
                        {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{activity.school}</TableCell>
                    <TableCell className="text-sm">{activity.eventDate}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">{activity.registered}/{activity.maxParticipants}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${occupancyPercentage(activity.registered, activity.maxParticipants)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {occupancyPercentage(activity.registered, activity.maxParticipants)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                        {activity.status}
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
    </AdminLayout>
  );
}
