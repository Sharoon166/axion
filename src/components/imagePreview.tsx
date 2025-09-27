'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from './ui/card';
import Image from 'next/image';

interface PreviewFile {
  id: string; // Add unique ID
  file?: File;
  url: string;
  name: string;
  isInitial?: boolean;
}

interface ImagePreviewProps {
  initialUrls?: string[];
  onChange?: (files: File[], urls: string[]) => void;
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ImagePreview({ initialUrls = [], onChange }: ImagePreviewProps) {
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>(() => {
    return initialUrls.map((url, index) => ({
      id: generateId(),
      url,
      name: `Image ${index + 1}`,
      isInitial: true,
    }));
  });

  const prevFilesRef = useRef<PreviewFile[]>([]);

  // Handle onChange calls in effect to avoid render-time state updates
  useEffect(() => {
    // Only call onChange if files actually changed
    if (onChange && JSON.stringify(prevFilesRef.current) !== JSON.stringify(previewFiles)) {
      const files = previewFiles.filter((pf) => pf.file).map((pf) => pf.file!);
      const urls = previewFiles.map((pf) => pf.url);
      onChange(files, urls);
      prevFilesRef.current = previewFiles;
    }
  }, [previewFiles, onChange]);

  // Handle dropped files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mapped = acceptedFiles.map((file) => ({
      id: generateId(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isInitial: false,
    }));

    setPreviewFiles((prev) => [...prev, ...mapped]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
  });

  const removeImage = useCallback((id: string) => {
    setPreviewFiles((prev) => {
      const fileToRemove = prev.find((pf) => pf.id === id);

      // Cleanup blob URL if it's not an initial URL
      if (fileToRemove && !fileToRemove.isInitial && fileToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      return prev.filter((pf) => pf.id !== id);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewFiles.forEach((pf) => {
        if (!pf.isInitial && pf.url.startsWith('blob:')) {
          URL.revokeObjectURL(pf.url);
        }
      });
    };
  }, [previewFiles]);

  return (
    <Card className="p-4">
      <div>
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">Drag & drop images here, or click to select</p>
        </div>

        {/* Previews */}
        {previewFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewFiles.map((pf) => (
              <div key={pf.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg border overflow-hidden">
                  <Image
                    src={pf.url}
                    alt={pf.name}
                    height={100}
                    width={100}
                    className="object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(pf.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{pf.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
