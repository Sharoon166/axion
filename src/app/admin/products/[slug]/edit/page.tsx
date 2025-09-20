'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X, Package, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Loading from '@/loading';
import { useAuth } from '@/contexts/AuthContext';
import VariantManager from '@/components/admin/VariantManager';
import AddonManager from '@/components/admin/AddonManager';
import { Variant, Addon } from '@/lib/productVariants';

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
    stock: '0',
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
            stock: productData.stock?.toString() || '0',
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
      const found = categories.find((c) => c.name === formData.category || c.slug === formData.category);
      if (found) {
        const key = (found.slug || found.name).toLowerCase().trim();
        let mapped = PREDEFINED_SUBCATEGORIES[key];
        if (!mapped) {
          if (key.includes('indoor')) mapped = PREDEFINED_SUBCATEGORIES['indoor'] || PREDEFINED_SUBCATEGORIES['indoor lighting'];
          else if (key.includes('outdoor')) mapped = PREDEFINED_SUBCATEGORIES['outdoor'] || PREDEFINED_SUBCATEGORIES['outdoor lighting'];
          else if (key.includes('solar')) mapped = PREDEFINED_SUBCATEGORIES['solar'] || PREDEFINED_SUBCATEGORIES['solar lighting'];
          else if (key.includes('light')) mapped = PREDEFINED_SUBCATEGORIES['lighting'];
        }
        const subcats = (mapped && Array.isArray(mapped) ? mapped : found.subcategories || [])
          .filter(Boolean);
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // When category changes, update available subcategories and reset selection
    if (field === 'category' && typeof value === 'string') {
      const found = categories.find((c) => c.name === value || c.slug === value);
      // Normalize key
      const key = (found?.slug || found?.name || value).toString().toLowerCase().trim();
      // Try direct match
      let mapped = PREDEFINED_SUBCATEGORIES[key];
      // Fallback: include-based heuristics
      if (!mapped) {
        if (key.includes('indoor')) mapped = PREDEFINED_SUBCATEGORIES['indoor'] || PREDEFINED_SUBCATEGORIES['indoor lighting'];
        else if (key.includes('outdoor')) mapped = PREDEFINED_SUBCATEGORIES['outdoor'] || PREDEFINED_SUBCATEGORIES['outdoor lighting'];
        else if (key.includes('solar')) mapped = PREDEFINED_SUBCATEGORIES['solar'] || PREDEFINED_SUBCATEGORIES['solar lighting'];
        else if (key.includes('light')) mapped = PREDEFINED_SUBCATEGORIES['lighting'];
      }
      const subcats = (mapped && Array.isArray(mapped) ? mapped : found?.subcategories || [])
        .filter(Boolean);
      setAvailableSubcats(subcats);
      setSelectedSubcats([]);
    }
  };

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error(`Skipped ${file.name}: Not an image file`);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error(`Skipped ${file.name}: File is too large (max 5MB)`);
        return;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }

    // Reset the input to allow selecting the same file again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }

    // Check if we're removing an existing image or a newly added one
    const isExistingImage = index < previewUrls.length - selectedFiles.length;
    
    if (isExistingImage) {
      // For existing images, just remove from preview (will be removed from DB on submit)
      const newPreviews = [...previewUrls];
      newPreviews.splice(index, 1);
      setPreviewUrls(newPreviews);
    } else {
      // For new images, remove from both selectedFiles and previewUrls
      const newFiles = [...selectedFiles];
      const newPreviews = [...previewUrls];
      const fileIndex = index - (previewUrls.length - selectedFiles.length);
      
      // Revoke the URL before removing
      if (previewUrls[index]?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrls[index]);
      }
      
      newFiles.splice(fileIndex, 1);
      newPreviews.splice(index, 1);
      
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
    }
  };

  const clearAllImages = () => {
    // Revoke all object URLs to prevent memory leaks
    previewUrls.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const existingImageUrls = previewUrls.filter(url => 
        url && !url.startsWith('blob:')
      );
      
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

      // Add variants and addons if they exist
      if (variants && variants.length > 0) {
        // Filter out any empty or invalid variants
        const validVariants = variants.filter(
          (v) => v.name && v.options && v.options.length > 0
        );
        if (validVariants.length > 0) {
          formDataToSend.append('variants', JSON.stringify(validVariants));
        }
      }

      if (addons && addons.length > 0) {
        // Filter out any empty or invalid addons
        const validAddons = addons.filter(
          (a) => a.name && a.options && a.options.length > 0
        );
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
        router.push('/admin/products');
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
      <Loading />
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">{error}</div>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
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
    <div className="min-h-screen bg-gray-50 p-6">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Image Upload */}
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> multiple images
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Action Buttons */}
                  {selectedFiles.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {selectedFiles.length} new image{selectedFiles.length !== 1 ? 's' : ''}{' '}
                        selected
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAllImages}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Current Images</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
                            <Image
                              src={url.startsWith('blob:') ? url : getImageUrl(url)}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          {selectedFiles[index] && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {selectedFiles[index]?.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
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
              <VariantManager variants={variants} onChange={setVariants} />
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
              disabled={saving || !formData.name || !formData.price}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
