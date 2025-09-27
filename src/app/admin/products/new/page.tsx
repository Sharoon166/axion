'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import NestedVariantManager from '@/components/admin/NestedVariantManager';
import AddonManager from '@/components/admin/AddonManager';
import { Variant, Addon } from '@/lib/productVariants';

import ImagePreview from '@/components/imagePreview';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: string[]; // optional, used to drive dependent UI
}

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    category: '',
    // Removed stock field - now handled at variant level
    featured: false,
  });
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);

  // Predefined subcategories map for known categories
  const PREDEFINED_SUBCATEGORIES: Record<string, string[]> = {
    'indoor lighting': [
      'Ceiling Lights',
      'Wall Lights',
      'Table Lamps',
      'Floor Lamps',
      'Chandeliers',
      'Pendant Lights',
      'Smart Indoor Lights',
    ],

    'outdoor lighting': [
      'Garden Lights',
      'Wall Mount Lights',
      'Pathway Lights',
      'Flood Lights',
      'Security Lights',
      'String Lights',
    ],

    'solar lighting': [
      'Solar Panels',
      'Solar Street Lights',
      'Solar Garden Lights',
      'Solar Flood Lights',
      'Solar Accessories',
    ],
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      if (typeof window !== 'undefined') {
        router.replace('/');
      }
    }
  }, [authLoading, user, router]);

  const fetchCategories = async () => {
    try {
      const result = await api.categories.getAll();
      if (result.success) {
        setCategories((result.data as Category[]) || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(newFormData);

    // No longer need stock validation - variants have individual stock

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
    }

    if (field === 'category' && typeof value === 'string') {
      const found = categories.find((c) => c.name === value || c.slug === value);
      // Normalize key
      const key = (found?.slug || found?.name || value).toString().toLowerCase().trim();
      // Try direct match
      let mapped = PREDEFINED_SUBCATEGORIES[key];
      // Fallback: include-based heuristics
      if (!mapped) {
        if (key.includes('indoor'))
          mapped =
            PREDEFINED_SUBCATEGORIES['indoor'] || PREDEFINED_SUBCATEGORIES['indoor lighting'];
        else if (key.includes('outdoor'))
          mapped =
            PREDEFINED_SUBCATEGORIES['outdoor'] || PREDEFINED_SUBCATEGORIES['outdoor lighting'];
        else if (key.includes('solar'))
          mapped = PREDEFINED_SUBCATEGORIES['solar'] || PREDEFINED_SUBCATEGORIES['solar lighting'];
        else if (key.includes('light')) mapped = PREDEFINED_SUBCATEGORIES['lighting'];
      }
      const subcats = (
        mapped && Array.isArray(mapped) ? mapped : found?.subcategories || []
      ).filter(Boolean);
      setAvailableSubcats(subcats);
      setSelectedSubcats([]);
    }
  };
  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const validateVariants = (): boolean => {
    // Check if product has at least one variant with stock
    const hasVariants = variants.length > 0 && variants.some((v) => v.options.length > 0);

    if (!hasVariants) {
      toast.error('Please add at least one variant with stock quantity.');
      return false;
    }

    // Check if all variants have stock
    let hasStock = false;
    for (const variant of variants) {
      for (const option of variant.options) {
        if (option.stock > 0) {
          hasStock = true;
          break;
        }
        // Check sub-variants - only process if it's an array of SubVariant objects
        if (option.subVariants && Array.isArray(option.subVariants)) {
          for (const subVariant of option.subVariants) {
            for (const subOption of subVariant.options) {
              if (subOption.stock > 0) {
                hasStock = true;
                break;
              }
              // Check sub-sub-variants
              if (subOption.subSubVariants && Array.isArray(subOption.subSubVariants)) {
                for (const subSubVariant of subOption.subSubVariants) {
                  for (const subSubOption of subSubVariant.options) {
                    if (subSubOption.stock > 0) {
                      hasStock = true;
                      break;
                    }
                  }
                  if (hasStock) break;
                }
              }
              if (hasStock) break;
            }
            if (hasStock) break;
          }
        }
        if (hasStock) break;
      }
      if (hasStock) break;
    }

    if (!hasStock) {
      toast.error('Please set stock quantities for at least one variant option.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate variants before submission
    if (!validateVariants()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value));
      });

      // Upload images first
      const uploadedImageUrls: string[] = [];
      for (const file of selectedFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedImageUrls.push(uploadResult.url);
        }
      }

      // Add uploaded image URLs
      uploadedImageUrls.forEach((url) => {
        formDataToSend.append('images', url);
      });

      // Add variants data as-is (allow color/tag rendering on storefront)
      if (variants.length > 0) {
        formDataToSend.append('variants', JSON.stringify(variants));
      }

      // Add selected subcategories
      if (selectedSubcats.length > 0) {
        formDataToSend.append('subcategories', JSON.stringify(selectedSubcats));
      }

      // Shipping info removed - using static policy sitewide

      // Add addons data (force type to 'checkbox')
      if (addons.length > 0) {
        const coercedAddons = addons.map((a) => ({
          ...a,
          type: 'checkbox' as const,
        }));
        formDataToSend.append('addons', JSON.stringify(coercedAddons));
      }

      // Create product directly without using the API helper to avoid double toasts
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Cleanup object URLs
        previewUrls.forEach((url) => {
          URL.revokeObjectURL(url);
        });

        toast.success('Product created successfully!');
        router.push('/products');
      } else {
        toast.error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  // If still loading auth state, or user is not admin, show nothing or a loading spinner
  if (authLoading || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[85rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product for your catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Images */}
            <ImagePreview
              initialUrls={previewUrls} // from backend product
              onChange={(files, urls) => {
                setSelectedFiles(files); // new files to upload
                setPreviewUrls(urls); // mix of old urls + blob urls
              }}
            />

            {/* Right Column - Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="product-slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      min="0"
                      required
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange('category', val)}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {availableSubcats.length > 0 && (
                  <div className="space-y-2">
                    <Label>Subcategories</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSubcats.map((sc) => {
                        const checked = selectedSubcats.includes(sc);
                        return (
                          <label
                            key={sc}
                            className="flex items-center gap-2 border rounded-md p-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedSubcats((prev) =>
                                  checked ? prev.filter((x) => x !== sc) : [...prev, sc],
                                )
                              }
                            />
                            <span>{sc}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      These are dependent on the category you selected.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange('featured', checked as boolean)}
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nested Variants Manager */}
              <NestedVariantManager variants={variants} onChange={setVariants} />

              {/* Addons Manager */}
              <AddonManager addons={addons} onChange={setAddons} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-fit text-sm bg-(--color-logo) hover:bg-(--color-logo)/90"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 max-w-fit border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Create Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
