'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ name: string; href?: string }>;
}

const PageHeader = ({ title, titleHighlight, subtitle, breadcrumbs }: PageHeaderProps) => {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if not provided
  const defaultBreadcrumbs =
    breadcrumbs ||
    (() => {
      const paths = pathname.split('/').filter(Boolean);
      const breadcrumbItems = [{ name: 'Home', href: '/' }];

      let currentPath = '';
      paths.forEach((path, index) => {
        currentPath += `/${path}`;
        const isLast = index === paths.length - 1;
        breadcrumbItems.push({
          name: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
          href: isLast ? '' : currentPath,
        });
      });

      return breadcrumbItems;
    })();

  return (
    <div className="w-full bg-white *:capitalize">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <div className="text-sm sm:text-md mt-8 font-semibold">
          {defaultBreadcrumbs.map((crumb, index) => {
            const isLast = index === defaultBreadcrumbs.length - 1;
            return (
              <span key={index}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-[var(--color-primary)] transition-colors"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-black' : 'text-gray-500'}>{crumb.name}</span>
                )}
                {index < defaultBreadcrumbs.length - 1 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
              </span>
            );
          })}
        </div>

        {/* Page Title */}
        <div className="text-center py-6 sm:py-2 ">
          <h1 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-0 sm:font-semibold text-black  leading-tight">
            {titleHighlight ? (
              <>
                {title} <span className="text-black">{titleHighlight}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-lg  text-gray-700 max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto leading-relaxed px-4">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
