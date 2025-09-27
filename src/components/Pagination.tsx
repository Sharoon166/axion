'use client';

import React from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Always show pagination, even with one page or no pages
  const displayTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded bg-white text-black disabled:opacity-50"
        aria-label="Previous page"
      >
        <ArrowLeft />
      </Button>

      {[...Array(displayTotalPages)].map((_, index) => {
        const page = index + 1;
        return (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 border rounded ${
              page === currentPage
                ? 'bg-[#0077B6] text-white hover:bg-[#0077B6]'
                : 'bg-white text-black hover:bg-[#0077B6] hover:text-white'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === displayTotalPages}
        className="px-3 py-1 border rounded bg-white text-black disabled:opacity-50"
        aria-label="Next page"
      >
        <ArrowRight />
      </Button>
    </div>
  );
};

export default Pagination;