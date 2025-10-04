'use client';

import React, { useEffect } from 'react';
import {
  Variant,
  VariantOption,
  SubVariant,
  SubVariantOption,
  SubSubVariant,
  SubSubVariantOption,
  SelectedVariant,
} from '@/lib/productVariants';

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariants: SelectedVariant[];
  onVariantChange: (selectedVariants: SelectedVariant[]) => void;
}

interface SubVariantSelection {
  subVariantName: string;
  optionValue: string;
  subSubVariants?: SubSubVariantSelection[];
}

interface SubSubVariantSelection {
  subSubVariantName: string;
  optionValue: string;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariants,
  onVariantChange,
}) => {
  // Auto-select single option chains
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const autoSelectedVariants: SelectedVariant[] = [...selectedVariants];
    let hasChanges = false;

    variants.forEach((variant) => {
      // Auto-select main variant if it has only one option
      if (variant.options.length === 1) {
        const option = variant.options[0];
        const existingSelection = autoSelectedVariants.find(
          (sv) => sv.variantName === variant.name,
        );

        if (!existingSelection) {
          const newSelection: SelectedVariant = {
            variantName: variant.name,
            optionValue: option.value,
          };

          // Auto-select sub-variants if they exist and have single options
          if (Array.isArray(option.subVariants) && option.subVariants.length > 0) {
            const subVariants: SubVariantSelection[] = [];

            option.subVariants.forEach((subVariant: SubVariant) => {
              if (subVariant.options.length === 1) {
                const subOption = subVariant.options[0];
                const subSelection: SubVariantSelection = {
                  subVariantName: subVariant.name,
                  optionValue: subOption.value,
                };

                // Auto-select sub-sub-variants if they exist and have single options
                if (
                  Array.isArray(subOption.subSubVariants) &&
                  subOption.subSubVariants.length > 0
                ) {
                  const subSubVariants: SubSubVariantSelection[] = [];

                  subOption.subSubVariants.forEach((subSubVariant: SubSubVariant) => {
                    if (subSubVariant.options.length === 1) {
                      const subSubOption = subSubVariant.options[0];
                      subSubVariants.push({
                        subSubVariantName: subSubVariant.name,
                        optionValue: subSubOption.value,
                      });
                    }
                  });

                  if (subSubVariants.length > 0) {
                    subSelection.subSubVariants = subSubVariants;
                  }
                }

                subVariants.push(subSelection);
              }
            });

            if (subVariants.length > 0) {
              newSelection.subVariants = subVariants;
            }
          }

          autoSelectedVariants.push(newSelection);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      onVariantChange(autoSelectedVariants);
    }
  }, [variants, selectedVariants, onVariantChange]); // Include all dependencies

  // Early return after hooks
  if (!variants || variants.length === 0) return null;

  const handleVariantSelection = (variant: Variant, option: VariantOption) => {
    const newSelectedVariant: SelectedVariant = {
      variantName: variant.name,
      optionValue: option.value,
    };

    const updatedVariants = [...selectedVariants];
    const existingIndex = updatedVariants.findIndex((sv) => sv.variantName === variant.name);
    const targetIndex = existingIndex >= 0 ? existingIndex : updatedVariants.length;

    if (existingIndex >= 0) {
      updatedVariants[existingIndex] = newSelectedVariant;
    } else {
      updatedVariants.push(newSelectedVariant);
    }

    // Auto-select single sub-variants if they exist
    const selectedOption = variant.options.find((o) => o.value === option.value);
    if (selectedOption?.subVariants && Array.isArray(selectedOption.subVariants)) {
      selectedOption.subVariants.forEach((subVariant: SubVariant) => {
        if (subVariant.options && subVariant.options.length === 1) {
          const subOption = subVariant.options[0];
          const parentVariant = updatedVariants[targetIndex];
          const subVariants = [...(parentVariant.subVariants || [])];

          const subIndex = subVariants.findIndex((sv) => sv.subVariantName === subVariant.name);

          const newSubVariant = {
            subVariantName: subVariant.name,
            optionValue: subOption.value,
          };

          if (subIndex >= 0) {
            subVariants[subIndex] = newSubVariant;
          } else {
            subVariants.push(newSubVariant);
          }

          updatedVariants[targetIndex] = {
            ...parentVariant,
            subVariants,
          };
        }
      });
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

  const getSelectedOption = (variantName: string): SelectedVariant | undefined => {
    return selectedVariants.find((sv) => sv.variantName === variantName);
  };

  // Helper function to check if a value is an RGB color
  const isRGB = (value: string): boolean => {
    return /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(value);
  };

  // Helper function to get background style for a value
  const getBackgroundStyle = (value: string, label: string) => {
    if (isRGB(value)) {
      return { background: value };
    } else if (label.toLowerCase() === 'rgb') {
      const rgb = value.split(',').map(Number);
      if (rgb.length === 3 && rgb.every((n) => n >= 0 && n <= 255)) {
        return { background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` };
      }
    }
    return {};
  };

  return (
    <div className="space-y-6">
      {variants.map((variant) => {
        const selectedOption = getSelectedOption(variant.name);

        const isColorVariant =
          variant.type === 'color' || variant.name.toLowerCase().includes('color');

        return (
          <div key={variant.name} className="space-y-4">
            <h4 className="font-semibold text-lg py-2 ">{variant.name}</h4>
            <div className="flex gap-3 flex-wrap">
              {' '}
              {variant.options.map((option: VariantOption, optionIndex: number) => {
                const isSelected = isOptionSelected(variant.name, option.value);
                // Only consider out of stock if it's a leaf node (no sub-variants) and has 0 stock
                const hasSubVariants =
                  Array.isArray(option.subVariants) && option.subVariants.length > 0;
                const isOutOfStock = !hasSubVariants && (option.stock || 0) <= 0;

                if (isColorVariant) {
                  return (
                    <button
                      key={`${option._id}-${optionIndex}`}
                      disabled={isOutOfStock}
                      onClick={() => handleVariantSelection(variant, option)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={
                        option.value.startsWith('rgb') || option.value.startsWith('#')
                          ? {
                              background: option.value, // works for rgb() or hex
                              border:
                                option.value === '#ffffff' || option.value === 'white'
                                  ? '2px solid #e5e7eb'
                                  : undefined,
                            }
                          : {}
                      }
                      title={`${option.label}${isOutOfStock ? ' (Out of Stock)' : hasSubVariants ? '' : ` - ${option.stock} left`}`}
                    ></button>
                  );
                } else {
                  // Regular variant - simple round button
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`relative flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium focus:outline-none ${
                        isSelected
                          ? isRGB(option.value)
                            ? 'border-gray-300 shadow-sm'
                            : 'border-transparent text-white shadow-sm bg-gray-800'
                          : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                      }`}
                      style={
                        isRGB(option.value) ? getBackgroundStyle(option.value, variant.name) : {}
                      }
                      onClick={() => handleVariantSelection(variant, option)}
                    >
                      <span
                        className={`${isSelected && isRGB(option.value) ? 'bg-black/30 px-2 py-1 rounded' : ''} ${isRGB(option.value) ? 'text-white mix-blend-difference' : ''}`}
                      >
                        {option.label || option.value}
                      </span>
                    </button>
                  );
                }
              })}
            </div>

            {/* Show sub-variants if main variant is selected */}
            {selectedOption &&
              (() => {
                const selectedMainOption = variant.options.find(
                  (o) => o.value === selectedOption.optionValue,
                );

                if (
                  Array.isArray(selectedMainOption?.subVariants) &&
                  selectedMainOption.subVariants.length > 0
                ) {
                  return (
                    <div className="mt-4">
                      <div className="space-y-4">
                        {selectedMainOption.subVariants.map((subVariant) => {
                          const isSubColorVariant =
                            subVariant.type === 'color' ||
                            subVariant.name.toLowerCase().includes('color');

                          return (
                            <div key={subVariant._id}>
                              <h5 className="text-md font-medium text-gray-600 mb-2">
                                {subVariant.name}
                              </h5>
                              <div className="flex gap-2 flex-wrap">
                                {subVariant.options.map((subOption) => {
                                  const isSubSelected = isSubOptionSelected(
                                    variant.name,
                                    subVariant.name,
                                    subOption.value,
                                  );
                                  // Only consider out of stock if it's a leaf node (no sub-sub-variants) and has 0 stock
                                  const hasSubSubVariants =
                                    Array.isArray(subOption.subSubVariants) &&
                                    subOption.subSubVariants.length > 0;
                                  const isSubOutOfStock =
                                    !hasSubSubVariants && (subOption.stock || 0) <= 0;

                                  if (isSubColorVariant) {
                                    // Sub-variant color - round button with proper color display
                                    const colorValue = subOption.value;
                                    const isValidColor =
                                      colorValue.startsWith('rgb') || colorValue.startsWith('#');

                                    const colorStyle = isValidColor
                                      ? {
                                          backgroundColor: colorValue,
                                          border:
                                            colorValue === '#ffffff' ||
                                            colorValue === 'white' ||
                                            colorValue === 'rgb(255, 255, 255)'
                                              ? '2px solid #e5e7eb'
                                              : '2px solid #d1d5db',
                                        }
                                      : {
                                          backgroundColor: '#f3f4f6',
                                          border: '2px solid #e5e7eb',
                                        };

                                    return (
                                      <button
                                        key={subOption._id}
                                        disabled={isSubOutOfStock}
                                        onClick={() =>
                                          handleSubVariantSelection(
                                            variant.name,
                                            subVariant,
                                            subOption,
                                          )
                                        }
                                        className={`w-10 h-10 rounded-full transition-all ${
                                          isSubSelected
                                            ? 'ring-2 ring-blue-500 ring-offset-1'
                                            : 'hover:scale-105'
                                        } ${
                                          isSubOutOfStock
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                        }`}
                                        style={colorStyle}
                                        title={`${subOption.label}${isSubOutOfStock ? ' (Out of Stock)' : hasSubSubVariants ? '' : ` - ${subOption.stock} left`}`}
                                      ></button>
                                    );
                                  } else {
                                    // Regular sub-variant - simple tag button
                                    return (
                                      <button
                                        key={subOption._id}
                                        onClick={() =>
                                          !isSubOutOfStock &&
                                          handleSubVariantSelection(
                                            variant.name,
                                            subVariant,
                                            subOption,
                                          )
                                        }
                                        disabled={isSubOutOfStock}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                          isSubSelected
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        } ${
                                          isSubOutOfStock
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                        }`}
                                      >
                                        {subOption.label}
                                      </button>
                                    );
                                  }
                                })}
                              </div>

                              {/* Show sub-sub-variants if sub-variant is selected */}
                              {(() => {
                                const selectedSubVariant = selectedOption.subVariants?.find(
                                  (sv) => sv.subVariantName === subVariant.name,
                                );
                                const selectedSubOption = subVariant.options.find(
                                  (so) => so.value === selectedSubVariant?.optionValue,
                                );

                                if (
                                  selectedSubVariant &&
                                  Array.isArray(selectedSubOption?.subSubVariants) &&
                                  selectedSubOption.subSubVariants.length > 0
                                ) {
                                  return (
                                    <div className="py-3">
                                      {selectedSubOption.subSubVariants.map((subSubVariant) => {
                                        const isSubSubColorVariant =
                                          subSubVariant.type === 'color' ||
                                          subSubVariant.name.toLowerCase().includes('color');

                                        return (
                                          <div key={subSubVariant._id} className="space-y-1">
                                            <span className="text-md font-medium">
                                              {subSubVariant.name}
                                            </span>
                                            <div
                                              className={
                                                isSubSubColorVariant
                                                  ? 'flex gap-1 flex-wrap'
                                                  : 'grid grid-cols-3 gap-1'
                                              }
                                            >
                                              {subSubVariant.options.map((subSubOption) => {
                                                const isSubSubSelected = isSubSubOptionSelected(
                                                  variant.name,
                                                  subVariant.name,
                                                  subSubVariant.name,
                                                  subSubOption.value,
                                                );
                                                // Sub-sub-options are always leaf nodes, so check stock normally
                                                const isSubSubOutOfStock =
                                                  (subSubOption.stock || 0) <= 0;

                                                if (isSubSubColorVariant) {
                                                  // Sub-sub-variant color - round button with proper color display
                                                  const colorValue = subSubOption.value;
                                                  const isValidColor =
                                                    colorValue.startsWith('rgb') ||
                                                    colorValue.startsWith('#');

                                                  const colorStyle = isValidColor
                                                    ? {
                                                        backgroundColor: colorValue,
                                                        border:
                                                          colorValue === '#ffffff' ||
                                                          colorValue === 'white' ||
                                                          colorValue === 'rgb(255, 255, 255)'
                                                            ? '2px solid #e5e7eb'
                                                            : '2px solid #d1d5db',
                                                      }
                                                    : {
                                                        backgroundColor: '#f3f4f6',
                                                        border: '2px solid #e5e7eb',
                                                      };

                                                  return (
                                                    <button
                                                      key={subSubOption._id}
                                                      disabled={isSubSubOutOfStock}
                                                      onClick={() =>
                                                        handleSubSubVariantSelection(
                                                          variant.name,
                                                          subVariant.name,
                                                          subSubVariant,
                                                          subSubOption,
                                                        )
                                                      }
                                                      className={`relative w-8 h-8 rounded-full transition-all ${
                                                        isSubSubSelected
                                                          ? 'ring-2 ring-blue-500 ring-offset-1'
                                                          : 'hover:scale-105'
                                                      } ${
                                                        isSubSubOutOfStock
                                                          ? 'opacity-50 cursor-not-allowed'
                                                          : 'cursor-pointer'
                                                      }`}
                                                      style={colorStyle}
                                                      title={`${subSubOption.label}${isSubSubOutOfStock ? ' (Out of Stock)' : ` - ${subSubOption.stock} left`}`}
                                                    >
                                                     
                                                    </button>
                                                  );
                                                } else {
                                                  // Regular sub-sub-variant - simple tag button
                                                  return (
                                                    <button
                                                      key={subSubOption._id}
                                                      onClick={() =>
                                                        !isSubSubOutOfStock &&
                                                        handleSubSubVariantSelection(
                                                          variant.name,
                                                          subVariant.name,
                                                          subSubVariant,
                                                          subSubOption,
                                                        )
                                                      }
                                                      disabled={isSubSubOutOfStock}
                                                      className={`py-1 rounded-lg border text-sm font-medium transition-all ${
                                                        isSubSubSelected
                                                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                      } ${
                                                        isSubSubOutOfStock
                                                          ? 'opacity-50 cursor-not-allowed'
                                                          : 'cursor-pointer'
                                                      }`}
                                                    >
                                                      {subSubOption.label}
                                                    </button>
                                                  );
                                                }
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
