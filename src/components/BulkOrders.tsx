'use client';
import React, { useState } from 'react';
import { Home, Lightbulb, Wrench, Tag, BookOpen, Headphones } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

export default function ServicesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Our Services Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-gray-600 mb-6">
            Delivering professional solutions to enhance your home and business with quality and
            care
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-700">
              <Home className="w-5 h-5" />
              <span>Home Renovation</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Lightbulb className="w-5 h-5" />
              <span>Custom Lighting Solution</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Wrench className="w-5 h-5" />
              <span>Professional Installation</span>
            </div>
          </div>

          <Button asChild className="w-full bg-(--color-logo) hover:bg-(--color-logo)/80">
            <a href={servicesWhatsappLink} target="_blank" rel="noopener noreferrer">
              Contact us
            </a>
          </Button>
        </div>

        {/* Bulk Orders Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk Orders</h2>
          <p className="text-gray-600 mb-6">
            Get exclusive discounts and dedicated support when purchasing in larger quantities
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-700">
              <Tag className="w-5 h-5" />
              <span>Discounted Pricing</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <BookOpen className="w-5 h-5" />
              <span>Priority Processing</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Headphones className="w-5 h-5" />
              <span>Dedicated Support</span>
            </div>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-(--color-logo) hover:bg-(--color-logo)/80"
          >
            Request Quote
          </Button>
        </div>
      </div>

      {/* Dialog for Bulk Orders */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl min-w-fit max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-8">
              <DialogHeader className="text-center">
                <DialogTitle className="text-3xl text-center font-bold">Bulk Order Benefit</DialogTitle>
                <DialogDescription className="text-base text-gray-600 text-center">
                  Unlock exclusive advantages when ordering in larger quantities
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    className="bg-(--color-logo) hover:bg-(--color-logo)/90 text-white px-8 py-6 text-base font-semibold rounded-lg transition-colors"
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
