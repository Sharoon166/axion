'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';

import { Package, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
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
  colors?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductsManagement() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  console.log(setStatusFilter)
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
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const inStock = (p.stock || 0) > 0;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'featured' && p.featured) ||
        (statusFilter === 'in-stock' && inStock) ||
        (statusFilter === 'out-of-stock' && !inStock);

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Get current products
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
      setProducts(products.filter((p) => p.slug !== productSlug));
      return result;
    })();

    toast.promise(promise, {
      success: 'Product deleted successfully!',
      error: 'Failed to delete product',
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Create and manage your products</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.isAdmin && (
            <>
              <Link href="/admin/products/new" className="w-full sm:w-auto">
                <Button className="bg-[#0077B6] hover:bg-[#0077B6]/90 w-full sm:w-auto">
                  Add Product
                </Button>
              </Link>
              <Link href="/sale" className="w-full sm:w-auto">
                <Button className="bg-[#0077B6] hover:bg-[#0077B6]/90 w-full sm:w-auto">
                  Add Sale
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Products Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>

            <div
              className={`${mobileFiltersOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-4`}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

            </div>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
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
                    currentProducts.map((productItem) => (
                      <tr
                        key={productItem._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
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
                        <td className="py-4 px-2">
                          <div className="w-50">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {productItem.name}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">{productItem.slug}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 capitalize">
                          {productItem.category?.name || 'Uncategorized'}
                        </td>
                      
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          Rs.{productItem.price?.toLocaleString()}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/products/${productItem.slug}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(productItem.slug)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Add your first product to get started</p>
                  </div>
                ) : (
                  filteredProducts.map((productItem) => (
                    <Card key={productItem._id} className="overflow-hidden">
                      <div className="h-32 bg-gray-100 overflow-hidden relative">
                        <Image
                          src={getImageUrl(productItem.images[0])}
                          alt={productItem.name}
                          fill
                          className="object-cover"
                        />
                        {productItem.featured && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className=" px-2 sm:p-4">
                        <div className="flex items-start gap-2 sm:items-center flex-col sm:flex-row mb-2">
                          <h3 className="font-semibold line-clamp-2 sm:line-clamp-none text-md sm:text-lg">
                            {productItem.name}
                          </h3>
                          <span className="font-semibold text-gray-900">
                            Rs.{productItem.price?.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {productItem.category?.name || 'Uncategorized'}
                        </p>
                        <div className="mb-4">
                          <Badge
                            className={`${productItem.stock > 10 ? 'bg-green-100 text-green-800' : productItem.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} capitalize`}
                          >
                            {productItem.stock} in stock
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/${productItem.slug}/edit`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(productItem.slug)}
                            className="flex-1"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > itemsPerPage && (
            <div className="mt-6 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
