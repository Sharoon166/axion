"use client";

import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded bg-white text-black disabled:opacity-50"
      >
        <ArrowLeft/>
      </Button>

      {[...Array(totalPages)].map((_, index) => {
        const page = index + 1;
        return (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 border rounded ${
              page === currentPage ? "bg-[#0077B6] text-white hover:bg-[#0077B6]" : " bg-black text-white hover:bg-black"
            }`}
          >
            {page}
          </Button>
        );
      })}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded bg-white text-black disabled:opacity-50"
      >
        <ArrowRight/>
      </Button>
    </div>
  );
};

export default Pagination;
