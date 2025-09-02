'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star, Plus, Minus, ShoppingCart, Heart, } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageHeader, ProductCard } from '@/components';
import { AnimatePresence,motion } from 'framer-motion';

// /data/products.ts

export interface Product {
  _id: number;
  slug: string;
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
}

// Removed dummy data - now using real backend data

const ProductPage = () => {
  const { slug } = useParams();
   const { addToCart,  } = useCart();

  const [selectedImage, setSelectedImage] = useState('');
  const [fetchedproduct, setFetchdProduct] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
 
  const fetcheproduct = async () => {
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
          colors: productData.colors || ['#ffffff'],
          sizes: productData.sizes || ['Standard'],
          images: productData.images || [],
          category: productData.category?.name || productData.category || '',
          related: [],
        };

        setFetchdProduct([mapped]);
        setSelectedColor(mapped.colors[0]);
        setSelectedSize(mapped.sizes[0]);

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
  };

  const fetchRelatedProducts = async (category: string) => {
    try {
      const response = await fetch(`/api/products?category=${category}&limit=4`);
      const result = await response.json();

      if (result.success && result.data) {
        const relatedData = result.data
          .filter((p: any) => p.slug !== slug)
          .slice(0, 4)
          .map((productData: any) => ({
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
            category: productData.category?.name || productData.category || '',
            related: [],
          }));

        setRelatedProducts(relatedData);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };
  console.log(fetchedproduct);

  useEffect(() => {
    fetcheproduct();
  }, [slug]);

  // Set initial selected image when product data is loaded
  useEffect(() => {
    if (fetchedproduct.length > 0 && fetchedproduct[0].images.length > 0) {
      const firstImage = fetchedproduct[0].images[0];
      setSelectedImage(getImageUrl(firstImage));
    }
  }, [fetchedproduct]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          href="/category"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow transition-all"
        >
          Browse Categories
        </Link>
      </div>
    );
  }

  return (
    <div className=" max-w-[85rem] mx-auto">
      <PageHeader title="" subtitle={''} />
      {fetchedproduct.map((product: Product) => {
        const galleryImages = product.images.map((img) => getImageUrl(img));

        return (
          <div key={`product-${product._id}-${product.slug}`} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left - Gallery */}
            <div>
              <div className="flex flex-col items-center">
                {/* Main Image */}
                <div className="flex items-center justify-center w-full">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={selectedImage || galleryImages[0]}
                      alt={product?.name}
                      initial={{ opacity: 0, x: 60, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -60, scale: 0.95 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        duration: 0.5,
                      }}
                      className="rounded-xl shadow-lg object-cover mx-auto"
                      style={{ width: 600, height: 500 }}
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails below main image */}
                <div className="flex gap-3 mt-6 justify-center w-full">
                  {galleryImages.map((img, i) => (
                    <Image
                      key={`thumb-${i}-${img}`}
                      src={img}
                      alt={`thumb-${i}`}
                      width={70}
                      height={70}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-lg cursor-pointer border transition-all duration-200 shadow-sm hover:scale-105 ${selectedImage === img
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
              <h1 className="text-5xl text-black font-semibold">{product?.name}</h1>
              <p className="text-gray-600 mt-2">{product?.description}</p>

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
                <span className="text-3xl font-bold text-blue-700">
                  Rs. {product?.price.toLocaleString()}
                </span>
                {product?.oldPrice && (
                  <span className="line-through text-gray-400">
                    Rs. {product?.oldPrice.toLocaleString()}
                  </span>
                )}
                {product?.discount && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm">
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              {/* Colors */}
              <div className="mt-6">
                <h4 className="font-semibold">Color</h4>
                <div className="flex gap-3 mt-2">
                  {product?.colors.map((c, index) => (
                    <button
                      key={`color-${c}-${index}`}
                      className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-110 transition-all duration-200 ${selectedColor === c
                          ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                      style={{
                        backgroundColor: c,
                        boxShadow: c === '#ffffff' || c === 'white'
                          ? 'inset 0 0 0 1px #e5e7eb'
                          : undefined
                      }}
                      onClick={() => setSelectedColor(c)}
                      title={`Color: ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-6">
                <h4 className="font-semibold">Size</h4>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {product?.sizes.map((s, index) => (
                    <button
                      key={`size-${s}-${index}`}
                      className={`px-4 py-2 border rounded-lg ${selectedSize === s ? 'border-blue-600 text-blue-600' : 'border-gray-300'
                        }`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6">
                <h4 className="font-semibold">Quantity</h4>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 border rounded"
                  >
                    <Minus />
                  </button>
                  <span className="px-4">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="p-2 border rounded">
                    <Plus />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  className="flex-1 bg-blue-900 text-white hover:bg-blue-800"
                  onClick={() => {
                    addToCart({
                      _id: product._id.toString(),
                      name: product.name,
                      price: product.price,
                      image: product.images[0],
                      color: selectedColor,
                      size: selectedSize,
                      slug: product.slug,
                      quantity
                    });
                    // Show success toast
                    toast.success(`${product.name} added to cart!`);
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline">
                  <Heart />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b">
          {['description', 'specification', 'reviews', 'shipping'].map((tab) => (
            <button
              key={`tab-${tab}`}
              className={`pb-3 font-semibold capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'description' && <p className="text-gray-700">{fetchedproduct[0]?.description}</p>}
          {activeTab === 'specification' && (
            <p className="text-gray-700">Add specifications here.</p>
          )}
          {activeTab === 'reviews' && <p className="text-gray-700">Add customer reviews here.</p>}
          {activeTab === 'shipping' && (
            <p className="text-gray-700">Add shipping & return policy here.</p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-12 mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={`related-${p._id}-${p.slug}`}
                id={p._id}
                name={p.name}
                price={p.price}
                img={getImageUrl(p.images[0])}
                href={`/product/${p.slug}`}
                onAddToCart={() => {
                  addToCart({
                    _id: p._id.toString(),
                    name: p.name,
                    price: p.price,
                    image: p.images[0],
                    color: p.colors[0],
                    size: p.sizes[0],
                    slug: p.slug,
                    quantity: 1
                  });
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductPage;
