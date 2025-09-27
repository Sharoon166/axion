'use client';

import { Search, Brush, Truck, Lightbulb, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Browse Our Collection',
    description:
      'Discover our wide range of indoor, outdoor, and solar lighting — crafted to suit every space.',
  },
  {
    id: 2,
    icon: Truck,
    title: 'Fast & Secure Delivery',
    description:
      'We ensure quick, safe delivery straight to your doorstep, ready for installation.',
  },
  {
    id: 3,
    icon: Brush,
    title: 'Customize & Order',
    description:
      'Choose the perfect size, finish, or style. Place your order securely in just a few clicks.',
  },

  {
    id: 4,
    icon: Lightbulb,
    title: 'Enjoy the Glow',
    description: 'Switch it on, and let the perfect ambiance transform your space instantly.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 md:py-20 bg-#F4F6F8">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 md:mb-4">How it Works</h2>
          <p className="text-sm md:text-md text-[var(--color-secondary-text)]">
            From browsing to brightening your space, here&apos;s our simple process.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-16">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div key={step.id} className="text-center group">
                {/* Step Icon */}
                <div className="relative mb-3 md:mb-6">
                  <div className="size-12 md:size-16 mx-auto rounded-full flex items-center justify-center">
                    <IconComponent className="size-8 md:size-full text-[var(--color-logo)]" />
                  </div>
                  {/* Step Number */}
                </div>
                <div className="text-xs md:text-sm mb-2">
                  Step {step.id.toString().padStart(2, '0')}
                </div>

                {/* Step Content */}
                <h3 className="text-sm md:text-lg font-semibold text-black mb-2 md:mb-3">
                  {step.title}
                </h3>
                <p className="text-xs md:text-base text-black leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center p-3 md:p-6">
          {/* Call to Action */}
          <Link
            href="/products"
            className="inline-flex items-center bg-[var(--color-logo)] text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm md:text-base"
          >
            Shop Now
            <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-2">
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
