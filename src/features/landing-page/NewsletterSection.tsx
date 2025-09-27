'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

const NewsletterSection = () => {
  return (
    <section className="relative  py-20 rounded-lg mb-10 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/collection-3.jpg"
          alt="Newsletter background"
          fill
          className="object-cover brightness-90"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[85rem] mx-auto px-3 sm:px-6 text-center">
        <h2 className="text-2xl text-pretty sm:text-3xl font-bold text-white uppercase mb-6">
          Subscribe to our Newsletter
        </h2>
        <p className="text-base sm:text-md  text-white/90 mb-8 sm:mb-12 max-w-xl sm:max-w-2xl mx-auto px-4">
          Subscribe to our news letter.
        </p>
        {/* Newsletter Form */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex items-center justify-center border-4 border-white bg-white rounded-full shadow overflow-hidden w-full sm:w-auto sm:min-w-[400px] focus-within:border-white">
              <Input
                type="email"
                placeholder="Enter Your Email"
                className="flex-1 px-3 py-3 text-gray-600 rounded-l-full sm:rounded-l-full
              border-none focus:outline-none focus:ring-0 focus:border-none text-sm sm:text-base"
              />
              <Button
                className="bg-[#0a2b57] text-white px-4 py-4 sm:px-6 sm:py-6 rounded-full font-medium
              hover:bg-[#0c3566] transition-colors
              focus:outline-none focus:ring-0 text-sm sm:text-base"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
