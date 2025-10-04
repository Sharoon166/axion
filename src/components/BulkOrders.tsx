'use client';
import React, { useState } from 'react';
import { Tag, BookOpen, Headphones } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

// Gallery images from Unsplash
const galleryImages = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    title: 'Lighting Consultation',
    description:
      'Get expert guidance from our lighting specialists to choose the perfect solutions for your space.',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    title: 'Modern Fixtures',
    description: 'Discover our collection of contemporary lighting fixtures for every room.',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800&h=600&fit=crop',
    title: 'Smart Lighting',
    description: 'Experience the future with our smart lighting solutions and automation systems.',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    title: 'Outdoor Lighting',
    description: 'Transform your outdoor spaces with our weather-resistant lighting options.',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=600&fit=crop',
    title: 'Commercial Solutions',
    description:
      'Professional lighting solutions for offices, retail spaces, and commercial buildings.',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    title: 'Installation Services',
    description: 'Expert installation by our certified professionals with warranty coverage.',
  },
];

export default function ServicesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const bulkOrderNumber = process.env.NEXT_PUBLIC_CONTACT_BULK_ORDER;
  const servicesNumber = process.env.NEXT_PUBLIC_CONTACT_OTHER_SERVICES;

  const servicesMessage = encodeURIComponent("Hi! I'm interested in your services.");
  const servicesWhatsappLink = `https://wa.me/${servicesNumber}?text=${servicesMessage}`;

  const bulkOrderMessage = encodeURIComponent(
    "Hi! I'm interested in bulk orders and would like to request a quote.",
  );
  const bulkOrderWhatsappLink = `https://wa.me/${bulkOrderNumber}?text=${bulkOrderMessage}`;

  return (
    <div className="p-8">
      <div className="w-full mx-auto">
        <div className="flex gap-8 items-start">
          {/* Left Side - Text and Buttons */}
          <div className="flex-shrink-0 w-full max-w-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Services</h2>
            <p className="text-gray-600 mb-8">
              Discover our range of professional lighting solutions designed to elevate every space.
              From expert consultation to seamless installation, we bring brilliance, precision, and
              innovation to every project we deliver.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" className="px-8 py-3 hover:bg-(--color-logo)/90" asChild>
                <a href={servicesWhatsappLink} target="_blank" rel="noopener noreferrer">
                  Book a Service
                </a>
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="px-8 py-3"
                style={{ backgroundColor: 'var(--color-logo)' }}
              >
                Bulk Order
              </Button>
            </div>
          </div>

          {/* Right Side - Image Gallery */}
          <div className="flex gap-3 flex-1 justify-end">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className={`relative cursor-pointer transition-all duration-500 ease-in-out flex-shrink-0 rounded-2xl overflow-hidden ${
                  selectedImage === index ? 'w-80 h-72' : 'w-16 h-72'
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <div
                  className="w-full h-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${image.url})` }}
                >
                  <div className="absolute inset-0 bg-black/40"></div>
                  {selectedImage === index && (
                    <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                      <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                      <p className="text-white/90 text-xs leading-relaxed">{image.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Dialog for Bulk Orders */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl min-w-fit max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-8">
              <DialogHeader className="text-center">
                <DialogTitle className="text-3xl text-center font-bold">
                  Bulk Order Benefits
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 text-center">
                  Unlock exclusive advantages when ordering in larger quantities
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                {/* Exclusive Discount */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Tag className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">Exclusive Discount</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    If you order in bulk, we will give you special discount rates that scale with
                    your order volume. The more you order, the more you save!
                  </p>
                </div>

                {/* Priority Processing */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">Priority Processing</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your bulk orders will be prioritized in our production queue, ensuring faster
                    turnaround times and expedited delivery.
                  </p>
                </div>

                {/* Dedicated Support */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Headphones className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">Dedicated Support</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Get assigned a dedicated account manager who will handle your bulk order from
                    start to finish, providing personalized assistance
                  </p>
                </div>
              </div>

              {/* CTA Section with Background Image */}
              <div
                className="mt-8 rounded-2xl overflow-hidden relative"
                style={{
                  backgroundImage: 'url(/bulk-order.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '250px',
                }}
              >
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-12 px-6">
                  <h4 className="text-3xl font-bold text-white mb-3">Ready to Get Started?</h4>
                  <p className="text-white/90 text-sm max-w-2xl mb-6">
                    Contact us today to discuss your bulk order requirements and receive a
                    customized quote tailored to your needs.
                  </p>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-lg transition-colors"
                  >
                    <a href={bulkOrderWhatsappLink} target="_blank" rel="noopener noreferrer">
                      Get in Touch
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
