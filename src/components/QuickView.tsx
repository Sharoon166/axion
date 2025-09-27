'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import type { SelectedVariant, ProductConfiguration, Variant } from '@/lib/productVariants';
import { calculateAvailableStock } from '@/lib/productVariants';
import VariantSelector from '@/components/VariantSelector';
import { toast } from 'sonner';

interface ProductVariantOption {
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  specifications: Array<{ name: string; value: string }>;
  _id: string;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
}

interface ProductVariant {
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: ProductVariantOption[];
  _id: string;
}

interface QuickViewProps {
  product: {
    slug: string;
    _id: string;
    name: string;
    price: number;
    description?: string;
    images: string[];
    category?: {
      name: string;
      slug?: string;
    };
    inStock: boolean;
    stock?: number;
    rating?: number;
    numReviews?: number;
    variants?: ProductVariant[];
    saleInfo?: {
      discountPercent: number;
      endsAt: string;
      saleName: string;
    };
    featured?: boolean;
    discount?: number;
  } | null;
  onClose: () => void;
}

const QuickView: React.FC<QuickViewProps> = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  // Always accept updates from EnhancedVariantSelector, including sub-variants
  const handleVariantChange = (updated: SelectedVariant[]) => {
    if (!product?.variants) return;
    setSelectedVariants(updated);
  };

  // Compute available stock for the selected path (like product page)
  const availableStock = useMemo(() => {
    if (!product) return 0;
    const configuration: ProductConfiguration = {
      variants: (product.variants as Variant[]) || [],
      addons: [],
      basePrice: product.price,
      selectedVariants: selectedVariants,
      selectedAddons: [],
    };
    try {
      return calculateAvailableStock(configuration);
    } catch {
      // fallback to legacy flags if calculation fails
      if (typeof product.stock === 'number') return product.stock;
      return product.inStock ? 999 : 0;
    }
  }, [product, selectedVariants]);

  const isInStock = availableStock > 0;

  // Auto-select single variant options if they have only one option
  React.useEffect(() => {
    if (!product?.variants) return;

    setSelectedVariants((prev) => {
      const newSelectedVariants = [...prev];
      let hasChanges = false;

      product.variants?.forEach((variant: ProductVariant) => {
        // If variant has exactly one option and it's not already selected
        if (variant.options.length === 1) {
          const optionValue = variant.options[0].value;
          const isAlreadySelected = newSelectedVariants.some(
            (v) => v.variantName === variant.name && v.optionValue === optionValue,
          );

          if (!isAlreadySelected) {
            // Remove any existing selection for this variant
            const filtered = newSelectedVariants.filter((v) => v.variantName !== variant.name);
            // Add the single option
            newSelectedVariants.length = 0;
            newSelectedVariants.push(...filtered, { variantName: variant.name, optionValue });
            hasChanges = true;
          }
        }
      });

      return hasChanges ? newSelectedVariants : prev;
    });
  }, [product?._id, product?.variants]); // Reset when product or variants change

  const { addToCart } = useCart();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (!product) return null;

  const calculateSalePrice = (price: number, discountPercent: number) => {
    return price - (price * discountPercent) / 100;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Prevent admin from adding to cart
    if (isAdmin) {
      toast.error('Admin users cannot add items to cart');
      return;
    }

    // Skip variant validation if no variants exist
    if (!product.variants?.length) {
      try {
        const itemToAdd = {
          _id: product._id,
          name: product.name,
          price: product.saleInfo?.discountPercent
            ? calculateSalePrice(product.price, product.saleInfo.discountPercent)
            : product.price,
          image: product.images?.[0] || '/placeholder-product.jpg',
          quantity,
          slug: product.slug,
          color: '',
          size: '',
          variants: [],
          addons: [],
        };

        addToCart(itemToAdd);
        toast.success('Added to cart!');
        onClose();
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add to cart');
      }
      return;
    }

    try {
      const itemToAdd = {
        _id: product._id,
        name: product.name,
        price: product.saleInfo?.discountPercent
          ? calculateSalePrice(product.price, product.saleInfo.discountPercent)
          : product.price,
        image: product.images?.[0] || '/placeholder-product.jpg',
        quantity,
        slug: product.slug,
        color: '',
        size: '',
        variants: selectedVariants,
        addons: [],
      };

      addToCart(itemToAdd);
      toast.success('Added to cart!');
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Wishlist functionality removed from QuickView to keep it simple
  // Users can use the main product page for wishlist actions

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '/placeholder-product.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    return `${process.env.NEXT_PUBLIC_API_URL || ''}${imagePath}`;
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-fit max-w-7xl max-h-[90vh] overflow-hidden p-0 sm:p-6 rounded-lg">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 lg:pt-0">
          <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-bold pr-8">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-0">
            {/* Product Images */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={getImageUrl(product.images?.[selectedImage] || '/placeholder-product.jpg')}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {product.saleInfo && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-red-400">
                      <div className="text-center">
                        <div className="text-xs font-bold">
                          {product.saleInfo.discountPercent}% OFF
                        </div>
                        <div className="text-[10px] opacity-90">{product.saleInfo.saleName}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-blue-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      aria-label={`View image ${index + 1} of ${product.images.length}`}
                    >
                      <Image
                        src={getImageUrl(img) || '/placeholder.svg'}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 20vw, 10vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="space-y-4 sm:space-y-6 flex-1">
                {/* Rating */}
                <div className="flex items-center mt-3 gap-2">
                  <div className="flex text-yellow-500">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={`star-${i}`}
                          size={20}
                          fill={i < Math.round(product?.rating || 0) ? 'currentColor' : 'none'}
                        />
                      ))}
                  </div>
                  <span className="text-gray-500 text-sm">{product?.numReviews} Review(s)</span>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  {product.saleInfo ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                          Rs.{' '}
                          {calculateSalePrice(
                            product.price,
                            product.saleInfo.discountPercent,
                          ).toLocaleString()}
                        </span>
                        <span className="text-sm sm:text-base lg:text-lg text-gray-500 line-through">
                          Rs. {product.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full">
                          {product.saleInfo.discountPercent}% OFF
                        </span>
                        <span className="text-green-600 font-medium text-sm">
                          You save Rs.{' '}
                          {(
                            product.price -
                            calculateSalePrice(product.price, product.saleInfo.discountPercent)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
                      Rs. {product.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="max-w-none text-sm line-clamp-3 text-muted-foreground">
                  <p>{product.description || 'No description available'}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Quantity</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 h-8 w-8 p-0 bg-transparent"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 h-8 min-w-[3rem] px-3 bg-transparent"
                      aria-label="Quantity"
                    >
                      {quantity}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 h-8 w-8 p-0 bg-transparent"
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      disabled={quantity >= availableStock}
                      title={quantity >= availableStock ? 'Cannot exceed available stock' : undefined}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isInStock
                      ? `In stock: ${availableStock} ${availableStock === 1 ? 'unit' : 'units'}`
                      : 'Out of Stock'}
                  </p>
                </div>

                {/* Variants (same behavior as product page) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-6">
                    <VariantSelector
                      variants={product.variants as Variant[]}
                      selectedVariants={selectedVariants}
                      onVariantChange={handleVariantChange}
                    />
                  </div>
                )}

                {/* Category & Availability */}
                <div className="grid gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <div>
                    <span className="font-medium">Category:</span>{' '}
                    <span>{product.category?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Availability:</span>{' '}
                    <span className={isInStock ? 'text-green-600' : 'text-red-600'}>
                      {isInStock
                        ? product.stock !== undefined
                          ? `In Stock (${product.stock} ${product.stock === 1 ? 'unit' : 'units'})`
                          : 'In Stock'
                        : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-200">
                <Button
                  className="flex-1 text-sm sm:text-base bg-(--color-logo) hover:bg-(--color-logo)/90 min-h-[44px]"
                  onClick={handleAddToCart}
                  disabled={!isInStock || quantity > availableStock || isAdmin}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {isAdmin ? 'Add to Cart' : isInStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default QuickView;