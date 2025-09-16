'use client';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function Collections() {
  return (
    <section className="py-8 sm:py-12">
      {/* Heading */}
      <div className="text-center mb-6 sm:mb-8 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold">
          <span className="text-black">Explore Our Lightning</span>
          <span className="text-[var(--color-primary)]"> Collections</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          From modern neon art to eco-friendly outdoor illumination
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Indoor Lighting */}
        <div className="relative rounded-xl overflow-hidden">
          <Image
            src="/collection-1.jpg"
            alt="Indoor Lighting"
            width={600}
            height={400}
            className="w-full h-48 sm:h-56 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                INDOOR LIGHTING
              </h3>
              <p className="text-white mt-1 text-xs sm:text-sm md:text-base">
                Illuminate every corner with elegance.
              </p>

              <Link
                href="/category/indoor-lighting"
                className="inline-flex items-center bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mt-2 sm:mt-4 w-fit h-6 sm:h-8 backdrop-blur-sm transition hover:bg-white/30 group text-xs sm:text-sm"
              >
                Explore
                <ArrowUpRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Solar Lighting */}
        <div className="relative rounded-xl overflow-hidden">
          <Image
            src="/collection-2.jpg"
            alt="Solar Lighting"
            width={600}
            height={400}
            className="w-full h-48 sm:h-56 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                SOLAR LIGHTING
              </h3>
              <p className="text-white mt-1 text-xs sm:text-sm md:text-base">
                Light powered by the sun.
              </p>

              <Link
                href="/category/solar-lighting"
                className="inline-flex items-center bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mt-2 sm:mt-4 w-fit h-6 sm:h-8 backdrop-blur-sm transition hover:bg-white/30 group text-xs sm:text-sm"
              >
                Explore
                <ArrowUpRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Outdoor Lighting - Full Width (span 2 cols) */}
        <div className="relative rounded-xl overflow-hidden md:col-span-2">
          <Image
            src="/collection-3.jpg"
            alt="Outdoor Lighting"
            width={1200}
            height={400}
            className="w-full h-48 sm:h-56 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                OUTDOOR LIGHTING
              </h3>
              <p className="text-white mt-1 text-xs sm:text-sm md:text-base">
                Bold lighting for open spaces.
              </p>

              <Link
                href="/category/outdoor-lighting"
                className="inline-flex items-center bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mt-2 sm:mt-4 w-fit h-6 sm:h-8 backdrop-blur-sm transition hover:bg-white/30 group text-xs sm:text-sm"
              >
                Explore
                <ArrowUpRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Button below grid */}
      <div className="flex items-center justify-center p-4 sm:p-6 mt-2 sm:mt-4">
        <Link
          href="/category"
          className="inline-flex items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
        >
          Explore Collection
          <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-2">
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
