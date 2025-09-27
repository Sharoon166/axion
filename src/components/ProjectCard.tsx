import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

export interface ProjectCardProps {
  href: string;
  image: string;
  title: string;
  category?: string; // e.g., Residential
  style?: string; // e.g., Modern
  location?: string; // e.g., Islamabad, Pakistan
  type?: string; // e.g., Modern
  date?: string; // e.g., July 2025
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  image,
  title,
  style,
  location,
  type,
  date,
  className,
}) => {
  return (
    <Link
      href={href}
      className={`bg-white rounded-2xl relative shadow-md hover:shadow-md transition-shadow duration-300 overflow-hidden block ${
        className || ''
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-56 md:h-96">
        <Image
          src={getImageUrl(image) || '/404-error-page.jpg'}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className=" py-3 px-4">
        <p className="text-slate-600 capitalize text-sm mb-1">
          {`${type} - ${style?.split(',').join(' - ') || ''}`}
        </p>

        <h3 className="text-lg md:text-lg  font-semibold line-clamp-2 text-slate-900  leading-snug">
          {title}
        </h3>
        {(location || date) && (
          <p className="text-slate-500 absolute bottom-2 text-sm">
            {location || ''}
            {location && date ? '  -  ' : ''}
            {date
              ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : ''}
          </p>
        )}
        <div className="pb-5"></div>
      </div>
    </Link>
  );
};

export default ProjectCard;
