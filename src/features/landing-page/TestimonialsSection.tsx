'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
    name: 'Ahmed Raza',
    title: 'ahmed.raza92@gmail.com',
    rating: 4,
    text: 'I bought a living room lamp from Axion Lighting and the experience was great. The light is soft, creates a nice ambience, and the delivery was right on time. Very satisfied!',
    image: '/prodcut-1.jpg'
  },
  {
    _id: '2',
    name: 'Fatima Khan',
    title: 'fatima.khan123@hotmail.com',
    rating: 5,
    text: 'Axion’s customer service is excellent. The lights I ordered for my bedroom turned out to be perfect in both design and quality. It makes me proud to see a Pakistani brand delivering at such a high standard.',
    image: '/prodcut-2.jpg'
  },
  {
    _id: '3',
    name: 'Bilal Ahmed',
    title: 'bilalahmed.pk@gmail.com',
    rating: 5,
    text: 'I installed their solar garden lights and noticed a clear reduction in my electricity bill. The garden looks beautiful at night, and the build quality is impressive. I’ll definitely recommend Axion to my friends and family.',
    image: '/prodcut-3.jpg'
  }
];


const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  // Transition state
  const [phase, setPhase] = useState<'idle' | 'leaving' | 'entering'>('idle');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  // Touch state for swipe
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

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
    if (phase !== 'idle') return;
    setDirection('next');
    setPhase('leaving');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      setPhase('entering');
      setTimeout(() => setPhase('idle'), 300);
    }, 150);
  };

  const prevTestimonial = () => {
    if (phase !== 'idle') return;
    setDirection('prev');
    setPhase('leaving');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setPhase('entering');
      setTimeout(() => setPhase('idle'), 300);
    }, 150);
  };

  const goToTestimonial = (index: number) => {
    if (phase !== 'idle' || index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setPhase('leaving');
    setTimeout(() => {
      setCurrentIndex(index);
      setPhase('entering');
      setTimeout(() => setPhase('idle'), 300);
    }, 150);
  };

  const currentTestimonial = testimonials[currentIndex];

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current == null || touchCurrentX.current == null) return;
    const delta = touchCurrentX.current - touchStartX.current;
    const threshold = 50; // px
    if (delta > threshold) {
      prevTestimonial();
    } else if (delta < -threshold) {
      nextTestimonial();
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const slideClass = () => {
    const base = 'transition-all duration-300 ease-out';
    if (phase === 'leaving') {
      return `${base} ${direction === 'next' ? '-translate-x-4' : 'translate-x-4'} opacity-0`;
    }
    if (phase === 'entering') {
      return `${base} ${direction === 'next' ? 'translate-x-4' : '-translate-x-4'} opacity-0`;
    }
    return `${base} translate-x-0 opacity-100`;
  };

  return (
    <section className="py-12 md:py-20 bg-[#ECEBE7]">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 md:mb-3">
            What Our Customer Say
          </h2>
          <p className="text-sm md:text-base text-gray-600">Trusted by thousands of lighting lovers worldwide.</p>
        </div>

        {/* Testimonial Card with side arrows */}
        <div className="relative max-w-5xl mx-auto" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {/* Card */}
          <div className={`rounded-2xl overflow-hidden shadow-xl h-[500px] sm:h-[550px] md:h-[400px] lg:h-[450px] ${slideClass()}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Left: Gradient content */}
              <div className="order-2 md:order-1 p-6 md:p-8 lg:p-10 bg-gradient-to-br from-[#1E8263] to-[#3C6CCB] text-white flex flex-col justify-between h-full md:h-auto">
                <div className="flex-1 flex flex-col">
                  <div className="text-base md:text-lg font-semibold mb-3">Client Feedback</div>
                  <blockquote className="text-sm md:text-lg lg:text-xl text-white/90 leading-relaxed italic flex-1 flex items-center">
                    {`"${currentTestimonial.text}"`}
                  </blockquote>
                </div>
                <div className="mt-5">
                  <div className="flex items-center gap-3 md:gap-4 mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                      <span className="font-bold">{currentTestimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">{currentTestimonial.name}</h4>
                      <p className="text-xs md:text-sm text-white/80">{currentTestimonial.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-[#E1B857] text-[#E1B857]" />
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: Image */}
              <div className="order-1 md:order-2 relative h-56 sm:h-72 md:h-full">
                <Image
                  src={currentTestimonial.image}
                  alt="Lighting fixture"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Side arrows */}
          <button
            aria-label="Previous"
            onClick={prevTestimonial}
            className="hidden sm:flex absolute left-[-1.25rem] top-1/2 -translate-y-1/2  -translate-x-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--color-logo)] text-white items-center justify-center shadow-md hover:bg-[#102743]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            aria-label="Next"
            onClick={nextTestimonial}
            className="hidden sm:flex absolute right-[-1.25rem] top-1/2 -translate-y-1/2 translate-x-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--color-logo)] text-white items-center justify-center shadow-md hover:bg-[#102743]"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              className={`${index === currentIndex ? 'bg-[var(--color-logo)] w-3 h-3' : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'} rounded-full transition-all`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
