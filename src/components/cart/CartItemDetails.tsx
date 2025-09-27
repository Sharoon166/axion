'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedVariant } from '@/contexts/CartContext';
import { SelectedAddon, SelectedSubSubVariant } from '@/lib/productVariants';

interface CartItemDetailsProps {
  variants?: EnhancedVariant[];
  addons?: SelectedAddon[];
  color?: string;
  size?: string;
  className?: string;
}

const CartItemDetails: React.FC<CartItemDetailsProps> = ({
  variants,
  addons,
  color,
  size,
  className = ''
}) => {
  const hasDetails = (variants && variants.length > 0) || 
                    (addons && addons.length > 0) || 
                    color || size;

  if (!hasDetails) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Legacy Color/Size */}
      {(color || size) && (
        <div className="flex gap-2 text-xs">
          {color && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Color:</span>
              <Badge variant="outline" className="text-xs">{color}</Badge>
            </div>
          )}
          {size && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Size:</span>
              <Badge variant="outline" className="text-xs">{size}</Badge>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Variants */}
      {variants && variants.length > 0 && (
        <div className="space-y-1">
          {variants.map((variant, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 font-medium">{variant.variantName}:</span>
                <Badge variant="outline" className="text-xs">
                  {variant.optionValue}
                </Badge>
                {variant.optionDetails?.priceModifier !== 0 && (
                  <Badge 
                    variant={variant.optionDetails?.priceModifier && variant.optionDetails.priceModifier > 0 ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {variant.optionDetails?.priceModifier && variant.optionDetails.priceModifier > 0 ? '+' : ''}Rs.{variant.optionDetails?.priceModifier}
                  </Badge>
                )}
              </div>

              {/* Sub-variants */}
              {variant.subVariants && variant.subVariants.length > 0 && (
                <div className="ml-4 space-y-1">
                  {variant.subVariants.map((sv, i) => (
                    <div key={i} className="text-xs text-gray-700">
                      <span className="font-medium">{sv.subVariantName}:</span>{' '}
                      <Badge variant="outline" className="text-xs">{sv.optionValue}</Badge>
                      {/* Sub-sub-variants */}
                      {sv.subSubVariants && sv.subSubVariants.length > 0 && (
                        <div className="ml-3 mt-1 space-y-0.5">
                          {sv.subSubVariants.map((sss: SelectedSubSubVariant, j: number) => (
                            <div key={j} className="text-xs text-gray-600">
                              <span className="font-medium">{sss.subSubVariantName}:</span>{' '}
                              <Badge variant="outline" className="text-xs">{sss.optionValue}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* SKU */}
              {variant.optionDetails?.sku && (
                <div className="text-xs text-gray-500 ml-2">
                  SKU: {variant.optionDetails?.sku}
                </div>
              )}
              
              {/* Custom Properties */}
              {variant.optionDetails?.customProperties && 
               Object.keys(variant.optionDetails.customProperties).length > 0 && (
                <div className="ml-2 space-y-1">
                  {Object.entries(variant.optionDetails.customProperties).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add-ons */}
      {addons && addons.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600 font-medium">Add-ons:</div>
          {addons.map((addon, index) => (
            <div key={index} className="flex items-center gap-2 text-xs ml-2">
              <Badge variant="outline" className="text-xs">
                {addon.optionLabel}
              </Badge>
              {addon.quantity > 1 && (
                <span className="text-gray-500">x{addon.quantity}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartItemDetails;