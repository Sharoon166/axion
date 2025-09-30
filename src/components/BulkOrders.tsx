'use client'
import React, { useState } from 'react';
import { Home, Lightbulb, Wrench, Tag, BookOpen, Headphones } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from './ui/button';

export default function ServicesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const bulkOrderNumber = process.env.NEXT_PUBLIC_CONTACT_BULK_ORDER;
  const servicesNumber = process.env.NEXT_PUBLIC_CONTACT_OTHER_SERVICES;

  const servicesMessage = encodeURIComponent("Hi! I'm interested in your services.");
  const servicesWhatsappLink = `https://wa.me/${servicesNumber}?text=${servicesMessage}`;

  const bulkOrderMessage = encodeURIComponent("Hi! I'm interested in bulk orders and would like to request a quote.");
  const bulkOrderWhatsappLink = `https://wa.me/${bulkOrderNumber}?text=${bulkOrderMessage}`;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Our Services Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-gray-600 mb-6">
            Delivering professional solutions to enhance your home and business with quality and care
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

          <Button asChild className='w-full bg-(--color-logo) hover:bg-(--color-logo)/80'>
            <a
              href={servicesWhatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </a>
          </Button>
        </div>

        {/* Bulk Orders Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bulk Orders</h2>
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

          <Button onClick={() => setIsDialogOpen(true)} className='w-full bg-(--color-logo) hover:bg-(--color-logo)/80'>
            Request Quote
          </Button>
        </div>
      </div>

      {/* Dialog for Bulk Orders */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <ScrollArea className="max-h-[70vh] pr-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Bulk Order Benefits</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Unlock exclusive advantages when ordering in larger quantities
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Exclusive Discounts
                </h3>
                <p className="text-gray-600 ml-7">
                  If you order in bulk, we will give you special discount rates that scale with your order volume. The more you order, the more you save!
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Priority Processing
                </h3>
                <p className="text-gray-600 ml-7">
                  Your bulk orders will be prioritized in our production queue, ensuring faster turnaround times and expedited delivery.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-blue-600" />
                  Dedicated Support
                </h3>
                <p className="text-gray-600 ml-7">
                  Get assigned a dedicated account manager who will handle your bulk order from start to finish, providing personalized assistance throughout the process.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Ready to get started?</h4>
                <p className="text-gray-700 text-sm mb-4">
                  Contact us today to discuss your bulk order requirements and receive a customized quote tailored to your needs.
                </p>
                <Button asChild onClick={() => setIsDialogOpen(true)} className='w-full bg-(--color-logo) hover:bg-(--color-logo)/80'>

                  <a
                    href={bulkOrderWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-logo inline-block text-white font-semibold py-2 px-6 rounded-lg transition-opacity"
                  >
                    Contact Us on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}