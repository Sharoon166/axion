'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    inquiryType: '',
    budgetRange: '',
    cityCountry: '',
    message: '',
    contactMethod: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('full-name', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('inquiry-type', formData.inquiryType);
      formDataToSend.append('budget-range', formData.budgetRange);
      formDataToSend.append('city-country', formData.cityCountry);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('contact-method', formData.contactMethod);

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Message sent successfully!');
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          company: '',
          inquiryType: '',
          budgetRange: '',
          cityCountry: '',
          message: '',
          contactMethod: '',
        });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch {
      console.error('Contact form error:');
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Contact"
        titleHighlight="Axion"
        subtitle="Questions, quotes, or custom projects—we're here to help!"
      />
      <div className="max-w-[85rem] mx-auto px-4 py-8 space-y-12">
        <Card className="w-full shadow-md border border-gray-100 rounded-2xl overflow-hidden">
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 lg:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <h3 className="text-2xl text-center sm:text-3xl font-bold text-gray-900 mb-2">
                Send Us a Message
              </h3>
              <p className="text-sm sm:text-base  text-center mb-8">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-sm font-medium">
                    Your Details
                  </Label>
                  <Input
                    id="full-name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    required
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    required
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                  />
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company Name (Optional)"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                  />
                </div>

                <div className="space-y-6">
                  <Label className="text-base font-semibold text-gray-900">Project Details</Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) => handleSelectChange('inquiryType', value)}
                    required
                  >
                    <SelectTrigger
                      id="inquiry-type"
                      className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                    >
                      <SelectValue placeholder="Select Inquiry Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lighting">Lighting Project</SelectItem>
                      <SelectItem value="installation">Installation Service</SelectItem>
                      <SelectItem value="consultation">Design Consultation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.budgetRange}
                    onValueChange={(value) => handleSelectChange('budgetRange', value)}
                    required
                  >
                    <SelectTrigger
                      id="budget-range"
                      className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                    >
                      <SelectValue placeholder="Select Budget Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-5000">0 - 5,000</SelectItem>
                      <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                      <SelectItem value="10000-20000">10,000 - 20,000</SelectItem>
                      <SelectItem value="20000+">20,000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.cityCountry}
                    onValueChange={(value) => handleSelectChange('cityCountry', value)}
                  >
                    <SelectTrigger
                      id="city-country"
                      className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg"
                    >
                      <SelectValue placeholder="Select City/Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="islamabad">Islamabad, Pakistan</SelectItem>
                      <SelectItem value="lahore">Lahore, Pakistan</SelectItem>
                      <SelectItem value="karachi">Karachi, Pakistan</SelectItem>
                      <SelectItem value="other">Other Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Your Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your project requirements, timeline, and any specific needs..."
                    className="min-h-[140px] transition-all duration-200 focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white rounded-lg resize-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  * By sending your message, you agree to our privacy policy and terms of service.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[var(--color-logo)] hover:bg-[var(--color-logo)] text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message Now'}
                </Button>
              </div>
            </form>

            <div className="space-y-8">
              {/* Heading */}
              <div className="text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Get in Touch</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Reach out to us directly through any of these channels.
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-2xl border border-blue-100">
                {/* Phone */}
                <div className="flex flex-col sm:flex-row sm:items-center hover:text-blue-600 transition-colors cursor-pointer group">
                  <Phone className="w-6 h-6 text-blue-600 mb-2 sm:mb-0 sm:mr-4 group-hover:scale-110 transition-transform" />
                  <a
                    href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}
                    className="text-base sm:text-lg font-medium break-all"
                  >
                    {process.env.NEXT_PUBLIC_PHONE}
                  </a>
                </div>

                {/* Email */}
                <div className="flex flex-col sm:flex-row sm:items-center hover:text-blue-600 transition-colors cursor-pointer group">
                  <Mail className="w-6 h-6 text-blue-600 mb-2 sm:mb-0 sm:mr-4 group-hover:scale-110 transition-transform" />
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
                    className="text-base sm:text-lg font-medium break-all"
                  >
                    {process.env.NEXT_PUBLIC_EMAIL}
                  </a>
                </div>

                {/* Address */}
                <div className="flex flex-col sm:flex-row sm:items-start group">
                  <MapPin className="w-6 h-6 text-blue-600 mb-2 sm:mb-0 sm:mr-4 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-base sm:text-lg font-medium leading-relaxed">
                    123 Crescent Avenue, Blue Heights, Islamabad, Pakistan 44000
                  </span>
                </div>

                {/* Office Hours */}
                <div className="flex flex-col sm:flex-row sm:items-center group">
                  <Clock className="w-6 h-6 text-blue-600 mb-2 sm:mb-0 sm:mr-4 group-hover:scale-110 transition-transform" />
                  <span className="text-base sm:text-lg font-medium">
                    Monday - Saturday: 9:00 AM to 5:00 PM
                  </span>
                </div>
              </div>

              {/* Map */}
              <div className="w-full h-64 sm:h-80 bg-gray-100 overflow-hidden rounded-2xl shadow-lg border border-gray-200">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=73.0479%2C33.6844%2C73.0579%2C33.6944&amp;layer=mapnik"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  title="Map"
                ></iframe>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-8 rounded-3xl border border-gray-100">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-b border-gray-200">
              <AccordionTrigger className="hover:text-primary text-left font-medium py-4">
                How soon can you reply?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                We prioritize quick responses and typically reply within 24 hours during business
                days (Monday-Saturday).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b border-gray-200">
              <AccordionTrigger className="hover:text-primary text-left font-medium py-4">
                Do you ship internationally?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                Yes, we provide worldwide shipping with full tracking capabilities. International
                delivery times typically range from 5-10 business days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b border-gray-200">
              <AccordionTrigger className="hover:text-primary text-left font-medium py-4">
                Do you offer free installation?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                Yes, we provide complimentary professional installation for orders exceeding $5,000.
                For smaller orders, we offer installation at competitive rates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-b border-gray-200">
              <AccordionTrigger className="hover:text-primary text-left font-medium py-4">
                Can you design custom frames?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                Absolutely! Our expert designers can create custom frames tailored to your specific
                requirements. We offer comprehensive design consultations to ensure your vision
                comes to life.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <section className="relative py-24 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0">
            <Image
              src="/collection-3.jpg"
              alt="Contact Axion"
              fill
              className="object-cover brightness-90"
              priority
            />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl text-pretty sm:text-3xl font-bold text-white uppercase mb-6">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Tell us about your next great lighting project and let Axion help you shine.
            </p>
            <Link
              href="/contact"
              className="bg-[#0a2b57] text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-[#0c3566] transition"
            >
              Start Your Project
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
