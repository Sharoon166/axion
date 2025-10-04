'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import type {
  SelectedVariant,
  ProductConfiguration,
  Variant,
  SubSubVariantOption,
} from '@/lib/productVariants';
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
  subVariants?: Array<{
    name: string;
    type: 'color' | 'text' | 'size' | 'dropdown';
    required: boolean;
    options: Array<{
      label: string;
      value: string;
      priceModifier: number;
      stock: number;
      sku?: string;
      subSubVariants?: Array<SubSubVariantOption>;
      specifications?: Array<{ name: string; value: string }>;
      _id: string;
    }>;
    _id: string;
  }>;
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

  const handleVariantChange = (updated: SelectedVariant[]) => {
    if (!product?.variants) return;
    setSelectedVariants(updated);
  };

  // Calculate the final price including all variant price modifiers
  const finalPrice = useMemo(() => {
    if (!product) return 0;

    let totalPrice = product.price;

    // Add price modifiers from selected variants
    selectedVariants.forEach((sv) => {
      const variant = product.variants?.find((v) => v.name === sv.variantName);
      const option = variant?.options.find((o) => o.value === sv.optionValue);

      if (option) {
        totalPrice += option.priceModifier || 0;

        // Add price modifiers from sub-variants
        sv.subVariants?.forEach((ssv) => {
          const subVariant = option.subVariants?.find((sub) => sub.name === ssv.subVariantName);
          const subOption = subVariant?.options.find((so) => so.value === ssv.optionValue);
          if (subOption) {
            totalPrice += subOption.priceModifier || 0;

            // Add price modifiers from sub-sub-variants if they exist
            ssv.subSubVariants?.forEach((sssv) => {
              const subSubVariant = subOption.subSubVariants?.find(
                (subsub) => subsub.name === sssv.subSubVariantName,
              );
              const subSubOption = subSubVariant?.options.find(
                (ssso: { value: string }) => ssso.value === sssv.optionValue,
              );
              if (subSubOption) {
                totalPrice += subSubOption.priceModifier || 0;
              }
            });
          }
        });
      }
    });

    // Apply sale discount if exists
    if (product.saleInfo?.discountPercent) {
      totalPrice = calculateSalePrice(totalPrice, product.saleInfo.discountPercent);
    }

    return totalPrice;
  }, [product, selectedVariants]);

  // Compute available stock for the selected path
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
      // Fallback to legacy flags if calculation fails
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
  }, [product?._id, product?.variants]);

  const { addToCart } = useCart();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  if (!product) return null;

  const calculateSalePrice = (price: number, discountPercent: number) => {
    return price - (price * discountPercent) / 100;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (isAdmin) {
      toast.error('Admin users cannot add items to cart');
      return;
    }


    // Validate required variants
    if (product.variants?.length) {
      const missingVariants: string[] = [];

      product.variants.forEach((variant) => {
        if (variant.required) {
          const isSelected = selectedVariants.some((sv) => sv.variantName === variant.name);
          if (!isSelected) {
            missingVariants.push(variant.name);
          }
        }
      });

      if (missingVariants.length > 0) {
        toast.error(`Please select: ${missingVariants.join(', ')}`);
        return;
      }
    }

    // Validate required sub-variants
    const missingSubVariants: string[] = [];
    selectedVariants.forEach((variant) => {
      const variantDef = product.variants?.find((v) => v.name === variant.variantName);
      const option = variantDef?.options.find((o) => o.value === variant.optionValue);

      // Check if variant has required sub-variants that aren't selected
      if (Array.isArray(option?.subVariants) && option.subVariants.length > 0) {
        option.subVariants.forEach((subVariant) => {
          const selectedSub = variant.subVariants?.find(
            (sv) => sv.subVariantName === subVariant.name,
          );

          // If this required sub-variant is missing entirely
          if (!selectedSub) {
            missingSubVariants.push(`${variant.variantName} - ${subVariant.name}`);
            return;
          }

          // If a sub-variant is selected, verify required sub-sub-variants on the chosen option
          const subOption = subVariant.options.find((so) => so.value === selectedSub.optionValue);
          const subSubDefs = subOption?.subSubVariants;
          if (Array.isArray(subSubDefs) && subSubDefs.length > 0) {
            subSubDefs.forEach((subSubDef) => {
              // If any sub-sub-variant exists, it must be selected
              const hasSubSub = selectedSub.subSubVariants?.some(
                (ssv) => ssv.subSubVariantName === subSubDef.name,
              );
              if (!hasSubSub) {
                missingSubVariants.push(
                  `${variant.variantName} - ${subVariant.name} - ${subSubDef.name}`,
                );
              }
            });
          }
        });
      }
    });

    if (missingSubVariants.length > 0) {
      toast.error(`Please select: ${missingSubVariants.join(', ')}`);
      return;
    }

    // Check stock availability
    if (availableStock <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    if (quantity > availableStock) {
      toast.warning(`Quantity reduced to available stock (${availableStock}).`);
    }

    try {
      // Convert selectedVariants with full details for cart including sub-variants
      const variantsForCart = selectedVariants.map((sv) => {
        const variantDef = product.variants?.find((v) => v.name === sv.variantName);
        const opt = variantDef?.options.find((o) => o.value === sv.optionValue);

        // Process sub-variants if they exist
        const subVariantsForCart = (sv.subVariants || []).map((ssv) => {
          const subVariantDef = opt?.subVariants?.find(
            (subVar) => subVar.name === ssv.subVariantName,
          );
          const subOpt = subVariantDef?.options.find((so) => so.value === ssv.optionValue);

          // Process sub-sub-variants if they exist
          const subSubForCart = (ssv.subSubVariants || []).map((sss) => {
            const subSubVariantDef = subOpt?.subSubVariants?.find(
              (def) => def.name === sss.subSubVariantName,
            );
            const subSubOpt = subSubVariantDef?.options.find(
              (o: { value: string }) => o.value === sss.optionValue,
            );
            return {
              subSubVariantName: sss.subSubVariantName,
              optionValue: subSubOpt?.label || sss.optionValue,
              optionLabel: subSubOpt?.label,
            };
          });

          return {
            subVariantName: ssv.subVariantName,
            optionValue: subOpt?.label || ssv.optionValue,
            optionLabel: subOpt?.label,
            subSubVariants: subSubForCart.length > 0 ? subSubForCart : undefined,
          };
        });

        return {
          variantName: sv.variantName,
          optionValue: opt?.label || sv.optionValue,
          optionLabel: opt?.label,
          subVariants: subVariantsForCart.length > 0 ? subVariantsForCart : undefined,
        };
      });

      // Determine color and size from variants if using variants, otherwise use empty strings
      const colorVariant = variantsForCart.find((v) => v.variantName.toLowerCase() === 'color');
      const sizeVariant = variantsForCart.find((v) => v.variantName.toLowerCase() === 'size');

      const itemToAdd = {
        _id: product._id,
        name: product.name,
        price: finalPrice, // Use the calculated final price
        image: product.images?.[0] || '/placeholder-product.jpg',
        quantity,
        slug: product.slug,
        color: colorVariant ? colorVariant.optionValue : '',
        size: sizeVariant ? sizeVariant.optionValue : '',
        variants: variantsForCart,
        addons: [],
        saleName: product.saleInfo?.saleName,
        salePercent: product.saleInfo?.discountPercent,
      };

      await addToCart(itemToAdd);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

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

                {/* Price - Now shows calculated final price */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                      Rs. {finalPrice.toLocaleString()}
                    </span>
                    {finalPrice !== product.price && (
                      <span className="text-sm sm:text-base lg:text-lg text-gray-500 line-through">
                        Rs. {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {product.saleInfo && (
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full">
                        {product.saleInfo.discountPercent}% OFF
                      </span>
                      <span className="text-green-600 font-medium text-sm">
                        You save Rs. {(product.price - finalPrice).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="max-w-none text-sm line-clamp-3 text-muted-foreground">
                  <p>{product.description || 'No description available'}</p>
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-6">
                    <VariantSelector
                      variants={product.variants as Variant[]}
                      selectedVariants={selectedVariants}
                      onVariantChange={handleVariantChange}
                    />
                  </div>
                )}
           
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
                      title={
                        quantity >= availableStock ? 'Cannot exceed available stock' : undefined
                      }
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
                        ? availableStock !== undefined
                          ? `In Stock (${availableStock} ${availableStock === 1 ? 'unit' : 'units'})`
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
