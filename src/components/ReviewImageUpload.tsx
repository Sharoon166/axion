'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

type ReviewImageUploadProps = {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  initialImages?: string[];
};

export function ReviewImageUpload({ 
  onImagesChange, 
  maxImages = 3, 
  initialImages = [] 
}: ReviewImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
    formData.append('folder', 'reviews');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files).slice(0, maxImages - images.length);
    
    if (files.length + images.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      
      const newImages = [...images, ...validUrls];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <div className="w-20 h-20 rounded-md overflow-hidden border">
              <Image
                src={img}
                alt={`Review image ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                removeImage(index);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <div className="text-center p-2">
              {isUploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto"></div>
              ) : (
                <>
                  <Upload className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                  <span className="text-xs text-gray-500">Add {maxImages - images.length} more</span>
                </>
              )}
            </div>
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Add up to {maxImages} images (optional)
      </p>
    </div>
  );
}
