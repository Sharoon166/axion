import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

export interface BlogCardProps {
  href: string;
  image?: string;
  title: string;
  tag?: string;
  date?: string;
  description?: string;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ href, image, title, description, className }) => {
  return (
    <Link href={href} className={`bg-white rounded-2xl overflow-hidden ${className || ''}`}>
      {/* Image */}
      <div className="relative h-80">
        {image ? (
          <Image src={getImageUrl(image)} alt={title} fill className="object-cover rounded-lg" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 group">
        <h3 className="text-lg md:text-xl break-all font-bold text-black mb-3 leading-tight line-clamp-1" title={title}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {description.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 120)}...
          </p>
        )}

        <span className="mt-2 inline-flex items-center hover:underline text-black font-medium">
          Read More
          <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </div>
    </Link>
  );
};

export default BlogCard;
