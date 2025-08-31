'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  _id: string;
  name: string;
  title: string;
  rating: number;
  text: string;
  image: string;
  featured?: boolean;
  approved?: boolean;
}

// Fallback testimonials in case API fails or no testimonials exist
const fallbackTestimonials: Testimonial[] = [
  {
    _id: '1',
    name: 'Sophia Martinez',
    title: 'Interior Designer',
    rating: 5,
    text: 'Axion Lighting completely transformed my living space. The quality of the lamps is unmatched — the finishes feel luxurious, and the light is warm and inviting. I especially love their solar range, which blends beautifully with my outdoor setup and saves on energy costs.',
    image: '/prodcut-1.jpg'
  },
  {
    _id: '2',
    name: 'Michael Chen',
    title: 'Architect',
    rating: 5,
    text: "The attention to detail in Axion's lighting fixtures is remarkable. Each piece feels like a work of art that perfectly complements any interior design. Their customer service is exceptional too.",
    image: '/prodcut-2.jpg'
  },
  {
    _id: '3',
    name: 'Emma Rodriguez',
    title: 'Homeowner',
    rating: 5,
    text: 'I was amazed by the quality and design of my new outdoor lighting. The solar-powered options are not only beautiful but incredibly energy-efficient. My garden has never looked better!',
    image: '/prodcut-3.jpg'
  }
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials?featured=true&limit=10');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setTestimonials(result.data as Testimonial[]);
      } else {
        // Use fallback testimonials if no data from API
        setTestimonials(fallbackTestimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      // Use fallback testimonials on error
      setTestimonials(fallbackTestimonials);
    } finally {
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-12 md:py-20 bg-[var(--color-background)]">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 md:mb-4">
            What Our <span className="text-[var(--color-primary-accent)]">Customer</span> Say
          </h2>
          <p className="text-sm md:text-md text-[var(--color-secondary-text)]">
            Trusted by thousands of lighting lovers worldwide.
          </p>
        </div>

        {/* Testimonial Card */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl md:pl-12 max-w-4xl mx-auto overflow-hidden">
            <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8">
              {/* Image */}
              <div className="order-1 md:order-2 flex items-center justify-center">
                <Image
                  src={currentTestimonial.image}
                  alt="Lighting fixture"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover md:rounded-r-2xl"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>

              {/* Content */}
              <div className="order-2 md:order-1 space-y-3 md:space-y-6 p-4 md:p-6 lg:p-10">
                <div className="text-lg md:text-xl font-semibold text-black">
                  Client Feedback
                </div>

                <blockquote className="text-sm md:text-lg lg:text-xl text-[var(--color-secondary-text)] leading-relaxed italic">
                  {`"${currentTestimonial.text}"`}
                </blockquote>

                {/* Reviewer Info */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--color-secondary)] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg">
                    {currentTestimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm md:text-base text-[var(--color-main-text)]">
                      {currentTestimonial.name}
                    </h4>
                    <p className="text-xs md:text-sm text-[var(--color-secondary-text)]">
                      {currentTestimonial.title}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 md:w-5 md:h-5 fill-[var(--color-golden)] text-[var(--color-golden)]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls (Arrows + Dots) */}
        <div className="flex items-center justify-center gap-4 mt-6 md:mt-8">
          {/* Left Arrow */}
          <Button
            onClick={prevTestimonial}
            className="w-8 h-8 md:w-10 md:h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <Button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all border-0 p-0 ${index === currentIndex
                  ? 'bg-[var(--color-primary)] w-3 h-3 md:w-4 md:h-4'
                  : 'bg-[var(--color-border)] hover:bg-[var(--color-primary-light)]'
                  }`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <Button
            onClick={nextTestimonial}
            className="w-8 h-8 md:w-10 md:h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg"
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
