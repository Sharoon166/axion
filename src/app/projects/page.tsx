'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import AddButton from '@/components/AddButton';
import { createProject } from '@/app/actions/project/actions';

const projects = [
  {
    id: 1,
    slug: 'luxury-villa-lighting',
    category: 'Residential',
    style: 'Modern',
    title: 'Luxury Villa Lighting Project',
    overview:
      "This Luxury Villa project was designed to create an atmosphere of sophistication, comfort, and modern elegance. Our team at Axion Lighting combined premium fixtures with innovative design solutions to highlight the villa's unique architecture and interior spaces.",
    features: [
      'Customized chandelier installations for the main living space',
      'Ambient LED lighting for bedrooms to enhance relaxation',
      "Smart outdoor lighting for the villa's garden and pool area",
      'Energy-efficient solutions without compromising luxury aesthetics',
    ],
    specs: {
      type: 'Residential Luxury Villa',
      location: 'Islamabad, Pakistan',
      completion: 'July 2025',
      duration: '6 Months',
      team: '5 Lighting Designers, 3 Engineers',
    },
    testimonial: {
      text: 'Axion Lighting truly transformed our home into a masterpiece. The attention to detail and commitment to quality exceeded our expectations. Every corner feels luxurious, modern, and alive.',
      author: 'Mr. Ahmed Khan, Villa Owner',
    },
    images: [
      'https://images.unsplash.com/photo-1600585154154-59e4f4f7a3c2?w=800&q=80',
      'https://images.unsplash.com/photo-1616486886892-ff366943d45f?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800&q=80',
    ],
    location: 'Islamabad, Pakistan',
    date: 'July 2025',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  },
  {
    id: 2,
    slug: 'solar-pathway-hotel',
    category: 'Commercial',
    style: 'Outdoor',
    title: 'Solar Pathway for Boutique Hotel Courtyard',
    location: 'Lahore, Pakistan',
    date: 'June 2025',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
  },
  {
    id: 3,
    slug: 'dining-room-statement',
    category: 'Residential',
    style: 'Classic',
    title: 'Dining Room Statement with Other Hanging Ceiling Lights',
    location: 'Karachi, Pakistan',
    date: 'May 2025',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800&q=80',
  },
  {
    id: 4,
    slug: 'minimalist-living-room',
    category: 'Residential',
    style: 'Modern',
    title: 'Minimalist Living Room with Recessed Lighting',
    location: 'Lahore, Pakistan',
    date: 'April 2025',
    image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80',
  },
];

const categories = ['All', 'Residential', 'Commercial'];

const ProjectsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

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
          <AddButton
            type="project"
            action={createProject}
            className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
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
      </div>
    </div>
  );
};

export default ProjectsPage;
