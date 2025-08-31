'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface BaseFormProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; data?: any; error?: string }>;
  onSuccess?: () => void;
  triggerText: string;
  className?: string;
}

export default function BaseForm({
  title,
  description,
  icon,
  color,
  children,
  onSubmit,
  onSuccess,
  triggerText,
  className = '',
}: BaseFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormAction = async (formData: FormData) => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await onSubmit(formData);

      if (result?.success) {
        setOpen(false);
        toast.success('Item added successfully');
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result?.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`flex items-center gap-2 ${className}`}>
          <Plus className="w-4 h-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0">
        <div className={`${color} h-2 w-full`}></div>
        <div className="p-6">
          <DialogHeader className="flex flex-row items-start gap-4 pb-4">
            <div className={`p-2 rounded-md ${color} text-white`}>{icon}</div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <form className="space-y-6" action={handleFormAction}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">{children}</div>
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {triggerText}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Shared form field components
export function FormField({
  name,
  label,
  type,
  required = false,
  options,
  placeholder,
  icon,
  value,
  onChange,
  error,
  min,
  max,
  step,
}: {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  value: string | number | boolean;
  onChange: (name: string, value: string | number | boolean) => void;
  error?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number | boolean) => {
    if (typeof e === 'object' && e !== null && 'target' in e) {
      // Handle DOM event
      const { type } = e.target;
      let value: string | number | boolean;

      if (type === 'checkbox') {
        value = (e.target as HTMLInputElement).checked;
      } else if (type === 'number') {
        // For number inputs, we'll keep it as a string to match formData types
        value = e.target.value;
      } else {
        value = e.target.value;
      }
      
      onChange(name, value);
    } else {
      // Handle direct value
      onChange(name, e);
    }
  };

  switch (type) {
    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={name} className="flex items-center gap-1">
            {icon}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={name}
            value={String(value)}
            onChange={handleChange}
            required={required}
            placeholder={placeholder}
            className="min-h-[100px]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={name} className="flex items-center gap-1">
            {icon}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select value={String(value)} onValueChange={(value) => handleChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2 p-2 border rounded-md">
          <input
            type="checkbox"
            id={name}
            checked={Boolean(value)}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor={name} className="cursor-pointer">
            {label}
          </Label>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={name} className="flex items-center gap-1">
            {icon}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {type === 'number' ? (
            <Input
              id={name}
              name={name}
              type="number"
              placeholder={placeholder}
              value={value as string | number}
              onChange={(e) => onChange(name, e.target.value)}
              className="w-full"
              min={min}
              max={max}
              step={step}
            />
          ) : (
            <Input
              id={name}
              type={type}
              value={String(value)}
              onChange={handleChange}
              required={required}
              placeholder={placeholder}
            />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
  }
}

// File upload component
export function FileUploadField({
  name,
  label,
  required = false,
  icon,
  onFileChange,
  uploadedImages,
  onRemoveImage,
}: {
  name: string;
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedImages: string[];
  onRemoveImage: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {icon}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={onFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click or drag images to select</p>
          <p className="text-xs text-muted-foreground">Supports JPG, PNG up to 5MB</p>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Selected Images:</p>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <div className="relative w-full h-full rounded-md overflow-hidden border">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100px, 150px"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
