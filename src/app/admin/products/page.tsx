'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Loading from '@/loading';

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

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await api.products.getAll();
      if (result.success) {
        setProducts(result.data as Product[] || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
 {
      const result = await api.products.delete(slug);
      if (result.success) {
        setProducts(products.filter(p => p.slug !== slug));
      }
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'name') {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-2">Manage your product catalog</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/products/new')}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-2"
                >
                  Name {getSortIcon('name')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('price')}
                  className="flex items-center gap-2"
                >
                  Price {getSortIcon('price')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('stock')}
                  className="flex items-center gap-2"
                >
                  Stock {getSortIcon('stock')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className='flex justify-center items-center h-[70rem]'>

         <Loading/>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/admin/products/new')}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {product.featured && (
                      <Badge className="absolute top-2 left-2 bg-blue-600">
                        Featured
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/product/${product.slug}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price?.toFixed(2)}
                      </span>
                      <Badge 
                        variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}
                      >
                        {product.stock} in stock
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/products/${product.slug}/edit`)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.slug)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredAndSortedProducts.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredAndSortedProducts.length}</p>
                  <p className="text-sm text-gray-500">Total Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ${filteredAndSortedProducts.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total Value</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredAndSortedProducts.reduce((sum, p) => sum + (p.stock || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Stock</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredAndSortedProducts.filter(p => p.featured).length}
                  </p>
                  <p className="text-sm text-gray-500">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}