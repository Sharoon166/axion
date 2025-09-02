'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Package, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  images: string[];
  description?: string;
  featured: boolean;
  rating: number;
  numReviews: number;
  colors?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductsManagement() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    price: '',
    description: '',
    stock: 1,
    featured: false,
    images: [''],
    colors: [] as string[]
  });


  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const result = await response.json();
          const products = result.success ? result.data : [];
          setProducts(products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();

    data.append('name', formData.name);
    data.append('slug', formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'));
    data.append('category', formData.category);
    data.append('price', formData.price);
    data.append('description', formData.description);
    data.append('stock', formData.stock.toString());
    data.append('featured', formData.featured.toString());

    // Handle images array
    formData.images.forEach((image) => {
      if (image) data.append('images', image);
    });

    // Handle colors array
    formData.colors.forEach((color) => {
      if (color) data.append('colors', color);
    });

    try {
      if (editingProduct) {
        await api.products.update(editingProduct._id, data);
      } else {
        await api.products.create(data);
      }

      // Refresh products list
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        const updatedProducts = result.success ? result.data : [];
        setProducts(updatedProducts);
      }

      // Reset form
      setFormData({
        name: '', slug: '', category: '', price: '', description: '',
        stock: 1, featured: false, images: [''], colors: []
      });
      setShowAddDialog(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };


  // Handle delete
  const handleDelete = async (productSlug: string) => {
    const promise = (async () => {
      const response = await fetch(`/api/products/${productSlug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      const result = await response.json();
      setProducts(products.filter(p => p.slug !== productSlug));
      return result;
    })();

    toast.promise(promise, {
      success: 'Product deleted successfully!',
      error: 'Failed to delete product',
    });

  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
        </div>
        <div className="flex gap-3">
          {user?.isAdmin && (
            <>
              <Link href="/admin/products/new">
                <Button className="bg-blue-600 hover:bg-blue-700">Add Product</Button>
              </Link>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Quick Add</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'Update product details' : 'Create a new product'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left side - Image upload area */}
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                            {formData.images[0] ? (
                              <Image src={getImageUrl(formData.images[0])} alt="Product" width={200} height={200} className="object-cover rounded" />
                            ) : (
                              <Package className="w-16 h-16 text-gray-400" />
                            )}
                          </div>
                          <Input
                            type="url"
                            placeholder="Enter image URL"
                            value={formData.images[0] || ''}
                            onChange={(e) => setFormData({ ...formData, images: [e.target.value, ...formData.images.slice(1)] })}
                          />
                        </div>

                        {/* Additional image thumbnails */}
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={`thumbnail-${i}`} className="aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                              {formData.images[0] && (
                                <Image
                                  src={getImageUrl(formData.images[0])}
                                  alt={`Thumbnail ${i}`}
                                  width={80}
                                  height={80}
                                  className="object-cover rounded w-full h-full"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side - Form fields */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <Input
                              required
                              placeholder="Enter Product Name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                            <Input
                              placeholder="product-slug"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <Input
                              placeholder="Enter Product Category"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <Input
                              type="number"
                              placeholder="Enter Product Price"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <Textarea
                            placeholder="Enter Product Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Available Colors</label>
                          <div className="grid grid-cols-6 gap-3">
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
                              <div key={color.value} className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isSelected = formData.colors.includes(color.value);
                                    if (isSelected) {
                                      setFormData({
                                        ...formData,
                                        colors: formData.colors.filter(c => c !== color.value)
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        colors: [...formData.colors, color.value]
                                      });
                                    }
                                  }}
                                  className={`w-8 h-8 rounded-full ${color.bg} relative transition-all duration-200 hover:scale-110 ${formData.colors.includes(color.value)
                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                    : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                                    }`}
                                >
                                  {formData.colors.includes(color.value) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                                <span className="text-xs text-gray-600 text-center">{color.name}</span>
                              </div>
                            ))}
                          </div>
                          {formData.colors.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              Selected: {formData.colors.length} color{formData.colors.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({ ...formData, stock: Math.max(0, formData.stock - 1) })}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                className="w-20 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Product</label>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id="featured"
                                checked={formData.featured}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                className="rounded"
                              />
                              <label htmlFor="featured" className="text-sm text-gray-700">
                                Mark as featured product
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Products Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Featured</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm">Add your first product to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((productItem) => (
                        <tr key={productItem._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={getImageUrl(productItem.images[0])}
                                alt={productItem.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{productItem.name}</p>
                              <p className="text-sm text-gray-500">{productItem.slug}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 capitalize">{productItem.category?.name || 'Uncategorized'}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${productItem.stock > 10 ? 'bg-green-100 text-green-800' :
                              productItem.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {productItem.stock} in stock
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-gray-900">Rs.{productItem.price?.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            {productItem.featured ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Featured</span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-semibold text-blue-600">
                            Rs.{((productItem.price || 0) * (productItem.stock || 0)).toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/products/${productItem.slug}/edit`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(productItem.slug)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Product Worth */}
              <div className="mt-6 flex justify-end">
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    Total Product Worth: <span className="text-blue-600">
                      Rs.{filteredProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}