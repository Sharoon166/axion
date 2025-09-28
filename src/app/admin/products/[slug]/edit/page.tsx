'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import Loading from '@/loading';
import { useAuth } from '@/contexts/AuthContext';
import NestedVariantManager from '@/components/admin/NestedVariantManager';
import AddonManager from '@/components/admin/AddonManager';
import { Variant, Addon } from '@/lib/productVariants';
import { toast } from 'sonner';
import ImagePreview from '@/components/imagePreview';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  category: Category | null;
  stock: number;
  featured: boolean;
  images: string[];
  colors?: string[];
  variants?: Variant[];
  addons?: Addon[];
  specifications?: { name: string; value: string }[];
  shipping?: {
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    freeShipping?: boolean;
    shippingCost?: number;
    estimatedDelivery?: string;
    returnPolicy?: string;
  };
}

// Predefined subcategories map for known categories (module scope so hooks don't depend on it)
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

export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productSlug = params.slug as string;

  const [saving, setSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setProduct] = useState<Product | null>(null);
  const [availableSubcats, setAvailableSubcats] = useState<string[]>([]);
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    category: '',
    // Removed stock field - now handled at variant level
    featured: false,
  });
  const [specifications, setSpecifications] = useState<{ name: string; value: string }[]>([
    { name: '', value: '' },
  ]);
  // Shipping & Return policy is now static sitewide; per-product shipping fields removed
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  // Removed stock validation - variants have individual stock
  const [addons, setAddons] = useState<Addon[]>([]);

  const fetchProduct = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const response = await fetch(`/api/admin/products/${productSlug}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const productData = result.data;
          setProduct(productData);
          setFormData({
            name: productData.name || '',
            slug: productData.slug || '',
            price: productData.price?.toString() || '',
            description: productData.description || '',
            category: productData.category?.name || '',
            // Removed stock field - now handled at variant level
            featured: productData.featured || false,
          });
          setSpecifications(productData.specifications || [{ name: '', value: '' }]);
          setPreviewUrls(
            (productData.images || []).filter((url: string) => !url.startsWith('blob:')),
          );
          setColors(productData.colors || []);
          setSizes(productData.sizes || []);
          setVariants(productData.variants || []);
          setAddons(productData.addons || []);

      
          if (productData.subcategories) {
            setSelectedSubcats(productData.subcategories);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product. Please try again.');
    } finally {
      setIsPageLoading(false);
    }
  }, [productSlug]);
  useEffect(() => {
    if (productSlug) {
      fetchProduct();
      fetchCategories();
    }
  }, [fetchProduct, productSlug]);

  // Update available subcategories when categories or product category changes
  useEffect(() => {
    if (formData.category) {
      const found = categories.find(
        (c) => c.name === formData.category || c.slug === formData.category,
      );
      if (found) {
        const key = (found.slug || found.name).toLowerCase().trim();
        let mapped = PREDEFINED_SUBCATEGORIES[key];
        if (!mapped) {
          if (key.includes('indoor'))
            mapped =
              PREDEFINED_SUBCATEGORIES['indoor'] || PREDEFINED_SUBCATEGORIES['indoor lighting'];
          else if (key.includes('outdoor'))
            mapped =
              PREDEFINED_SUBCATEGORIES['outdoor'] || PREDEFINED_SUBCATEGORIES['outdoor lighting'];
          else if (key.includes('solar'))
            mapped =
              PREDEFINED_SUBCATEGORIES['solar'] || PREDEFINED_SUBCATEGORIES['solar lighting'];
          else if (key.includes('light')) mapped = PREDEFINED_SUBCATEGORIES['lighting'];
        }
        const subcats = (
          mapped && Array.isArray(mapped) ? mapped : found.subcategories || []
        ).filter(Boolean);
        setAvailableSubcats(subcats);
      }
    }
  }, [categories, formData.category]);

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

  // (constants moved to module scope)

  // Removed stock validation - variants have individual stock

  const handleInputChange = (field: string, value: string | boolean) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(newFormData);

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

    setSaving(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value));
      });

      // Add subcategories
      selectedSubcats.forEach((subcat, index) => {
        formDataToSend.append(`subcategories[${index}]`, subcat);
      });

      // Only keep existing non-blob URLs (already uploaded images)
      const existingImageUrls = previewUrls.filter((url) => url && !url.startsWith('blob:'));

      const uploadedImageUrls = [...existingImageUrls];

      // Upload only the newly selected files
      for (const file of selectedFiles) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to upload file');
          }

          const uploadResult = await uploadResponse.json();
          if (uploadResult.url) {
            uploadedImageUrls.push(uploadResult.url);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          throw error; // Re-throw to be caught by the outer try-catch
        }
      }

      // Add all image URLs (existing + newly uploaded)
      uploadedImageUrls.forEach((url) => {
        formDataToSend.append('images', url);
      });

      // Add colors
      colors.forEach((color) => {
        formDataToSend.append('colors', color);
      });

      // Add sizes
      sizes.forEach((size) => {
        formDataToSend.append('sizes', size);
      });

      // Handle variants - always send the variants array, even if empty (to handle deletions)
      const validVariants =
        variants && variants.length > 0
          ? variants.filter((v) => v.name && v.options && v.options.length > 0)
          : [];
      formDataToSend.append('variants', JSON.stringify(validVariants));

      if (addons && addons.length > 0) {
        // Filter out any empty or invalid addons
        const validAddons = addons.filter((a) => a.name && a.options && a.options.length > 0);
        if (validAddons.length > 0) {
          formDataToSend.append('addons', JSON.stringify(validAddons));
        }
      }

      // Add specifications
      const validSpecs = specifications.filter((spec) => spec.name && spec.value);
      formDataToSend.append('specifications', JSON.stringify(validSpecs));

      // Shipping info removed - using static policy sitewide

      // Send the update request
      const response = await fetch(`/api/admin/products/${productSlug}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Cleanup object URLs
        previewUrls.forEach((url: string) => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        // Replace previews with only valid Cloudinary URLs just submitted
        setPreviewUrls(uploadedImageUrls);
        setSelectedFiles([]);

        const { toast } = await import('sonner');
        toast.success('Product updated successfully!');
        router.push('/products');
      } else {
        const { toast } = await import('sonner');
        toast.error(result.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      const { toast } = await import('sonner');
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (isPageLoading || authLoading) {
    return (
      <div className="min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">{error}</div>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!authLoading && user?.role !== 'admin') {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return <div className="p-8 text-center text-red-500">Not authorized</div>;
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-[85rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update product information</p>
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
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </div>

                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {availableSubcats.length > 0 && (
                  <div className="space-y-2">
                    <Label>Subcategories</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSubcats.map((subcat) => (
                        <div key={subcat} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subcat-${subcat}`}
                            checked={selectedSubcats.includes(subcat)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubcats([...selectedSubcats, subcat]);
                              } else {
                                setSelectedSubcats(selectedSubcats.filter((sc) => sc !== subcat));
                              }
                            }}
                          />
                          <label
                            htmlFor={`subcat-${subcat}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {subcat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
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

          {/* Variants & Add-ons */}
          <Card>
            <CardHeader>
              <CardTitle>Variants & Add-ons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <NestedVariantManager variants={variants} onChange={setVariants} />
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
              disabled={saving}
            >
              {saving ? (
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
