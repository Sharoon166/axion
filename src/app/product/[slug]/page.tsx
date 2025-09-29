'use client';

import React, { useState, useEffect, useCallback, JSX } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { ReviewImageUpload } from '@/components/ReviewImageUpload';

interface ReviewType {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  productId: string;
  productSlug: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}
import { getImageUrl, calculateSalePrice, isOnSale } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import useWishlist from '@/contexts/WishlistContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Loading from '@/loading';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import VariantSelector from '@/components/VariantSelector';
import AddonSelector from '@/components/AddonSelector';
import PriceSummary from '@/components/PriceSummary';
import {
  Variant,
  Addon,
  SelectedVariant,
  SelectedAddon,
  ProductConfiguration,
  calculateFinalPrice,
  calculateAvailableStock,
  validateRequiredVariants,
  validateRequiredAddons,
  getVariantImage,
} from '@/lib/productVariants';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// /data/products.ts

export interface Product {
  _id: number;
  slug: string;
  subcategories?: string[];
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  numReviews: number;
  colors: string[];
  sizes: string[];
  images: string[];
  category: string;
  related?: number[]; // product IDs for "You may also like"
  stock: number;
  variants?: Variant[];
  addons?: Addon[];
  specifications?: { name: string; value: string }[];
  shipping?: {
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    freeShipping?: boolean;
    shippingCost?: number;
    estimatedDelivery?: string;
    returnPolicy?: string;
  };
  reviews?: {
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
}

// Removed dummy data - now using real backend data

const ProductPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Type for wishlist item
  interface WishlistItemType {
    _id: string;
    name: string;
    price: number;
    image: string; // Single image for the wishlist item
    images: string[]; // All images for the product
    slug: string;
  }
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState('');
  const [fetchedproduct, setFetchdProduct] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<{
    rating: number;
    comment: string;
    images: string[];
  }>({
    rating: 5,
    comment: '',
    images: [],
  });
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null>(null);
  const [reviewsFetched, setReviewsFetched] = useState(false);
  const [salePercent, setSalePercent] = useState(0);
  const [saleName, setSaleName] = useState<string | null>(null);
  const [saleEndsAt, setSaleEndsAt] = useState<string | null>(null);
  const [saleTimeLeft, setSaleTimeLeft] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewType | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Convert URLs inside plain text into clickable links
  const linkifyText = (text: string): (string | JSX.Element)[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${i}-${part}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-blue-600 underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Define variant type for better type safety
  type ProductVariant = {
    name: string;
    options: Array<{ value: string; label?: string }>;
  };

  // Auto-select single variant option if only one exists (only for variants with truly one option)
  useEffect(() => {
    const product = fetchedproduct[0];
    if (!product?.variants) return;

    // Group variants by name to get total options per variant name
    const variantGroups: Record<string, Array<{ value: string; label?: string }>> = {};
    (product.variants as ProductVariant[]).forEach((variant) => {
      if (!variantGroups[variant.name]) {
        variantGroups[variant.name] = [];
      }
      variantGroups[variant.name].push(...variant.options);
    });

    setSelectedVariants((prev) => {
      const newSelectedVariants = [...prev];
      let hasChanges = false;

      // Only auto-select if the variant name has exactly one total option across all variants
      Object.entries(variantGroups).forEach(([variantName, allOptions]) => {
        if (allOptions.length === 1) {
          const optionValue = allOptions[0].value;
          const isAlreadySelected = newSelectedVariants.some(
            (v) => v.variantName === variantName && v.optionValue === optionValue,
          );

          if (!isAlreadySelected) {
            // Remove any existing selection for this variant
            const filtered = newSelectedVariants.filter((v) => v.variantName !== variantName);
            // Add the single option
            newSelectedVariants.length = 0;
            newSelectedVariants.push(...filtered, { variantName, optionValue });
            hasChanges = true;
          }
        }
      });

      return hasChanges ? newSelectedVariants : prev;
    });
  }, [fetchedproduct]); // Re-run when product data changes

  const handleAddonChange = (addonName: string, optionLabel: string, quantity: number) => {
    setSelectedAddons((prev) => {
      const filtered = prev.filter(
        (a) => !(a.addonName === addonName && a.optionLabel === optionLabel),
      );
      if (quantity > 0) {
        return [...filtered, { addonName, optionLabel, quantity }];
      }
      return filtered;
    });
  };

  // Replace the createProductConfiguration function with this corrected version
  const createProductConfiguration = useCallback(
    (product: Product): ProductConfiguration => {
      const variants = product.variants || [];
      const forcedAddons = (product.addons || []).map((a) => ({
        ...a,
        required: true,
      }));

      // Mark selected options in addons
      const addonsWithSelections = forcedAddons.map((addon) => ({
        ...addon,
        options: addon.options.map((option) => ({
          ...option,
          selected: selectedAddons.some(
            (sa) =>
              sa.addonName === addon.name && sa.optionLabel === option.label && sa.quantity > 0,
          ),
          quantity:
            selectedAddons.find(
              (sa) => sa.addonName === addon.name && sa.optionLabel === option.label,
            )?.quantity || 0,
        })),
      }));

      // Process variants with selections
      const variantsWithSelections = variants.map((v) => ({
        ...v,
        options: v.options.map((o) => ({
          ...o,
          selected: selectedVariants.some(
            (sv) => sv.variantName === v.name && sv.optionValue === o.value,
          ),
        })),
      }));

      return {
        variants: variantsWithSelections,
        addons: addonsWithSelections,
        basePrice: product.price,
        selectedVariants: selectedVariants,
        selectedAddons: selectedAddons,
      };
    },
    [selectedVariants, selectedAddons],
  );
  const fetchRelatedProducts = useCallback(
    async (category: string) => {
      try {
        const response = await fetch(`/api/products?category=${category}&limit=5`);
        const result = await response.json();

        if (result.success && result.data) {
          const relatedData = result.data
            .filter((p: Product) => p.slug !== slug)
            .slice(0, 5)
            .map((productData: Product) => ({
              _id: productData._id,
              slug: productData.slug,
              name: productData.name,
              description: productData.description,
              price: productData.price,
              oldPrice: productData.oldPrice,
              discount: productData.discount,
              rating: productData.rating || 0,
              numReviews: productData.numReviews || 0,
              colors: productData.colors || ['#ffffff'],
              sizes: productData.sizes || ['Standard'],
              images: productData.images || [],
              category: productData.category || '',
              related: [],
            }));

          setRelatedProducts(relatedData);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    },
    [slug],
  );

  const fetcheproduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${slug}`);
      const result = await response.json();

      if (result.success && result.data) {
        const productData = result.data;

        const mapped: Product = {
          _id: productData._id,
          slug: productData.slug,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          oldPrice: productData.oldPrice,
          discount: productData.discount,
          rating: productData.rating || 0,
          numReviews: productData.numReviews || 0,
          subcategories: productData.subcategories || [],
          colors: productData.colors || ['#ffffff'],
          sizes: productData.sizes || ['Standard'],
          images: productData.images || [],
          category:
            productData.category?.slug || productData.category?.name || productData.category || '',
          related: [],
          stock: productData.stock ?? 0,
          variants: productData.variants || [],
          addons: productData.addons || [],
          specifications: productData.specifications || [],
          shipping: productData.shipping || {},
          reviews: productData.reviews || [],
        };

        setFetchdProduct([mapped]);

        // Auto-select the only color if there's exactly one
        if (mapped.colors && mapped.colors.length === 1) {
          setSelectedColor(mapped.colors[0]);
        } else if (mapped.colors && mapped.colors.length > 0) {
          setSelectedColor('');
        }

        // Auto-select the only size if there's exactly one
        if (mapped.sizes && mapped.sizes.length === 1) {
          setSelectedSize(mapped.sizes[0]);
        } else if (mapped.sizes && mapped.sizes.length > 0) {
          setSelectedSize('');
        }

        // Auto-select variants if there's only one option for each variant
        if (mapped.variants && mapped.variants.length > 0) {
          const newSelectedVariants: SelectedVariant[] = [];

          mapped.variants.forEach((variant) => {
            if (variant.options && variant.options.length === 1) {
              newSelectedVariants.push({
                variantName: variant.name,
                optionValue: variant.options[0].value,
              });
            }
          });

          setSelectedVariants(newSelectedVariants);
        }

        // Fetch related products
        fetchRelatedProducts(mapped.category);
      } else {
        console.error('Failed to fetch product:', result.error);
        setFetchdProduct([]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setFetchdProduct([]);
    } finally {
      setLoading(false);
    }
  }, [slug, fetchRelatedProducts]); // include fetchRelatedProducts

  useEffect(() => {
    fetcheproduct();
  }, [fetcheproduct]);

  // Fetch applicable sale for this product and compute best discount
  useEffect(() => {
    if (fetchedproduct.length === 0) {
      setSalePercent(0);
      setSaleEndsAt(null);
      setSaleName(null);
      return;
    }
    const p = fetchedproduct[0] as Product;
    const productId = String(p._id ?? '');
    const categorySlug = String(p.category ?? '');
    (async () => {
      try {
        const res = await fetch('/api/sale?mode=all');
        const j = await res.json();
        if (!j?.success || !Array.isArray(j.data)) {
          setSalePercent(0);
          setSaleEndsAt(null);
          setSaleName(null);
          return;
        }
        const activeSales = j.data as Array<{
          _id: string;
          productIds?: string[];
          categorySlugs?: string[];
          discountPercent?: number;
          endsAt: string;
          name?: string;
        }>;
        let best: { percent: number; endsAt: string; name?: string } | null = null;
        for (const s of activeSales) {
          const appliesById = Array.isArray(s.productIds) && s.productIds.includes(productId);
          const appliesByCat =
            Array.isArray(s.categorySlugs) && s.categorySlugs.includes(categorySlug);
          if (!appliesById && !appliesByCat) continue;
          const pct = typeof s.discountPercent === 'number' ? s.discountPercent : 0;
          const endsAt = s.endsAt;
          if (!best) best = { percent: pct, endsAt, name: s.name };
          else if (
            pct > best.percent ||
            (pct === best.percent && new Date(endsAt).getTime() < new Date(best.endsAt).getTime())
          ) {
            best = { percent: pct, endsAt, name: s.name };
          }
        }
        if (best) {
          setSalePercent(best.percent);
          setSaleEndsAt(best.endsAt);
          setSaleName(best.name ?? null);
        } else {
          setSalePercent(0);
          setSaleEndsAt(null);
          setSaleName(null);
        }
      } catch {
        setSalePercent(0);
        setSaleEndsAt(null);
        setSaleName(null);
      }
    })();
  }, [fetchedproduct]);

  // Countdown for this product's sale
  useEffect(() => {
    if (!saleEndsAt) {
      setSaleTimeLeft(null);
      return;
    }
    const update = () => {
      const end = new Date(saleEndsAt).getTime();
      const diff = end - Date.now();
      if (isNaN(end) || diff <= 0) {
        setSaleTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setSaleTimeLeft(`${h}:${m}:${s}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [saleEndsAt]);

  // Set initial selected image when product data is loaded
  useEffect(() => {
    if (fetchedproduct.length > 0 && fetchedproduct[0].images.length > 0) {
      const firstImage = fetchedproduct[0].images[0];
      setSelectedImage(getImageUrl(firstImage));
    }
  }, [fetchedproduct]);

  // Load user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData({
          id: parsedUserData.id || '1',
          name: parsedUserData.name || 'Anonymous User',
          email: parsedUserData.email || 'user@example.com',
          image: parsedUserData.image || '',
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Fetch reviews when product is loaded (only once)
  useEffect(() => {
    if (fetchedproduct.length > 0 && fetchedproduct[0].slug && !reviewsFetched) {
      fetchProductReviews(fetchedproduct[0].slug);
      setReviewsFetched(true);
    }
  }, [fetchedproduct, reviewsFetched]);

  const fetchProductReviews = async (productSlug: string) => {
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`);
      const result = await response.json();

      if (result.success && result.data) {
        // Update the product with fresh reviews data
        setFetchdProduct((prev) =>
          prev.map((product) =>
            product.slug === productSlug
              ? {
                  ...product,
                  reviews: result.data.reviews || [],
                  rating: result.data.rating || 0,
                  numReviews: result.data.numReviews || 0,
                }
              : product,
          ),
        );
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!userData) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (!reviewData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    try {
      // Ensure images is an array and filter out any invalid entries
      const images = Array.isArray(reviewData.images)
        ? reviewData.images.filter((img: string) => typeof img === 'string' && img.trim() !== '')
        : [];

      const response = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          userImage: userData.image || '',
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: images,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewData({ rating: 5, comment: '', images: [] });
        // Refresh reviews to show new review
        if (fetchedproduct.length > 0) {
          await fetchProductReviews(fetchedproduct[0].slug);
        }
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };
  useEffect(() => {
    if (fetchedproduct.length > 0) {
      const product = fetchedproduct[0];
      const config = createProductConfiguration(product);
      const availableStock = calculateAvailableStock(config);

      // If current quantity exceeds available stock, reset to available stock
      if (quantity > availableStock && availableStock > 0) {
        setQuantity(availableStock);
      } else if (availableStock === 0 && quantity > 0) {
        setQuantity(0);
      } else if (quantity === 0 && availableStock > 0) {
        setQuantity(1);
      }
    }
  }, [selectedVariants, selectedAddons, fetchedproduct, quantity, createProductConfiguration]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  if (!loading && fetchedproduct.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white text-center px-4 py-12">
        <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mb-6 shadow-lg">
          <span className="text-blue-600 text-4xl font-extrabold">404</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Sorry, the product you are looking for does not exist or has been removed.
          <br />
          Please check the URL or browse our categories for more products.
        </p>
        <Link
          href="/products"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="" subtitle={''} />
      <div className="max-w-[85rem] mx-auto px-8 sm:px-6  py-6 md:py-10">
        {fetchedproduct.map((product: Product) => {
          const galleryImages = product.images.map((img) => getImageUrl(img));

          return (
            <div
              key={`product-${product._id}-${product.slug}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-10"
            >
              {/* Left - Gallery */}
              <div>
                <div className="flex flex-col items-center">
                  {/* Main Image */}
                  <div className="flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedImage}
                        src={selectedImage || galleryImages[0]}
                        alt={fetchedproduct[0]?.name || 'Product image'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl shadow-lg object-cover mx-auto w-full h-[17rem] sm:h-[30rem]"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Thumbnails below main image */}
                  <div className="flex flex-wrap gap-3 mt-6 sm:justify-center w-full">
                    {galleryImages.map((img, i) => (
                      <Image
                        key={`thumb-${i}-${img}`}
                        src={img}
                        alt={`thumb-${i}`}
                        width={70}
                        height={70}
                        onClick={() => setSelectedImage(img)}
                        className={`rounded-lg cursor-pointer border transition-all duration-200 shadow-sm hover:scale-105 ${
                          selectedImage === img
                            ? 'border-blue-600 ring-2 ring-blue-300'
                            : 'border-gray-300'
                        }`}
                        style={{
                          boxShadow: selectedImage === img ? '0 0 0 2px #2563eb' : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right - Info */}
              <div>
                <h1 className="text-2xl md:text-4xl text-black font-semibold">{product?.name}</h1>
                <p className="text-muted-foreground mt-2 line-clamp-4">{product?.description}</p>

                {/* Rating */}
                <div className="flex items-center mt-3 gap-2">
                  <div className="flex text-yellow-500">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={`star-${i}`}
                          size={20}
                          fill={i < Math.round(product?.rating) ? 'currentColor' : 'none'}
                        />
                      ))}
                  </div>
                  <span className="text-gray-500">{product?.numReviews} Reviews</span>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-center gap-3">
                  {isOnSale(Math.max(product?.discount || 0, salePercent || 0)) ? (
                    <>
                      <span className="text-3xl font-bold text-blue-700">
                        Rs.{' '}
                        {calculateSalePrice(
                          product?.price || 0,
                          Math.max(product?.discount || 0, salePercent || 0),
                        ).toLocaleString()}
                      </span>
                      <span className="line-through text-gray-400 text-xl">
                        Rs. {product?.price.toLocaleString()}
                      </span>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-sm font-medium">
                        {Math.max(product?.discount || 0, salePercent || 0)}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-blue-700">
                      Rs. {product?.price.toLocaleString()}
                    </span>
                  )}
                </div>
                {saleEndsAt && saleTimeLeft && (
                  <div className="mt-1 text-sm text-red-600 font-medium">
                    ⏰ Ends in {saleTimeLeft}
                  </div>
                )}

                {/* Subcategories */}
                {Array.isArray(product?.subcategories) && product?.subcategories.length > 1 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Subcategories</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product?.subcategories?.map((sc, idx) => (
                        <span
                          key={`${sc}-${idx}`}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variants */}
                {product?.variants && product.variants.length > 0 ? (
                  (() => {
                    const variants = product.variants || [];
                    return (
                      <VariantSelector
                        variants={variants}
                        selectedVariants={selectedVariants}
                        onVariantChange={setSelectedVariants}
                      />
                    );
                  })()
                ) : (
                  <>
                    {/* Legacy Colors */}
                    {product?.colors && product.colors.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold">Color</h4>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {product.colors.map((c, index) => (
                            <button
                              key={`color-${c}-${index}`}
                              className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-110 transition-all duration-200 ${
                                selectedColor === c
                                  ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-600'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                backgroundColor: c,
                                boxShadow:
                                  c === '#ffffff' || c === 'white'
                                    ? 'inset 0 0 0 1px #e5e7eb'
                                    : undefined,
                              }}
                              onClick={() => setSelectedColor(c)}
                              title={`Color: ${c}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Sizes */}
                    {product?.sizes && product.sizes.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold">Size</h4>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {product.sizes.map((s, index) => (
                            <button
                              key={`size-${s}-${index}`}
                              className={`px-4 py-2 border rounded-lg ${
                                selectedSize === s
                                  ? 'border-blue-600 text-blue-600'
                                  : 'border-gray-300'
                              }`}
                              onClick={() => setSelectedSize(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Add-ons */}
                {product?.addons &&
                  product.addons.length > 0 &&
                  (() => {
                    const forcedAddons = (product.addons || []).map((a) => ({
                      ...a,
                      type: 'checkbox' as const,
                      required: false,
                    }));
                    return (
                      <AddonSelector
                        addons={forcedAddons}
                        selectedAddons={selectedAddons}
                        onAddonChange={handleAddonChange}
                      />
                    );
                  })()}

                {/* Price Summary */}
                {(product?.variants && product.variants.length > 0) ||
                (product?.addons && product.addons.length > 0) ? (
                  <PriceSummary
                    configuration={createProductConfiguration(product)}
                    basePrice={product.price}
                    discountPercent={Math.max(product?.discount || 0, salePercent || 0)}
                    className="mt-6"
                  />
                ) : null}

                {/* Quantity */}
                <div className="mt-6">
                  <h4 className="font-semibold">Quantity</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 border rounded"
                      disabled={quantity <= 1}
                    >
                      <Minus />
                    </button>
                    <span className="px-4">{quantity}</span>
                    <button
                      onClick={() => {
                        const config = createProductConfiguration(product);
                        const availableStock = calculateAvailableStock(config);
                        setQuantity((q) => Math.min(availableStock, q + 1));
                      }}
                      className="p-2 border rounded"
                      disabled={(() => {
                        const config = createProductConfiguration(product);
                        const availableStock = calculateAvailableStock(config);
                        return quantity >= availableStock;
                      })()}
                      title={(() => {
                        const config = createProductConfiguration(product);
                        const availableStock = calculateAvailableStock(config);
                        return quantity >= availableStock
                          ? 'Cannot exceed available stock'
                          : undefined;
                      })()}
                    >
                      <Plus />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    In stock:{' '}
                    {(() => {
                      const config = createProductConfiguration(product);
                      return calculateAvailableStock(config);
                    })()}{' '}
                    units
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 bg-blue-900 text-white hover:bg-blue-800"
                    disabled={Boolean(
                      user?.isAdmin || user?.role === 'admin' || user?.role === 'order admin',
                    )}
                    onClick={async () => {
                      const config = createProductConfiguration(product);
                      const availableStock = calculateAvailableStock(config);

                      // Validate required variants
                      const variantValidation = validateRequiredVariants(config);
                      if (!variantValidation.isValid) {
                        toast.error(
                          `Please select: ${variantValidation.missingVariants.join(', ')}`,
                        );
                        return;
                      }

                      // Validate required sub-variants
                      const missingSubVariants: string[] = [];
                      selectedVariants.forEach((variant) => {
                        const variantDef = product.variants?.find(v => v.name === variant.variantName);
                        const option = variantDef?.options.find(o => o.value === variant.optionValue);
                        
                        // Check if variant has required sub-variants that aren't selected
                        if (Array.isArray(option?.subVariants) && option.subVariants.length > 0) {
                          option.subVariants.forEach((subVariant) => {
                            const selectedSub = variant.subVariants?.find(
                              sv => sv.subVariantName === subVariant.name
                            );

                            // If this required sub-variant is missing entirely
                            if (!selectedSub) {
                              missingSubVariants.push(`${variant.variantName} - ${subVariant.name}`);
                              return;
                            }

                            // If a sub-variant is selected, verify required sub-sub-variants on the chosen option
                            const subOption = subVariant.options.find(
                              so => so.value === selectedSub.optionValue
                            );
                            const subSubDefs = subOption?.subSubVariants;
                            if (Array.isArray(subSubDefs) && subSubDefs.length > 0) {
                              subSubDefs.forEach((subSubDef) => {
                                // If any sub-sub-variant exists, it must be selected
                                const hasSubSub = selectedSub.subSubVariants?.some(
                                  ssv => ssv.subSubVariantName === subSubDef.name
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

                      // Validate required add-ons
                      const addonValidation = validateRequiredAddons(config);
                      if (!addonValidation.isValid) {
                        toast.error(
                          `Please select required add-ons: ${addonValidation.missingAddons.join(', ')}`,
                        );
                        return;
                      }

                      const cappedQty = Math.min(quantity, availableStock);
                      if (availableStock <= 0) {
                        toast.error('This product is out of stock');
                        return;
                      }
                      if (quantity > availableStock) {
                        toast.warning(`Quantity reduced to available stock (${availableStock}).`);
                      }

                      const finalPrice = calculateFinalPrice(config);
                      const variantImage = getVariantImage(config, product.images);

                      // Apply discount ONLY on base product price, not variants or add-ons
                      const summaryForCart = (() => {
                        const addonsTotal = (selectedAddons || []).reduce((sum, sa) => {
                          const addon = (product.addons || []).find((a) => a.name === sa.addonName);
                          const option = addon?.options.find((o) => o.label === sa.optionLabel);
                          return sum + (option ? option.price * sa.quantity : 0);
                        }, 0);
                        const variantAdjustment = finalPrice - product.price - addonsTotal;
                        const pct = Math.max(product?.discount || 0, salePercent || 0);
                        const discountedBase = isOnSale(pct)
                          ? calculateSalePrice(product.price, pct)
                          : product.price;
                        return discountedBase + variantAdjustment + addonsTotal;
                      })();

                      // Convert selectedVariants with full details for cart including sub-variants
                      const variantsForCart = (selectedVariants || []).map((sv) => {
                        const variantDef = (product.variants || []).find(
                          (v) => v.name === sv.variantName,
                        );
                        const opt = variantDef?.options.find((o) => o.value === sv.optionValue);

                        // Process sub-variants if they exist
                        const subVariantsForCart = (sv.subVariants || []).map((ssv) => {
                          // Check if subVariants is an array (not a string)
                          const subVariantDef = Array.isArray(opt?.subVariants)
                            ? opt.subVariants.find((subVar) => subVar.name === ssv.subVariantName)
                            : undefined;
                          const subOpt = subVariantDef?.options.find(
                            (so) => so.value === ssv.optionValue,
                          );

                          // Process sub-sub-variants if they exist
                          const subSubForCart = (ssv.subSubVariants || []).map((sss) => {
                            const subSubVariantDef = subOpt?.subSubVariants?.find(
                              (def) => def.name === sss.subSubVariantName,
                            );
                            const subSubOpt = subSubVariantDef?.options.find(
                              (o) => o.value === sss.optionValue,
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
                          subVariants:
                            subVariantsForCart.length > 0 ? subVariantsForCart : undefined,
                        };
                      });

                      // Determine color and size from variants if using variants, otherwise use legacy selection
                      const colorVariant = variantsForCart.find(
                        (v) => v.variantName.toLowerCase() === 'color',
                      );
                      const sizeVariant = variantsForCart.find(
                        (v) => v.variantName.toLowerCase() === 'size',
                      );

                      try {
                        await addToCart({
                          _id: product._id.toString(),
                          name: product.name,
                          price: summaryForCart,
                          image: variantImage || product.images[0],
                          color: colorVariant ? colorVariant.optionValue : selectedColor,
                          size: sizeVariant ? sizeVariant.optionValue : selectedSize,
                          slug: product.slug,
                          quantity: cappedQty,
                          variants: variantsForCart,
                          addons: selectedAddons,
                          saleName: saleName ?? undefined,
                          salePercent: salePercent || undefined,
                        });
                      } catch (error) {
                        console.error('Error adding to cart:', error);
                        toast.error('Failed to add item to cart. Please try again.');
                      }
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    disabled={Boolean(
                      user?.isAdmin ||
                        user?.role === 'order admin' ||
                        user?.role === 'admin' ||
                        !userData,
                    )}
                    onClick={async (e: React.MouseEvent) => {
                      e.preventDefault();
                      const wishlistItem: WishlistItemType = {
                        _id: product._id.toString(),
                        name: product.name,
                        price: product.price,
                        image: product.images[0], // Use first image as the main image
                        images: product.images, // Keep all images
                        slug: product.slug,
                      };

                      try {
                        if (isInWishlist(product._id.toString())) {
                          await removeFromWishlist(product._id.toString());
                          toast.success('Removed from wishlist');
                        } else {
                          await addToWishlist(wishlistItem);
                          toast.success('Added to wishlist');
                        }
                      } catch (err) {
                        console.error('Wishlist operation failed:', err);
                        toast.error('Failed to update wishlist');
                      }
                    }}
                    className={
                      isInWishlist(product._id.toString()) ? 'text-red-500 border-red-500' : ''
                    }
                  >
                    <Heart className={isInWishlist(product._id.toString()) ? 'fill-current' : ''} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-6 border-b">
            {['description', 'reviews', 'shipping'].map((tab) => (
              <button
                key={`tab-${tab}`}
                className={`pb-3 font-semibold capitalize ${
                  activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 'description' && (
              <p className="text-gray-700 break-all">{fetchedproduct[0]?.description}</p>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Header Row: Summary + Sort + CTA */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex text-yellow-500">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={`avg-star-${i}`}
                            size={20}
                            fill={
                              i < Math.round(fetchedproduct[0]?.rating || 0)
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        ))}
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      <span className="font-medium">
                        {(fetchedproduct[0]?.rating || 0).toFixed(1)}
                      </span>{' '}
                      out of 5 based on
                      <span className="font-medium">
                        {' '}
                        {fetchedproduct[0]?.numReviews || 0} Reviews
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Sort</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'highest' | 'lowest')}
                      className="border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Write a Review
                    </button>
                  </div>
                </div>

                {/* Reviews Grid */}
                {fetchedproduct[0]?.reviews && fetchedproduct[0].reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...(fetchedproduct[0].reviews as ReviewType[])]
                      .sort((a, b) => {
                        if (sortBy === 'recent')
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        if (sortBy === 'highest') return b.rating - a.rating;
                        return a.rating - b.rating; // lowest
                      })
                      .map((review, index) => (
                        <div
                          key={index}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedReview(review);
                            setIsReviewDialogOpen(true);
                          }}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedReview(review);
                              setIsReviewDialogOpen(true);
                            }
                          }}
                          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer transition-transform hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                {review.userImage ? (
                                  <Image
                                    src={review.userImage}
                                    alt={review.userName}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span className="text-sm font-semibold text-gray-700">
                                    {review.userName?.charAt(0)?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 leading-tight">
                                  {review.userName}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: '2-digit',
                              })}
                            </span>
                          </div>

                          <p
                            className="text-gray-700 mt-4 leading-relaxed break-words line-clamp-3"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3 as unknown as number,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {linkifyText(review.comment)}
                          </p>

                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {review.images.map((img: string, imgIndex: number) => (
                                  <div
                                    key={`review-${index}-img-${imgIndex}`}
                                    className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Open image in lightbox or new tab
                                      window.open(img, '_blank');
                                    }}
                                  >
                                    <Image
                                      src={img}
                                      alt={`Review image ${imgIndex + 1}`}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-5">
                            <div className="flex text-yellow-500">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={`rev-star-${index}-${i}`}
                                    size={18}
                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-lg">No reviews yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Be the first to review this product!
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Shipping and Return Policy</h3>
                <div className="prose max-w-none text-gray-700">
                  <h4 className="font-semibold text-gray-800">Shipping</h4>
                  <p>
                    Any product you purchase from Axion through any platform, including website,
                    Facebook, and Instagram, will come with free shipping. We offer shipping
                    services throughout Pakistan and you are automatically eligible for free
                    shipping upon ordering any product(s).
                  </p>
                  <h4 className="font-semibold text-gray-800 mt-4">Return policy</h4>
                  <p>
                    If any product arrives to you damaged or discolored, you can file for return. Do
                    note that the return filing should be immediate upon receiving the parcel. The
                    company will look into the matter and facilitate accordingly. We are open to any
                    returns if the product you receive does not satisfy its description.
                  </p>
                  <p className="mt-4 font-medium">Do note the following when ordering:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      The color of the item may vary slightly because of various factors including
                      your screen colors and monitor brightness.
                    </li>
                    <li>We request you to allow for slight deviation in measurement data.</li>
                  </ol>
                  <p className="mt-4">
                    If you have any query regarding your orders or you are having trouble dealing
                    with a parcel/shipment, you can contact us at{' '}
                    <span className="font-semibold">{process.env.NEXT_PUBLIC_WHATSAPP}</span>.
                  </p>
                  <p className="mt-4">
                    For the full policy, see our{' '}
                    <Link href="/shipping-policy" className="text-blue-600 underline">
                      Shipping and Return Policy
                    </Link>{' '}
                    page.
                  </p>
                </div>
              </div>
            )}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogContent className="sm:max-w-xl">
                {selectedReview && (
                  <div className="space-y-4">
                    <DialogHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {selectedReview.userImage ? (
                              <Image
                                src={selectedReview.userImage}
                                alt={selectedReview.userName}
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-700">
                                {selectedReview.userName?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <DialogTitle className="leading-tight">
                              {selectedReview.userName}
                            </DialogTitle>
                            <DialogDescription>
                              {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: '2-digit',
                              })}
                            </DialogDescription>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="flex text-yellow-500">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={`dialog-star-${i}`}
                            size={18}
                            fill={i < selectedReview.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                    </div>
                    <div className="text-gray-800 leading-relaxed overflow-wrap-anywhere max-w-full overflow-hidden break-all">
                      {linkifyText(selectedReview.comment)}
                    </div>

                    {/* Review Images in Dialog */}
                    {selectedReview.images && selectedReview.images.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Photos</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedReview.images.map((img: string, imgIndex: number) => (
                            <div
                              key={`dialog-img-${imgIndex}`}
                              className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(img, '_blank');
                              }}
                            >
                              <Image
                                src={img}
                                alt={`Review image ${imgIndex + 1}`}
                                width={120}
                                height={120}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mt-12 mb-6">You may also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={`related-${p._id}-${p.slug}`}
                  id={p._id.toString()}
                  name={p.name}
                  price={p.price}
                  img={p.images || []}
                  rating={p.rating}
                  href={`/product/${p.slug}`}
                  discount={p.discount}
                />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href={`/category/${fetchedproduct[0]?.category || ''}`}
                className="inline-block px-5 py-2 rounded-md bg-(--color-logo) hover:bg-(--color-logo)/90 text-white"
              >
                View more in this category
              </Link>
            </div>
          </>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowReviewModal(false);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 transform transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500">{reviewData.rating} out of 5</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your experience with this product..."
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Photos (Optional)
                  </label>
                  <ReviewImageUpload
                    onImagesChange={(images: string[]) => setReviewData({ ...reviewData, images })}
                    maxImages={5}
                    initialImages={reviewData.images}
                  />
                </div>

                {userData && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Posting as:</span> {userData.name}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductPage;
