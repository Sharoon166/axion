'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Minus, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

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

const products: Product[] = [
  {
    _id: 1,
    slug: 'cancorde-ceiling-lamp',
    name: 'Cancorde Ceiling Lamp',
    description:
      'Cancorde Ceiling Lamp is a spectacular piece of light and offers a harmonious lighting distribution in the area around.',
    price: 54999,
    oldPrice: 60999,
    discount: 10,
    rating: 4.5,
    numReviews: 120,
    colors: ['#d4af37', '#000000', '#ffffff', '#c0c0c0', '#f5deb3'],
    sizes: ['20 inch', '25 inch', '30 inch', '35 inch', '40 inch'],
    images: [
      '/prodcut-1.jpg',
      '/prodcut-2.jpg',
      '/prodcut-3.jpg',
      '/prodcut-4.jpg',
      '/prodcut-5.jpg',
    ],
    category: 'Indoor Products',
    related: [2, 3, 4],
  },
  {
    _id: 2,
    slug: 'golden-glow-lamp',
    name: 'Golden Glow Lamp',
    description: 'Golden Glow Lamp adds elegance with warm lighting that suits any space.',
    price: 23000,
    oldPrice: 27000,
    discount: 15,
    rating: 4.7,
    numReviews: 89,
    colors: ['#d4af37'],
    sizes: ['Standard'],
    images: [
      '/prodcut-1.jpg',
      '/prodcut-2.jpg',
      '/prodcut-3.jpg',
      '/prodcut-4.jpg',
      '/prodcut-5.jpg',
    ],
    category: 'Indoor Products',
    related: [1, 3, 4],
  },
];

const ProductPage = () => {
  const { slug } = useParams();
  const product = products.find((p) => p.slug === slug);

  const [selectedImage, setSelectedImage] = useState('');
  const [fetchedproduct, setFetchdProduct] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0]);

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
          oldPrice: undefined,
          discount: undefined,
          rating: productData.rating || 0,
          numReviews: productData.numReviews || 0,
          colors: ['#ffffff'], // fallback (since API doesn't give)
          sizes: ['Standard'], // fallback
          images: productData.images || [],
          category: productData.category?.name || productData.category || '',
          related: [],
        };

        setFetchdProduct([mapped]);
        console.log('Fetched product:', mapped);
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
                      className={`w-8 h-8 rounded-full border ${selectedColor === c ? 'ring-2 ring-blue-600' : ''
                        }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
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
                <Button className="w-full bg-blue-900 text-white">Add to Cart</Button>
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
          {activeTab === 'description' && <p className="text-gray-700">{product?.description}</p>}
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
      <h2 className="text-2xl font-bold mt-12 mb-6">You may also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...products, ...fetchedproduct]
          .filter((p) => p.slug !== slug)
          .slice(0, 4)
          .map((p) => (
            <ProductCard
              key={`related-${p._id}-${p.slug}`}
              id={p._id}
              name={p.name}
              price={p.price}
              img={getImageUrl(p.images[0])}
              href={`/product/${p.slug}`}
              onAddToCart={() => { }}
            />
          ))}
      </div>
    </div>
  );
};

export default ProductPage;
