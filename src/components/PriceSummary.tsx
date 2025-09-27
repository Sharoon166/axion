'use client';

import React from 'react';
import { generateConfigurationSummary, ProductConfiguration } from '@/lib/productVariants';
import { calculateSalePrice } from '@/lib/utils';

interface PriceSummaryProps {
  configuration: ProductConfiguration;
  basePrice: number;
  className?: string;
  discountPercent?: number; // Applies to base + variants only (not add-ons)
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  configuration,
  basePrice,
  className = '',
  discountPercent = 0,
}) => {
  const summary = generateConfigurationSummary(configuration);
  const hasVariants = summary.variants.length > 0;
  const hasAddons = summary.addons.length > 0;
  const addonsTotal = summary.addons.reduce((sum, addon) => sum + addon.price, 0);
  const variantPriceChange = summary.totalPrice - basePrice - addonsTotal;
  const pct = Math.max(0, Math.min(95, Math.round(discountPercent || 0)));
  const discountedBase = pct > 0 ? calculateSalePrice(basePrice, pct) : basePrice;
  const discountedTotal = discountedBase + variantPriceChange + addonsTotal;

  if (!hasVariants && !hasAddons) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Price:</span>
          <span className="font-bold text-2xl text-blue-600">
            Rs. {(pct > 0 ? calculateSalePrice(basePrice, pct) : basePrice).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 space-y-3 ${className}`}>
      <h4 className="font-semibold text-lg border-b border-gray-200 pb-2">Price Breakdown</h4>
      
      {/* Base Price */}
      <div className="flex justify-between items-center">
        <span>Base Price:</span>
        <span>Rs. {basePrice.toLocaleString()}</span>
      </div>

      {/* Variant Price Changes */}
      {hasVariants && variantPriceChange !== 0 && (
        <div className="flex justify-between items-center">
          <span>Variant Adjustments:</span>
          <span className={variantPriceChange > 0 ? 'text-red-600' : 'text-green-600'}>
            {variantPriceChange > 0 ? '+' : ''}Rs. {variantPriceChange.toLocaleString()}
          </span>
        </div>
      )}

      {/* Selected Variants */}
      {hasVariants && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-600">Selected Options:</span>
          {summary.variants.map((variant, index) => (
            <div key={index} className="flex justify-between items-center text-sm pl-2">
              <span>{variant.name}: {variant.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons */}
      {hasAddons && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-600">Add-ons:</span>
          {summary.addons.map((addon, index) => (
            <div key={index} className="flex justify-between items-center text-sm pl-2">
              <span>
                {addon.name}: {addon.option}
                {addon.quantity > 1 && ` (×${addon.quantity})`}
              </span>
              <span className="text-blue-600">
                +Rs. {addon.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-200 pt-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Price:</span>
          <span className="font-bold text-2xl text-blue-600">
            Rs. {discountedTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stock Information */}
      <div className="text-sm text-gray-600">
        Available Stock: {summary.availableStock} units
      </div>
    </div>
  );
};

export default PriceSummary;
