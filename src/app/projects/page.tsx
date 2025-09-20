'use client';
import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/loading';
import ProjectCard from '@/components/ProjectCard';
import Pagination from '@/components/Pagination';
interface Project {
  _id: string;
  title: string;
  slug: string;
  category: string;
  style: string;
  overview?: string;
  features?: string[];
  technicalSpecs?: {
    projectType?: string;
    location?: string;
    completion?: string;
    duration?: string;
    team?: string;
  };
  testimonial?: {
    text?: string;
    author?: string;
  };
  location: string;
  date: string;
  image: string;
  images?: string[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { user } = useAuth();

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const projectsData = result.data || [];
            setProjects(projectsData);

            // Extract unique categories from projects
            const uniqueCategories = [
              'All',
              ...new Set(projectsData.map((p: Project) => p.category).filter(Boolean)),
            ];
            setCategories(uniqueCategories as string[]);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects =
    activeFilter === 'All'
      ? projects
      : projects.filter((p) => p.category === activeFilter || p.style === activeFilter);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Our"
        titleHighlight="Projects"
        subtitle="Showcasing our finest lighting installations and creative solutions."
      />

      <div className="max-w-[85rem] mx-auto px-8 sm:px-6 py-8">
        {/* Filters and Add Button */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeFilter === category ? 'default' : 'outline'}
                onClick={() => setActiveFilter(category)}
                className={cn(
                  'rounded-lg text-sm shadow-sm',
                  activeFilter === category
                    ? 'bg-[var(--color-logo)]  text-white hover:bg-[var(--color-logo)]/90'
                    : ' text-black hover:bg-[var(--color-logo)] hover:text-white',
                )}
              >
                {category}
              </Button>
            ))}
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => router.push('/projects/new')}
              className="bg-(--color-logo) hover:bg-(--color-logo)/90 text-white"
            >
              Add Project
            </Button>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <Loading />
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {currentItems.map((project) => (
              <ProjectCard
                key={project._id}
                href={`/projects/${project.slug}`}
                type={project.technicalSpecs?.projectType}
                image={project.images?.[0] || '/404-error-page.jpg'}
                title={project.title}
                category={project.category}
                style={project.style}
                location={project.location}
                date={project.date}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto text-gray-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h4 className="text-gray-500">No projects found</h4>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or add some projects
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-10">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredProjects.length / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
