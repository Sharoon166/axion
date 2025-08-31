'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Package,
  Save,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface Category {
  _id: string;
  name: string;
  slug: string;
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
  specifications?: string;
  shippingInfo?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productSlug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    category: '',
    stock: '0',
    featured: false,
    specifications: '',
    shippingInfo: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (productSlug) {
      fetchProduct();
      fetchCategories();
    }
  }, [productSlug]);

  const fetchProduct = async () => {
    try {
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
            specifications: productData.specifications || '',
            shippingInfo: productData.shippingInfo || ''
          });
          setImages(productData.images || []);
          setColors(productData.colors || []);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await api.categories.getAll();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorToggle = (colorValue: string) => {
    const isSelected = colors.includes(colorValue);
    if (isSelected) {
      setColors(colors.filter(c => c !== colorValue));
    } else {
      setColors([...colors, colorValue]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update images array
    const newImages = [...images];
    newImages[index] = previewUrl;
    setImages(newImages);

    // Store file for upload
    const newFiles = [...newImageFiles];
    newFiles[index] = file;
    setNewImageFiles(newFiles);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    
    // Revoke object URL if it's a blob
    if (newImages[index] && newImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImages[index]);
    }
    
    newImages.splice(index, 1);
    setImages(newImages);

    // Also remove from new files if exists
    const newFiles = [...newImageFiles];
    if (newFiles[index]) {
      newFiles.splice(index, 1);
      setNewImageFiles(newFiles);
    }
  };

  const addImageSlot = () => {
    setImages([...images, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, String(value));
      });

      // Upload new images first
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const file = newImageFiles[i];
        
        if (file) {
          // Upload new file
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
        } else if (image && !image.startsWith('blob:')) {
          // Keep existing image
          uploadedImageUrls.push(image);
        }
      }

      // Add image URLs
      uploadedImageUrls.forEach(url => {
        formDataToSend.append('images', url);
      });

      // Add colors
      colors.forEach(color => {
        formDataToSend.append('colors', color);
      });

      const response = await fetch(`/api/admin/products/${productSlug}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      
      if (response.ok) {
        // Cleanup object URLs
        images.forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Button onClick={() => router.push('/admin/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
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
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                      {image ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={getImageUrl(image)}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
                
                {images.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageSlot}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Another Image
                  </Button>
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

          {/* Colors Section */}
          <Card>
            <CardHeader>
              <CardTitle>Available Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {[
                  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
                  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
                  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
                  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
                  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
                  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
                  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
                  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
                  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
                  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
                  { name: 'Black', value: '#000000', bg: 'bg-black' },
                  { name: 'White', value: '#FFFFFF', bg: 'bg-white border-2 border-gray-300' }
                ].map((color) => (
                  <div key={color.value} className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleColorToggle(color.value)}
                      className={`w-12 h-12 rounded-full ${color.bg} relative transition-all duration-200 hover:scale-110 ${
                        colors.includes(color.value) 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                      }`}
                    >
                      {colors.includes(color.value) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <span className="text-sm text-gray-600 text-center">{color.name}</span>
                  </div>
                ))}
              </div>
              {colors.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  Selected: {colors.length} color{colors.length !== 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specifications">Specifications</Label>
                <Textarea
                  id="specifications"
                  placeholder="Enter product specifications..."
                  rows={3}
                  value={formData.specifications}
                  onChange={(e) => handleInputChange('specifications', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingInfo">Shipping Information</Label>
                <Textarea
                  id="shippingInfo"
                  placeholder="Enter shipping details..."
                  rows={3}
                  value={formData.shippingInfo}
                  onChange={(e) => handleInputChange('shippingInfo', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
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