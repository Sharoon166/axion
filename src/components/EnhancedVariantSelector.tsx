'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { SelectedVariant } from '@/lib/productVariants';

interface VariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications?: Array<{ name: string; value: string }>;
  subVariants?: SubVariant[] | string;
}

interface SubVariant {
  _id: string;
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: SubVariantOption[];
}

interface SubVariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications?: Array<{ name: string; value: string }>;
  subSubVariants?: SubSubVariant[];
}

interface SubSubVariant {
  _id: string;
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: SubSubVariantOption[];
}

interface SubSubVariantOption {
  _id: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications?: Array<{ name: string; value: string }>;
}

interface Variant {
  _id: string;
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: VariantOption[];
}

interface EnhancedVariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (selectedVariants: SelectedVariant[]) => void;
  showDetails?: boolean;
}

const EnhancedVariantSelector: React.FC<EnhancedVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
  showDetails = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleVariantSelection = (variant: Variant, option: VariantOption) => {
    const newSelectedVariant: SelectedVariant = {
      variantName: variant.name,
      optionValue: option.value,
      optionLabel: option.label,
      optionDetails: {
        priceModifier: option.priceModifier,
        sku: option.sku || '',
        customProperties: option.customProperties || {},
      },
    };

    const updatedVariants = [...selectedVariants];
    const existingIndex = updatedVariants.findIndex((sv) => sv.variantName === variant.name);

    if (existingIndex >= 0) {
      updatedVariants[existingIndex] = newSelectedVariant;
    } else {
      updatedVariants.push(newSelectedVariant);
    }

    onVariantChange(updatedVariants);
  };

  const handleSubVariantSelection = (
    parentVariantName: string,
    subVariant: SubVariant,
    subOption: SubVariantOption,
  ) => {
    const updatedVariants = [...selectedVariants];
    const parentIndex = updatedVariants.findIndex((sv) => sv.variantName === parentVariantName);

    if (parentIndex >= 0) {
      const parent = updatedVariants[parentIndex];
      const subVariants = parent.subVariants || [];
      const subIndex = subVariants.findIndex((sv) => sv.subVariantName === subVariant.name);

      const newSubVariant = {
        subVariantName: subVariant.name,
        optionValue: subOption.value,
        optionLabel: subOption.label,
        optionDetails: {
          priceModifier: subOption.priceModifier,
          sku: subOption.sku || '',
          customProperties: subOption.customProperties || {},
        },
      };

      if (subIndex >= 0) {
        subVariants[subIndex] = newSubVariant;
      } else {
        subVariants.push(newSubVariant);
      }

      updatedVariants[parentIndex] = {
        ...parent,
        subVariants: subVariants,
      };

      onVariantChange(updatedVariants);
    }
  };

  const handleSubSubVariantSelection = (
    parentVariantName: string,
    subVariantName: string,
    subSubVariant: SubSubVariant,
    subSubOption: SubSubVariantOption,
  ) => {
    const updatedVariants = [...selectedVariants];
    const parentIndex = updatedVariants.findIndex((sv) => sv.variantName === parentVariantName);

    if (parentIndex >= 0) {
      const parent = updatedVariants[parentIndex];
      const subVariants = parent.subVariants || [];
      const subIndex = subVariants.findIndex((sv) => sv.subVariantName === subVariantName);

      if (subIndex >= 0) {
        const subVar = subVariants[subIndex];
        const subSubVariants = subVar.subSubVariants || [];
        const subSubIndex = subSubVariants.findIndex(
          (ssv) => ssv.subSubVariantName === subSubVariant.name,
        );

        const newSubSubVariant = {
          subSubVariantName: subSubVariant.name,
          optionValue: subSubOption.value,
          optionLabel: subSubOption.label,
          optionDetails: {
            priceModifier: subSubOption.priceModifier,
            sku: subSubOption.sku || '',
            customProperties: subSubOption.customProperties || {},
          },
        };

        if (subSubIndex >= 0) {
          subSubVariants[subSubIndex] = newSubSubVariant;
        } else {
          subSubVariants.push(newSubSubVariant);
        }

        subVariants[subIndex] = {
          ...subVar,
          subSubVariants: subSubVariants,
        };

        updatedVariants[parentIndex] = {
          ...parent,
          subVariants: subVariants,
        };

        onVariantChange(updatedVariants);
      }
    }
  };

  const isOptionSelected = (variantName: string, optionValue: string): boolean => {
    return selectedVariants.some(
      (sv) => sv.variantName === variantName && sv.optionValue === optionValue,
    );
  };

  const isSubOptionSelected = (
    parentVariantName: string,
    subVariantName: string,
    optionValue: string,
  ): boolean => {
    const parent = selectedVariants.find((sv) => sv.variantName === parentVariantName);
    return (
      parent?.subVariants?.some(
        (sv) => sv.subVariantName === subVariantName && sv.optionValue === optionValue,
      ) || false
    );
  };

  const isSubSubOptionSelected = (
    parentVariantName: string,
    subVariantName: string,
    subSubVariantName: string,
    optionValue: string,
  ): boolean => {
    const parent = selectedVariants.find((sv) => sv.variantName === parentVariantName);
    const subVar = parent?.subVariants?.find((sv) => sv.subVariantName === subVariantName);
    return (
      subVar?.subSubVariants?.some(
        (ssv) => ssv.subSubVariantName === subSubVariantName && ssv.optionValue === optionValue,
      ) || false
    );
  };

  const renderVariantOption = (variant: Variant, option: VariantOption) => {
    const isSelected = isOptionSelected(variant.name, option.value);
    // Only consider out of stock if it's a leaf node (no sub-variants) and has 0 stock
    const hasSubVariants = Array.isArray(option.subVariants) && option.subVariants.length > 0;
    const isOutOfStock = !hasSubVariants && (option.stock || 0) <= 0;
    const isColorVariant = variant.type === 'color' || variant.name.toLowerCase().includes('color');

    if (isColorVariant) {
      const isRgbColor = option.value.startsWith('rgb');
      const gradientStyle = isRgbColor
        ? {
            background: `linear-gradient(45deg, ${option.value}, ${option.value}dd, ${option.value}88)`,
            border: '2px solid #e5e7eb',
          }
        : {
            backgroundColor: option.value,
            border: option.value === '#ffffff' || option.value === 'white' ? '2px solid #e5e7eb' : undefined,
          };

      return (
        <Button
          key={option._id}
          variant="outline"
          size="sm"
          disabled={isOutOfStock}
          onClick={() => handleVariantSelection(variant, option)}
          className={`w-12 h-12 rounded-full border-2 transition-all p-0 ${
            isSelected
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-gray-400'
          } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={gradientStyle}
          title={`${option.label}${isOutOfStock ? ' (Out of Stock)' : hasSubVariants ? '' : ` - ${option.stock} left`}`}
        >
          {isSelected && (
            <div className="w-3 h-3 bg-white rounded-full mx-auto border border-gray-300"></div>
          )}
        </Button>
      );
    }

    return (
      <Button
        key={option._id}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => !isOutOfStock && handleVariantSelection(variant, option)}
        disabled={isOutOfStock}
        className={`transition-all ${
          isSelected
            ? 'bg-blue-500 text-white border-blue-500'
            : 'border-gray-300 hover:border-gray-400'
        } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {option.label}
        {option.priceModifier !== 0 && (
          <span className={`ml-1 text-xs ${
            option.priceModifier > 0 ? 'text-red-200' : 'text-green-200'
          }`}>
            ({option.priceModifier > 0 ? '+' : ''}Rs.{option.priceModifier})
          </span>
        )}
      </Button>
    );
  };

  const renderSubVariantOptions = (parentVariantName: string, subVariant: SubVariant) => {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {subVariant.options.map((subOption) => {
            const isSelected = isSubOptionSelected(parentVariantName, subVariant.name, subOption.value);
            // Only consider out of stock if it's a leaf node (no sub-sub-variants) and has 0 stock
            const hasSubSubVariants = Array.isArray(subOption.subSubVariants) && subOption.subSubVariants.length > 0;
            const isOutOfStock = !hasSubSubVariants && (subOption.stock || 0) <= 0;
            const isColorVariant = subVariant.type === 'color' || subVariant.name.toLowerCase().includes('color');

            if (isColorVariant) {
              const isRgbColor = subOption.value.startsWith('rgb');
              const gradientStyle = isRgbColor
                ? {
                    background: `linear-gradient(45deg, ${subOption.value}, ${subOption.value}dd, ${subOption.value}88)`,
                    border: '2px solid #e5e7eb',
                  }
                : {
                    backgroundColor: subOption.value,
                    border: subOption.value === '#ffffff' || subOption.value === 'white' ? '2px solid #e5e7eb' : undefined,
                  };

              return (
                <Button
                  key={subOption._id}
                  variant="outline"
                  size="sm"
                  disabled={isOutOfStock}
                  onClick={() => handleSubVariantSelection(parentVariantName, subVariant, subOption)}
                  className={`w-10 h-10 rounded-full border-2 transition-all p-0 ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={gradientStyle}
                  title={`${subOption.label}${isOutOfStock ? ' (Out of Stock)' : hasSubSubVariants ? '' : ` - ${subOption.stock} left`}`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto border border-gray-300"></div>
                  )}
                </Button>
              );
            }

            return (
              <Button
                key={subOption._id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => !isOutOfStock && handleSubVariantSelection(parentVariantName, subVariant, subOption)}
                disabled={isOutOfStock}
                className={`text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {subOption.label}
                {subOption.priceModifier !== 0 && (
                  <span className={`ml-1 text-xs ${
                    subOption.priceModifier > 0 ? 'text-red-200' : 'text-green-200'
                  }`}>
                    ({subOption.priceModifier > 0 ? '+' : ''}Rs.{subOption.priceModifier})
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSubSubVariantOptions = (
    parentVariantName: string,
    subVariantName: string,
    subSubVariant: SubSubVariant
  ) => {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {subSubVariant.options.map((subSubOption) => {
            const isSelected = isSubSubOptionSelected(
              parentVariantName,
              subVariantName,
              subSubVariant.name,
              subSubOption.value
            );
            // Sub-sub-options are always leaf nodes, so check stock normally
            const isOutOfStock = (subSubOption.stock || 0) <= 0;
            const isColorVariant = subSubVariant.type === 'color' || subSubVariant.name.toLowerCase().includes('color');

            if (isColorVariant) {
              const isRgbColor = subSubOption.value.startsWith('rgb');
              const gradientStyle = isRgbColor
                ? {
                    background: `linear-gradient(45deg, ${subSubOption.value}, ${subSubOption.value}dd, ${subSubOption.value}88)`,
                    border: '2px solid #e5e7eb',
                  }
                : {
                    backgroundColor: subSubOption.value,
                    border: subSubOption.value === '#ffffff' || subSubOption.value === 'white' ? '2px solid #e5e7eb' : undefined,
                  };

              return (
                <Button
                  key={subSubOption._id}
                  variant="outline"
                  size="sm"
                  disabled={isOutOfStock}
                  onClick={() => handleSubSubVariantSelection(parentVariantName, subVariantName, subSubVariant, subSubOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-all p-0 ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={gradientStyle}
                  title={`${subSubOption.label}${isOutOfStock ? ' (Out of Stock)' : ` - ${subSubOption.stock} left`}`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto border border-gray-300"></div>
                  )}
                </Button>
              );
            }

            return (
              <Button
                key={subSubOption._id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => !isOutOfStock && handleSubSubVariantSelection(parentVariantName, subVariantName, subSubVariant, subSubOption)}
                disabled={isOutOfStock}
                className={`text-xs px-2 py-1 h-auto transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {subSubOption.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-6">
      {variants.map((variant) => {
        const selectedOption = selectedVariants.find((sv) => sv.variantName === variant.name);
        const selectedMainOption = variant.options.find((o) => o.value === selectedOption?.optionValue);

        return (
          <div key={variant._id} className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-3">{variant.name}</h4>
              <div className="flex gap-3 flex-wrap">
                {variant.options.map((option) => renderVariantOption(variant, option))}
              </div>
            </div>

            {/* Sub-variants */}
            {selectedOption && Array.isArray(selectedMainOption?.subVariants) && selectedMainOption.subVariants.length > 0 && (
              <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
                <h5 className="text-sm font-medium text-gray-700">
                  Configure {selectedOption.optionValue}
                </h5>
                {selectedMainOption.subVariants.map((subVariant) => {
                  const subSectionKey = `${variant.name}-${subVariant.name}`;
                  const selectedSubVariant = selectedOption.subVariants?.find(
                    (sv) => sv.subVariantName === subVariant.name
                  );
                  const selectedSubOption = subVariant.options.find(
                    (so) => so.value === selectedSubVariant?.optionValue
                  );

                  return (
                    <div key={subVariant._id} className="space-y-3">
                      <Collapsible
                        open={expandedSections[subSectionKey] ?? true}
                        onOpenChange={() => toggleSection(subSectionKey)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto text-sm font-medium">
                            {expandedSections[subSectionKey] ?? true ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {subVariant.name}
                            {selectedSubVariant && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {selectedSubVariant.optionValue}
                              </Badge>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                          {renderSubVariantOptions(variant.name, subVariant)}

                          {/* Sub-sub-variants */}
                          {selectedSubVariant && Array.isArray(selectedSubOption?.subSubVariants) && selectedSubOption.subSubVariants.length > 0 && (
                            <div className="ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
                              <h6 className="text-xs font-medium text-gray-600">
                                Configure {selectedSubVariant.optionValue}
                              </h6>
                              {selectedSubOption.subSubVariants.map((subSubVariant) => {
                                const subSubSectionKey = `${variant.name}-${subVariant.name}-${subSubVariant.name}`;
                                const selectedSubSubVariant = selectedSubVariant.subSubVariants?.find(
                                  (ssv) => ssv.subSubVariantName === subSubVariant.name
                                );

                                return (
                                  <div key={subSubVariant._id} className="space-y-2">
                                    <Collapsible
                                      open={expandedSections[subSubSectionKey] ?? true}
                                      onOpenChange={() => toggleSection(subSubSectionKey)}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto text-xs font-medium">
                                          {expandedSections[subSubSectionKey] ?? true ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                          {subSubVariant.name}
                                          {selectedSubSubVariant && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {selectedSubSubVariant.optionValue}
                                            </Badge>
                                          )}
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        {renderSubSubVariantOptions(variant.name, subVariant.name, subSubVariant)}
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show details if requested */}
            {showDetails && selectedOption && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <h6 className="font-medium mb-2">Selection Details:</h6>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">{variant.name}:</span> {selectedOption.optionValue}
                    {selectedOption.optionDetails?.priceModifier !== 0 && (
                      <span className={`ml-2 ${
                        (selectedOption.optionDetails?.priceModifier ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ({(selectedOption.optionDetails?.priceModifier ?? 0) > 0 ? '+' : ''}Rs.{selectedOption.optionDetails?.priceModifier})
                      </span>
                    )}
                  </div>
                  {selectedOption.optionDetails?.sku && (
                    <div className="text-gray-600">SKU: {selectedOption.optionDetails.sku}</div>
                  )}
                  {selectedOption.optionDetails?.customProperties && 
                   Object.keys(selectedOption.optionDetails.customProperties).length > 0 && (
                    <div className="text-gray-600">
                      {Object.entries(selectedOption.optionDetails.customProperties).map(([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">{key.replace(/_/g, ' ')}: </span>
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EnhancedVariantSelector;