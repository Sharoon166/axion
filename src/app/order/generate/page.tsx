'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Loading from '@/loading';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

const OrderGeneratePage = () => {
  const router = useRouter();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'bank'>('jazzcash');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  // Check authentication and pre-fill user data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Pre-fill form with user data
    setCustomerDetails({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
    });
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    return Object.values(customerDetails).every((value) => value.trim() !== '');
  };

  const handlePayNow = () => {
    if (!validateForm()) {
      toast.error('Please fill in all fields');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePaymentConfirm = async () => {
    const orderData = {
      user: user?.id || null,
      orderItems: cartItems.map((item) => ({
        product: item._id,
        name: item.name,
        qty: item.quantity,
        quantity: item.quantity,
        price: item.price,
        color: item.color || '',
        size: item.size || 'Standard',
        image: item.image,
        variants: item.variants || [],
        saleName: item.saleName || undefined,
        salePercent: typeof item.salePercent === 'number' ? item.salePercent : undefined,
      })),
      shippingAddress: {
        fullName: customerDetails.name,
        address: customerDetails.address,
        city: customerDetails.city,
        postalCode: customerDetails.postalCode,
        phone: customerDetails.phone,
      },
      paymentMethod: paymentMethod === 'jazzcash' ? 'JazzCash' : 'Bank Transfer',
      itemsPrice: getTotalPrice(),
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: getTotalPrice(),
      customerEmail: customerDetails.email,
      isPaid: true,
      paidAt: new Date().toISOString(),
    };

    const orderPromise = fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    }).then(async (response) => {
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.details || result.error || 'Failed to place order');
      }
      return result;
    });

    toast.promise(orderPromise, {
      loading: 'Processing your order...',
      success: () => {
        clearCart();
        setShowPaymentDialog(false);
        return 'Order placed successfully!';
      },
      error: (error) => {
        setShowPaymentDialog(false);
        return `Failed to place order: ${error.message}`;
      },
    });
  };

  // Show loading while checking authentication
  if (!user) {
    return <Loading />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button
            onClick={() => router.push('/')}
            className="bg-(--color-logo) hover:bg-(--color-logo)/90 text-white"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[85rem] mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Complete Your Order</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={customerDetails.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={customerDetails.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <textarea
                  name="address"
                  value={customerDetails.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your complete address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={customerDetails.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={customerDetails.postalCode}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Postal Code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <div
                  key={`${item._id}-${item.color}-${item.size}-${index}`}
                  className="flex items-center space-x-4 p-3 border rounded-lg"
                >
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {/* Show sale info (if applied) */}
                      {typeof item.salePercent === 'number' && item.salePercent > 0 && (
                        <div>
                          <p className="text-green-700 font-medium">
                            Sale{item.saleName ? `: ${item.saleName}` : ''} — {item.salePercent}%
                            OFF
                          </p>
                        </div>
                      )}

                      {/* Show selected variants */}
                      {item.variants && item.variants.length > 0 && (
                        <div>
                          {item.variants.map((variant, idx) => (
                            <p key={idx}>
                              {variant.variantName}: {variant.optionValue}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Show selected addons */}
                      {item.addons && item.addons.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700">Add-ons:</p>
                          {item.addons.map((addon, idx) => (
                            <p key={idx} className="ml-2">
                              • {addon.addonName}: {addon.optionLabel}
                              {addon.quantity > 1 && ` (x${addon.quantity})`}
                            </p>
                          ))}
                        </div>
                      )}

                      <p className="font-medium">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>Rs. 0</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-[var(--color-logo)]">{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handlePayNow}
              className="w-full mt-6 bg-[var(--color-logo)] text-white hover:bg-(--color-logo)/90 py-3"
              disabled={!validateForm()}
            >
              Pay Now
            </Button>
          </div>
        </div>

        {/* Payment Dialog */}
        <ScrollArea className="h-[70vh]">
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Choose Payment Method</DialogTitle>
                <DialogDescription>
                  Select a method and follow the instructions below.
                </DialogDescription>
              </DialogHeader>

              {/* Payment Method Select */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Method</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v: 'jazzcash' | 'bank') => setPaymentMethod(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Method Details */}
              {paymentMethod === 'jazzcash' ? (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">JazzCash Details</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Number:</span>{' '}
                      {process.env.NEXT_PUBLIC_JAZZCASH}
                    </p>
                    <p>
                      <span className="font-medium">Name:</span> Axion Lighting
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">Bank Transfer Details</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Bank:</span> HBL Bank
                    </p>
                    <p>
                      <span className="font-medium">Account:</span>{' '}
                      {process.env.NEXT_PUBLIC_BANK_ACCOUNT}
                    </p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">
                    Rs. {getTotalPrice().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* WhatsApp Confirmation Message */}
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-medium">Important:</span> We will confirm your order after
                  you send the receipt of payment to our WhatsApp number which is{' '}
                  <span className="font-semibold">{process.env.NEXT_PUBLIC_WHATSAPP}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentConfirm}
                  className="flex-1 bg-(--color-logo) hover:bg-(--color-logo)/90"
                >
                  I Have Paid
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </ScrollArea>
      </div>
    </div>
  );
};

export default OrderGeneratePage;
