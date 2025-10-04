'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';

const NewsletterSection = () => {
  return (
    <section className="relative  py-20 rounded-lg mb-10 overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/collection-3.jpg"
          alt="Newsletter background"
          fill
          className="object-cover brightness-40 group-hover:brightness-150 transition-all"
        />
        {/* Dark overlay */}
        {/* <div className="absolute inset-0 bg-black/60"></div> */}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[85rem] mx-auto px-3 sm:px-6 text-center">
        <h2 className="text-2xl text-pretty sm:text-3xl font-bold text-white mb-6">
          Let&apos;s get started
        </h2>
        <p className="text-base text-pretty sm:text-md  text-white/90 mb-8  max-w-xl sm:max-w-2xl mx-auto px-4">
          Contact us today to discuss your bulk order requirements and receive a customized quote
          tailored to your needs.
        </p>
        <Button size="lg" className="bg-(--color-logo) hover:bg-(--color-logo)/90 ">
          Get in touch
        </Button>
      </div>
    </section>
  );
};

export default NewsletterSection;
