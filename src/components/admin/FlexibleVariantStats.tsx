'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Package, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface VariantStats {
  totalProducts: number;
  productsWithVariants: number;
  productsWithFlexibleVariants: number;
  totalVariants: number;
  totalOptions: number;
  totalCustomProperties: number;
  totalSKUs: number;
  legacyProducts: number;
}

const FlexibleVariantStats: React.FC = () => {
  const [stats, setStats] = useState<VariantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariantStats();
  }, []);

  const fetchVariantStats = async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      
      if (result.success && result.data) {
        const products = result.data;
        
        const stats: VariantStats = {
          totalProducts: products.length,
          productsWithVariants: 0,
          productsWithFlexibleVariants: 0,
          totalVariants: 0,
          totalOptions: 0,
          totalCustomProperties: 0,
          totalSKUs: 0,
          legacyProducts: 0
        };

        products.forEach((product: { colors?: string[]; sizes?: string[]; variants?: Array<{ options?: Array<{ sku?: string; customProperties?: Record<string, unknown>; stock?: number }> }> }) => {
          // Check for legacy color/size arrays
          if ((product.colors && product.colors.length > 0) || 
              (product.sizes && product.sizes.length > 0)) {
            stats.legacyProducts++;
          }

          // Check for variants
          if (product.variants && product.variants.length > 0) {
            stats.productsWithVariants++;
            stats.totalVariants += product.variants.length;
            
            let hasCustomProperties = false;
            
            product.variants.forEach((variant) => {
              if (variant.options && variant.options.length > 0) {
                stats.totalOptions += variant.options.length;
                
                variant.options.forEach((option) => {
                  if (option.sku) {
                    stats.totalSKUs++;
                  }
                  
                  if (option.customProperties && Object.keys(option.customProperties).length > 0) {
                    stats.totalCustomProperties += Object.keys(option.customProperties).length;
                    hasCustomProperties = true;
                  }
                });
              }
            });
            
            if (hasCustomProperties) {
              stats.productsWithFlexibleVariants++;
            }
          }
        });

        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching variant stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Flexible Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Flexible Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load variant statistics</p>
        </CardContent>
      </Card>
    );
  }

  const flexibleAdoptionRate = stats.totalProducts > 0 
    ? Math.round((stats.productsWithFlexibleVariants / stats.totalProducts) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Flexible Variants System
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.productsWithFlexibleVariants}</div>
            <div className="text-xs text-gray-600">Enhanced Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{flexibleAdoptionRate}%</div>
            <div className="text-xs text-gray-600">Adoption Rate</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Total Products
            </span>
            <Badge variant="outline">{stats.totalProducts}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              With Variants
            </span>
            <Badge variant="outline">{stats.productsWithVariants}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              Custom Properties
            </span>
            <Badge variant="outline">{stats.totalCustomProperties}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-600" />
              Total SKUs
            </span>
            <Badge variant="outline">{stats.totalSKUs}</Badge>
          </div>
        </div>

        {/* Migration Alert */}
        {stats.legacyProducts > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{stats.legacyProducts} products need migration</span>
            </div>
            <Link href="/admin/migrate-variants" className="mt-2 inline-block">
              <Button size="sm" variant="outline" className="text-xs">
                Migrate Now
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="flex-1">
            <Button size="sm" className="w-full text-xs">
              Add Product
            </Button>
          </Link>
          <Link href="/admin/migrate-variants" className="flex-1">
            <Button size="sm" variant="outline" className="w-full text-xs">
              Manage Variants
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlexibleVariantStats;