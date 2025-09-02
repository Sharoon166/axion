import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-[#0B1D39] text-white">
      {/* Main Footer Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-start gap-6 sm:gap-8 w-full">

            {/* Column 1: Brand Information */}
            <div className="space-y-4 sm:space-y-6 flex flex-col items-start col-span-1 sm:col-span-2 lg:col-span-1">
              <div className='size-20 sm:size-24 lg:size-28 overflow-hidden flex items-center justify-start'>
                <Image
                  src={'/Logo.svg'}
                  alt={'logo'}
                  width={100}
                  height={100}
                  className='object-cover object-center brightness-200 '
                />
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-3 sm:space-x-4 justify-start">
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3 sm:space-y-4 flex flex-col items-start">
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Quick Links</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><Link href="/" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/category" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Products</Link></li>
                <li><Link href="/projects" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Projects</Link></li>
                <li><Link href="/blog" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/about" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="space-y-3 sm:space-y-4 flex flex-col items-start">
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Support</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><Link href="/faqs" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="/privacy" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Terms & Condition</Link></li>
                <li><Link href="/return" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Return Policy</Link></li>
                <li><Link href="/shipping" className="text-sm sm:text-base text-white/80 hover:text-white transition-colors">Shipping Policy</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div className="space-y-3 sm:space-y-4 flex flex-col items-start">
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Contact Us</h3>
              <div className="space-y-2 sm:space-y-3 w-full">
                <a href={`tel:+923001234567`} className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-secondary)] flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white/80">+92 300 1234567</span>
                </a>
                <a href={`mailto:info@axion.com`} className="flex items-center space-x-2 sm:space-x-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-secondary)] flex-shrink-0" />
                  <span className="text-sm sm:text-base text-white/80">info@axion.com</span>
                </a>
                <a href={`https://maps.app.goo.gl/eYf31R2ZmHysa2GW8`} className="flex items-start space-x-2 sm:space-x-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-secondary)] mt-1 flex-shrink-0" />
                  <span className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    123 Crescent Avenue, Blue Heights, Islamabad, Pakistan 44000
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-6 sm:mt-8">
          <div className="w-full py-4 sm:py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center sm:items-start gap-2 sm:gap-8 text-center sm:text-left">
                <p className="text-xs sm:text-sm text-white/80">
                  2025 © Axion All Rights Reserved.
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Designed & Developed by Synctom
                </p>
              </div>
            </div>
          </div>
        </div>
      </div >
    </footer>
  );
};

export default Footer;
