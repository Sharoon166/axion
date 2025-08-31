'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { useActions } from '@/hooks/useActions';
import { getImageUrl } from '@/lib/utils';

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
  createdAt: string;
  updatedAt: string;
}

export default function ProductsManagement() {
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
    images: ['']
  });
  const { product } = useActions();

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
    formData.images.forEach((image, index) => {
      if (image) data.append('images', image);
    });

    try {
      if (editingProduct) {
        await product.update(editingProduct._id, data);
      } else {
        await product.create(data);
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
        stock: 1, featured: false, images: ['']
      });
      setShowAddDialog(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // Handle edit
  const handleEdit = (productItem: Product) => {
    setEditingProduct(productItem);
    setFormData({
      name: productItem.name || '',
      slug: productItem.slug || '',
      category: productItem.category?.name || '',
      price: productItem.price?.toString() || '',
      description: productItem.description || '',
      stock: productItem.stock || 1,
      featured: productItem.featured || false,
      images: productItem.images.length > 0 ? productItem.images : ['']
    });
    setShowAddDialog(true);
  };

  // Handle delete
  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await product.delete(productId);
        setProducts(products.filter(p => p._id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">Add Product</Button>
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
                        onChange={(e) => setFormData({...formData, images: [e.target.value, ...formData.images.slice(1)]})}
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
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <Input
                          placeholder="product-slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <Input
                          placeholder="Enter Product Category"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <Input
                          type="number"
                          placeholder="Enter Product Price"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Textarea
                        placeholder="Enter Product Description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData({...formData, stock: Math.max(0, formData.stock - 1)})}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                            className="w-20 text-center"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData({...formData, stock: formData.stock + 1})}
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
                            onChange={(e) => setFormData({...formData, featured: e.target.checked})}
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
                    {editingProduct ? 'Update Product' : 'Create Custom Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="destructive">Delete Product</Button>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              productItem.stock > 10 ? 'bg-green-100 text-green-800' :
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(productItem)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(productItem._id)}
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