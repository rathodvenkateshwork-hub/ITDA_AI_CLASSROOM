import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, Search, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/AdminLayout';

const mockQuizzes = [
  {
    id: 1,
    title: 'Number Systems - Quiz 1',
    subject: 'Mathematics',
    chapter: 'Number Systems',
    createdBy: 'Rajesh Kumar',
    questions: 10,
    totalPoints: 20,
    submissions: 24,
    avgScore: 73.5,
    createdDate: '2024-03-01',
    status: 'Published'
  },
  {
    id: 2,
    title: 'Polynomials - Quiz 1',
    subject: 'Mathematics',
    chapter: 'Polynomials',
    createdBy: 'Rajesh Kumar',
    questions: 15,
    totalPoints: 30,
    submissions: 18,
    avgScore: 68.2,
    createdDate: '2024-03-02',
    status: 'Published'
  },
  {
    id: 3,
    title: 'Atoms and Molecules - Quiz 1',
    subject: 'Science',
    chapter: 'Atoms and Molecules',
    createdBy: 'Arun Singh',
    questions: 12,
    totalPoints: 25,
    submissions: 31,
    avgScore: 75.8,
    createdDate: '2024-03-03',
    status: 'Draft'
  },
];

export default function QuizManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [quizzes, setQuizzes] = useState(mockQuizzes);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    chapter: '',
    questions: 10,
    totalPoints: 20
  });

  const filteredQuizzes = quizzes.filter(quiz =>
    (quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     quiz.chapter.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'All' || quiz.status === filterStatus)
  );

  const handleAddQuiz = () => {
    if (formData.title && formData.chapter) {
      const newQuiz = {
        id: quizzes.length + 1,
        ...formData,
        createdBy: 'Admin',
        submissions: 0,
        avgScore: 0,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      setQuizzes([...quizzes, newQuiz]);
      setFormData({ title: '', subject: '', chapter: '', questions: 10, totalPoints: 20 });
      setIsAddingQuiz(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Management</h1>
        <p className="text-gray-600">Create, manage, and analyze quizzes for all chapters</p>
      </div>

      {/* Search, Filter and Add */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by quiz title or chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          <option value="All">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
        </select>
        <Dialog open={isAddingQuiz} onOpenChange={setIsAddingQuiz}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quiz Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Number Systems - Quiz 1"
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
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  value={formData.questions}
                  onChange={(e) => setFormData({...formData, questions: parseInt(e.target.value)})}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Total Points</Label>
                <Input
                  type="number"
                  value={formData.totalPoints}
                  onChange={(e) => setFormData({...formData, totalPoints: parseInt(e.target.value)})}
                  placeholder="20"
                />
              </div>
              <Button onClick={handleAddQuiz} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{quizzes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{quizzes.filter(q => q.status === 'Published').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{quizzes.reduce((sum, q) => sum + q.submissions, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {(quizzes.reduce((sum, q) => sum + q.avgScore, 0) / quizzes.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quizzes ({filteredQuizzes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Quiz Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.subject}</TableCell>
                    <TableCell className="text-sm">{quiz.chapter}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{quiz.questions}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{quiz.totalPoints}</TableCell>
                    <TableCell className="text-center font-semibold text-purple-600">{quiz.submissions}</TableCell>
                    <TableCell className="text-center font-semibold text-orange-600">{quiz.avgScore.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm">{quiz.createdBy}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        quiz.status === 'Published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {quiz.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 hover:bg-blue-100 rounded transition">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-purple-100 rounded transition">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
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
