'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center min-h-[70vh] sm:min-h-[80vh]">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-image.jpg"
          alt="Axion smart lighting hero"
          fill
          priority
          className="object-cover brightness-50"
        />
        {/* subtle darken for readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-3xl text-center mx-auto text-white space-y-6 sm:space-y-8">
          <h1 className="font-semibold leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Illuminate Your World with <span className="text-[#3FA9F5]">Axion</span>
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg">
            Smart lighting redefined — blending elegance, efficiency, and innovation to brighten your world.
          </p>
          <div>
            <Link
              href="/products"
              className="inline-flex items-center bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 md:px-8 md:py-4 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-md"
            >
              Discover Now
              <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
