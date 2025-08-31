// app/projects/[slug]/page.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProject();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="p-10 text-center text-gray-500">Project not found</div>;
  }

  return (
    <>
      <div className=" max-w-[85rem] mx-auto mb-10 *:text-black">
        <PageHeader title="" />
        {/* Title + Hero */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {project.title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-[#0077B6]">{project.title.split(' ').slice(-1)}</span>
            </h1>
            <p className="text-gray-600 mb-6">
              Experience elegance redefined with a bespoke lighting design that blends luxury and
              functionality.
            </p>

            {/* Project Overview */}
            <h2 className="text-xl font-semibold mb-2">Project Overview</h2>
            <p className="text-gray-700 mb-6">{project.overview}</p>

            {/* Key Features */}
            {project.features && project.features.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-2">Key Features</h2>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
                  {project.features.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Technical Specifications */}
            {project.specs && (
              <>
                <h2 className="text-xl font-semibold mb-2">Technical Specifications</h2>
                <ul className="text-gray-700 space-y-1 mb-6">
                  {project.specs.type && (
                    <li>
                      <b>Project Type:</b> {project.specs.type}
                    </li>
                  )}
                  {project.specs.location && (
                    <li>
                      <b>Location:</b> {project.specs.location}
                    </li>
                  )}
                  {project.specs.completion && (
                    <li>
                      <b>Completion Date:</b> {project.specs.completion}
                    </li>
                  )}
                  {project.specs.duration && (
                    <li>
                      <b>Duration:</b> {project.specs.duration}
                    </li>
                  )}
                  {project.specs.team && (
                    <li>
                      <b>Team:</b> {project.specs.team}
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>

          {/* Right Side Images */}
          <div>
            <Image
              src={project.images?.[0] || project.image || '/prodcut-1.jpg'}
              alt="Project Main"
              width={600}
              height={400}
              className="w-full h-80 object-cover rounded-lg mb-4"
            />
            {project.images && project.images.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {project.images.slice(1, 9).map((img: string, i: number) => (
                  <Image
                    key={i}
                    src={img}
                    alt={`Project ${i}`}
                    width={200}
                    height={150}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Testimonial */}
        {project.testimonial && (
          <div className="text-center my-16">
            <h2 className="text-3xl text-black font-semibold mb-4">
              What Our <span className="text-[#0077B6]">Client</span> Says
            </h2>
            <p className="text-gray-700 italic max-w-2xl mx-auto mb-4">{project.testimonial.text}</p>
            <p className="font-medium">{project.testimonial.author}</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="relative rounded-xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80"
            alt="CTA Background"
            width={1200}
            height={300}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white px-6">
            <h2 className="text-2xl font-bold mb-2">Want a Similar Project?</h2>
            <p className="mb-4">
              Ready to transform your home or commercial space with premium lighting solutions?
            </p>
            <Button className="bg-[#0d3361] text-white px-6 py-3 rounded-lg shadow-md transition">
              Start Your Project{' '}
              <span>
                <ArrowRight />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;
