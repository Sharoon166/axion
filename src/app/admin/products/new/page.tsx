'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { ArrowLeft, Upload, X, Package, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import VariantManager from '@/components/admin/VariantManager';
import AddonManager from '@/components/admin/AddonManager';
import { Variant, Addon } from '@/lib/productVariants';

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
    stock: '0',
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

  // Shipping & Return policy is now static, so we no longer capture per-product shipping fields
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isStockExceeded, setIsStockExceeded] = useState(false);
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

    // If stock is being updated, validate against current variants
    if (field === 'stock' && variants.length > 0) {
      const mainStock = Number(value) || 0;
      let totalVariantStock = 0;

      variants.forEach((variant) => {
        variant.options.forEach((option) => {
          totalVariantStock += Number(option.stockModifier) || 0;
        });
      });

      if (totalVariantStock > mainStock) {
        toast.error(
          `Total variant quantity (${totalVariantStock}) cannot exceed main product stock (${mainStock})`,
        );
      }
    }

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
        toast.error(`Skipped ${file.name}: Not an image file`);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`Skipped ${file.name}: File is too large (max 5MB)`);
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
    // Revoke object URL if it's a blob
    if (previewUrls[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
  
    // Clone arrays to avoid mutating state directly
    const newPreviews = [...previewUrls];
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
  
    // If this was a newly selected file, remove from selectedFiles too
    if (previewUrls[index]?.startsWith('blob:')) {
      const newFiles = [...selectedFiles];
      // Find corresponding file by index of blob
      const blobIndexes = previewUrls
        .map((url, i) => (url.startsWith('blob:') ? i : -1))
        .filter((i) => i !== -1);
  
      const fileIndex = blobIndexes.indexOf(index);
      if (fileIndex !== -1) {
        newFiles.splice(fileIndex, 1);
        setSelectedFiles(newFiles);
      }
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

  const validateVariantQuantities = (): boolean => {
    if (variants.length === 0) return true;

    const mainStock = Number(formData.stock) || 0;
    let totalVariantStock = 0;

    // Calculate total stock from all variants
    variants.forEach((variant) => {
      variant.options.forEach((option) => {
        totalVariantStock += Number(option.stockModifier) || 0;
      });
    });

    if (totalVariantStock > mainStock) {
      toast.error(
        `Total variant quantity (${totalVariantStock}) cannot exceed main product stock (${mainStock})`,
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate variant quantities before submission
    if (!validateVariantQuantities()) {
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
        router.push('/admin/products');
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
                        {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
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
                    <h4 className="font-medium text-gray-700">Image Previews</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
                            <Image
                              src={url}
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
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {selectedFiles[index]?.name}
                          </p>
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
                      step="1"
                      min="0"
                      required
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
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
              {/* Variants Manager */}
              <VariantManager
                variants={variants}
                onChange={setVariants}
                mainStock={Number(formData.stock) || 0}
                onStockExceeded={setIsStockExceeded}
              />

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
              disabled={loading || isStockExceeded}
              title={isStockExceeded ? 'Total variant quantity exceeds main product stock' : ''}
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
