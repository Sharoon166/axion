'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Project {
  _id: string;
  title: string;
  slug: string;
  category: string;
  style: string;
  overview?: string;
  features?: string[];
  specs?: {
    type?: string;
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
            const uniqueCategories = ['All', ...new Set(projectsData.map((p: Project) => p.category).filter(Boolean))];
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

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Our"
        titleHighlight="Projects"
        subtitle="Showcasing our finest lighting installations and creative solutions."
      />

      <div className="max-w-[85rem] mx-auto px-4 py-8">
        {/* Filters and Add Button */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeFilter === category ? 'default' : 'outline'}
                onClick={() => setActiveFilter(category)}
                className={cn(
                  'rounded-full',
                  activeFilter === category
                    ? 'bg-[var(--color-logo)] text-white hover:bg-[var(--color-logo)]/90'
                    : 'border-[var(--color-logo)] text-[var(--color-logo)] hover:bg-[var(--color-logo)] hover:text-white',
                )}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => router.push('/projects/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Project
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
              >
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block bg-[var(--color-logo)] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {project.category}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {project.style}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--color-logo)] mb-3 leading-tight">
                    {project.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{project.location}</span>
                    <span>{project.date}</span>
                  </div>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center text-[var(--color-logo)] font-medium hover:underline transition-colors"
                  >
                    View Project Details
                    <svg
                      className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto text-gray-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="text-gray-500">No projects found</h4>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add some projects</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
