'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Project } from '@/types';
import Loading from '@/loading';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Track selected main image
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${slug}`);
        if (response.ok) {
          const data = await response.json();
          const proj = data?.data ?? data;
          setProject(proj);
          setSelectedImage(proj?.images?.[0] || '/prodcut-1.jpg'); // Set first image as default
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!project) {
    return <div className="p-10 text-center text-gray-500">Project not found</div>;
  }

  return (
    <>
      <PageHeader title="" />
      <div className="max-w-[85rem] mx-auto px-8 sm:px-6 md:px-12 lg:px-8 py-6 mb-10">
        {/* Hero Section with Title and Main Image */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Title and Description (second on small screens) */}
          <div className="space-y-4 order-2 lg:order-1">
            {(() => {
              const title = typeof project.title === 'string' ? project.title.trim() : '';
              if (!title) {
                return <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>;
              }
              const words = title.split(/\s+/);
              const lastWord = words.pop() || '';
              const mainTitle = words.join(' ');
              return (
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                  {mainTitle} {lastWord}
                </h1>
              );
            })()}
            {project.overview && (
              <p className="text-gray-600 text-lg leading-relaxed">{project.overview}</p>
            )}
              <div className="space-y-12">
            {/* Project Overview Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h2>
              <div className="text-gray-700 leading-relaxed">
                {project.content ? (
                  <p className="whitespace-pre-wrap">{project.content}</p>
                ) : (
                  <p>{project.overview}</p>
                )}
              </div>
            </section>

            {/* Key Features Section */}
            {(project.keyFeatures || project.features) && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
                <div className="space-y-3">
                  {project.keyFeatures
                    ? project.keyFeatures
                        .split('\n')
                        .filter(Boolean)
                        .map((feature: string, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#0077B6] rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-700">{feature.trim()}</p>
                          </div>
                        ))
                    : project.features?.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-[#0077B6] rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700">{feature}</p>
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* Technical Specifications Section */}
            {(project.technicalSpecs || project.specs) && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
                <div className="space-y-3">
                  {/* same technical specs logic as before */}
                  {/* ... */}
                </div>
              </section>
            )}
          </div>
          </div>

          {/* Right: Main Project Image + Thumbnails (first on small screens) */}
          <div className="order-1 lg:order-2">
            {/* Main Image with Slide Animation (auto height) */}
            <div className="w-full mb-4 overflow-hidden h-[20rem] sm:h-[25rem] md:h-[30rem] rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={selectedImage || '/prodcut-1.jpg'}
                    alt="Main Project Image"
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-2xl object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            {project.images && project.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {project.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === img ? 'border-[#0077B6]' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Testimonial Section */}
        {(project.clientTestimonial?.text || project.testimonial?.text) && (
          <section className="mt-16 text-center bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl sm:text-3xl  font-bold text-gray-900 mb-6">What Our Client Says</h2>
            <blockquote className="text-md sm:text-lg text-gray-700 italic max-w-3xl mx-auto mb-6">
             &ldquo;{project.clientTestimonial?.text || project.testimonial?.text}&rdquo;
            </blockquote>
            {(project.clientTestimonial?.author || project.testimonial?.author) && (
              <p className="font-semibold text-gray-900">
                {project.clientTestimonial?.author || project.testimonial?.author}
              </p>
            )}
          </section>
        )}

        {/* CTA Section */}
        <div className="relative rounded-xl overflow-hidden mt-16">
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
            <Button
              className="bg-[#0d3361] text-white px-6 py-3 rounded-lg shadow-md transition"
              onClick={() => router.push('/contact')}
            >
              Start Your Project <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;
