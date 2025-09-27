'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  Search,
  Plus,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { api, Product } from '@/lib/api';
import Loading from '@/loading';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Fetch products with current filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await api.products.getAll({
          page: currentPage,
          limit: itemsPerPage,
          sort: sortBy,
          order: sortOrder,
          search: searchQuery
        });
        
        if (result.success && result.data) {
          setProducts(result.data.data || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalItems(result.data.pagination?.totalItems || 0);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, sortBy, sortOrder, searchQuery, itemsPerPage]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          <div>

            <Loading />
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
              <div key={product._id} className="space-y-2">
                <ProductCard
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images || []}
                  href={`/product/${product.slug}`}
                  rating={product.rating}
                />
                
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="mt-6">
            <div className="mb-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        {!loading && filteredAndSortedProducts.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
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

        {!loading && totalPages > 1 && (
          <div className="mt-6">
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}