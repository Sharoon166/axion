'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, PenTool } from 'lucide-react';

const ExploreSection = () => {
  return (
    <section className="relative py-12 sm:py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Unified card wrapper to match the mock */}
      <div className="rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image */}
          <div className="relative min-h-[240px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[440px]">
            <Image
              src="/about-image.jpg"
              alt="Lighting innovation"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Right: Gradient panel */}
          <div className="p-6 sm:p-10 md:p-12 bg-gradient-to-br from-[#1161C2] via-[#1062b0] to-[#7A1FA2] text-white flex items-center">
            <div className="space-y-5 sm:space-y-6 max-w-xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                Innovative Lighting for
                <br className="hidden sm:block" />
                <span className="ml-1">Modern Spaces</span>
              </h2>
              <p className="text-white/90 text-sm sm:text-base line-clamp-2 sm:line-clamp-none md:text-lg">
                At Axion, we blend cutting-edge lighting technology with timeless design aesthetics. Our products illuminate spaces while enhancing comfort, sustainability, and style.
              </p>

              {/* Bullets */}
              <ul className="space-y-3 text-sm sm:text-base">
                <li className="flex items-center gap-3">
                  <PenTool className="w-5 h-5 text-white/90" />
                  <span>Precision Crafted Designs</span>
                </li>
                <li className="flex items-center gap-3">
                  <Leaf className="w-5 h-5 text-[#6EE7B7]" />
                  <span>Eco-Friendly Materials</span>
                </li>
              </ul>

              
              <Link
                href="/about"
                className="inline-flex items-center bg-white text-slate-900 hover:bg-slate-100 px-5 sm:px-6 py-2.5 rounded-lg font-medium shadow-md w-full justify-center sm:w-auto transition-colors group text-sm sm:text-md"
              >
                Explore Our Story
                <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExploreSection;
