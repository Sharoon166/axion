import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

export interface ProjectCardProps {
  href: string;
  image: string;
  title: string;
  category?: string; // e.g., Residential
  style?: string;    // e.g., Modern
  location?: string; // e.g., Islamabad, Pakistan
  date?: string;     // e.g., July 2025
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  image,
  title,
  category,
  style,
  location,
  date,
  className,
}) => {
  return (
    <Link
      href={href}
      className={`bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow duration-300 overflow-hidden block ${
        className || ''
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-56 md:h-80">
        <Image
          src={getImageUrl(image) || '/404-error-page.jpg'}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        {(category || style) && (
          <p className="text-slate-600 text-sm mb-2">
            {category || ''}
            {category && style ? ' - ' : ''}
            {style || ''}
          </p>
        )}
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3 leading-snug">
          {title}
        </h3>
        {(location || date) && (
          <p className="text-slate-500 text-sm">
            {location || ''}
            {location && date ? '  -  ' : ''}
            {date || ''}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;
