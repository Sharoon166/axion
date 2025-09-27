import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useRouter } from 'next/navigation';
import Loading from '@/loading';
import Pagination from '@/components/Pagination';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface Project {
  _id: string;
  title: string;
  slug: string;
  category: string;
  style: string;
  overview: string;
  features: string[];
  images: string[];
  location: string;
  date: string;
  image: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter((project) => {
    return (
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDeleteProject = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.slug)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete project');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project');
      }

      fetchProjects(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error deleting project:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete project. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-gray-600">Create and manage your projects</p>
        </div>
        <Button
          className="bg-[#0077B6] hover:bg-[#0077B6]/90 w-full sm:w-auto"
          onClick={() => router.push('/projects/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Search and Results Info */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProjects.length === 0
                  ? 'No projects found'
                  : `Showing ${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredProjects.length)} of ${filteredProjects.length} projects`}
              </p>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Title</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Style</TableHead>
                        <TableHead className="min-w-[150px]">Location</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjects.map((project) => (
                        <TableRow key={project._id}>
                          <TableCell
                            className="font-medium max-w-[200px] truncate"
                            title={project.title}
                          >
                            {project.title}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={project.category}>
                            {project.category}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate" title={project.style}>
                            {project.style}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate" title={project.location}>
                            {project.location}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(project.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/projects/${project.slug}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => handleDeleteProject(project)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No projects found. Create your first project to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {paginatedProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No projects found. Create your first project to get started.
                  </div>
                ) : (
                  paginatedProjects.map((project) => (
                    <Card key={project._id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              <p className="text-sm text-gray-600">{project.category}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/projects/${project.slug}/edit`)}
                                className="flex-1 sm:flex-none"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProject(project)}
                                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Style:</span>
                              <span className="ml-2 text-gray-600">{project.style}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Date:</span>
                              <span className="ml-2 text-gray-600">
                                {new Date(project.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium text-gray-700">Location:</span>
                              <span className="ml-2 text-gray-600">{project.location}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination - Always show when not loading */}
          {!loading && (
            <div className="flex items-center justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManagement;
