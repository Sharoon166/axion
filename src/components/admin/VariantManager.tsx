'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Variant, VariantOption } from '@/lib/productVariants';
import { ChromePicker } from 'react-color';

type RGBColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

type ColorResult = {
  hex: string;
  rgb: RGBColor;
  hsl: {
    h: number;
    s: number;
    l: number;
    a?: number;
  };
  oldHue: number;
  source: string;
};

// Declare the EyeDropper API type
declare class EyeDropper {
  open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

const VariantManager: React.FC<VariantManagerProps> = ({ variants, onChange }) => {
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<{
    variantIndex: number;
    optionIndex: number;
  } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{
    variantIndex: number;
    optionIndex: number;
  } | null>(null);
  // Temporary input buffers to allow clearing '0' while typing
  const [tempPriceInputs, setTempPriceInputs] = useState<Record<string, string>>({});
  const [tempStockInputs, setTempStockInputs] = useState<Record<string, string>>({});

  const detectTypeFromName = (name: string): Variant['type'] => {
    const n = name.toLowerCase();
    if (n.includes('color') || n.includes('colour') || n.includes('colours')) return 'color';
    return 'size'; // render as tag-style for anything else
  };

  const isColorValue = (value: string): boolean => {
    // Check if the value is a valid hex color, rgb, or rgba
    const colorRegex =
      /^(#([0-9A-F]{3}){1,2}$|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[01]?\d?\d?\s*\))$/i;
    return colorRegex.test(value);
  };

  const handleColorChange = (color: ColorResult, variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    // Format color based on alpha
    const colorValue =
      color.rgb.a === 1
        ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
        : `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;

    option.value = colorValue;

    // Add or update the color in specifications
    const colorSpecIndex =
      option.specifications?.findIndex((spec) => spec.name.toLowerCase() === 'color') ?? -1;

    if (colorSpecIndex >= 0) {
      option.specifications![colorSpecIndex].value = colorValue;
    } else {
      if (!option.specifications) {
        option.specifications = [];
      }
      option.specifications.push({
        name: 'Color',
        value: colorValue,
      });
    }

    onChange(updated);
  };

  const addVariant = () => {
    const newVariant: Variant = {
      name: '',
      type: 'size',
      required: false,
      options: [],
    };
    onChange([...variants, newVariant]);
    setEditingVariant(variants.length);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    const updated = [...variants];
    // Update field; if name changes, auto-detect and set type accordingly
    if (field === 'name' && typeof value === 'string') {
      const type = detectTypeFromName(value);
      updated[index] = { ...updated[index], [field]: value, type };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
    if (editingVariant === index) {
      setEditingVariant(null);
    }
  };

  const addOption = (variantIndex: number) => {
    const variant = variants[variantIndex];
    const isColorVariant = variant.type === 'color';

    const newOption: VariantOption = {
      label: isColorVariant ? '#000000' : '',
      value: isColorVariant ? '#000000' : '',
      priceModifier: 0,
      stockModifier: 0,
      specifications: isColorVariant ? [{ name: 'Color', value: '#000000' }] : [],
    };

    const updated = [...variants];
    updated[variantIndex].options.push(newOption);
    onChange(updated);

    const newOptionIndex = updated[variantIndex].options.length - 1;
    setEditingOption({ variantIndex, optionIndex: newOptionIndex });

    if (isColorVariant) {
      setShowColorPicker({ variantIndex, optionIndex: newOptionIndex });
    }
  };

  const updateOption = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number | boolean,
  ) => {
    const updated = [...variants];
    updated[variantIndex].options[optionIndex] = {
      ...updated[variantIndex].options[optionIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].options = updated[variantIndex].options.filter(
      (_, i) => i !== optionIndex,
    );
    onChange(updated);
    if (
      editingOption?.variantIndex === variantIndex &&
      editingOption?.optionIndex === optionIndex
    ) {
      setEditingOption(null);
    }
  };

  const addSpecification = (variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    if (!updated[variantIndex].options[optionIndex].specifications) {
      updated[variantIndex].options[optionIndex].specifications = [];
    }
    updated[variantIndex].options[optionIndex].specifications!.push({ name: '', value: '' });
    onChange(updated);
  };

  const updateSpecification = (
    variantIndex: number,
    optionIndex: number,
    specIndex: number,
    field: 'name' | 'value',
    value: string,
  ) => {
    const updated = [...variants];
    updated[variantIndex].options[optionIndex].specifications![specIndex][field] = value;
    onChange(updated);
  };

  const removeSpecification = (variantIndex: number, optionIndex: number, specIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].options[optionIndex].specifications = updated[variantIndex].options[
      optionIndex
    ].specifications!.filter((_, i) => i !== specIndex);
    onChange(updated);
  };

  return (
    <div
      className="space-y-6"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🎨 Different Versions</h3>
        <Button
          type="button"
          onClick={addVariant}
          className="bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Version
        </Button>
      </div>

      {variants.map((variant, variantIndex) => (
        <div key={variantIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Version {variantIndex + 1}</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditingVariant(editingVariant === variantIndex ? null : variantIndex)
                }
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeVariant(variantIndex)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {editingVariant === variantIndex && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">What makes this different?</label>
                <Input
                  value={variant.name}
                  onChange={(e) => updateVariant(variantIndex, 'name', e.target.value)}
                  placeholder="Like: Color, Size, or Style"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${variantIndex}`}
                  checked={variant.required}
                  onChange={(e) => updateVariant(variantIndex, 'required', e.target.checked)}
                />
                <label htmlFor={`required-${variantIndex}`} className="text-sm">
                  Must Pick One? ✅
                </label>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">🛍️ Choices</h5>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(variantIndex)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Choice
              </Button>
            </div>

            {variant.options.map((option, optionIndex) => (
              <div key={optionIndex} className="border border-gray-100 rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Choice {optionIndex + 1}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingOption(
                          editingOption?.variantIndex === variantIndex &&
                            editingOption?.optionIndex === optionIndex
                            ? null
                            : { variantIndex, optionIndex },
                        )
                      }
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOption(variantIndex, optionIndex)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {editingOption?.variantIndex === variantIndex &&
                  editingOption?.optionIndex === optionIndex && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Name (what customers see)
                        </label>
                        <Input
                          value={option.label}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            // Basic label update
                            updateOption(variantIndex, optionIndex, 'label', newLabel);
                            // Special handling: if this is a color variant and label is 'RGB', we shouldn't require a specific color value
                            if (variant.type === 'color') {
                              const isRGB = newLabel.trim().toLowerCase() === 'rgb';
                              if (isRGB) {
                                // Clear code value and set specification to 'RGB'
                                const updated = [...variants];
                                const opt = updated[variantIndex].options[optionIndex];
                                opt.value = 'RGB';
                                if (!opt.specifications) opt.specifications = [];
                                const colorSpecIndex = opt.specifications.findIndex(
                                  (s) => s.name.toLowerCase() === 'color',
                                );
                                if (colorSpecIndex >= 0) {
                                  opt.specifications[colorSpecIndex].value = 'RGB';
                                } else {
                                  opt.specifications.push({ name: 'Color', value: 'RGB' });
                                }
                                onChange(updated);
                              }
                            }
                          }}
                          placeholder="Like: Red, Large, Cotton"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Code (for the computer)
                        </label>
                        <div className="relative">
                          <Input
                            value={option.value}
                            onChange={(e) => {
                              updateOption(variantIndex, optionIndex, 'value', e.target.value);
                            }}
                            placeholder={
                              variant.type === 'color'
                                ? option.label.trim().toLowerCase() === 'rgb'
                                  ? 'No code needed for RGB'
                                  : 'e.g., #FF0000 or rgb(255,0,0)'
                                : 'Enter value'
                            }
                            disabled={
                              variant.type === 'color' &&
                              option.label.trim().toLowerCase() === 'rgb'
                            }
                            className={variant.type === 'color' ? 'pl-10' : ''}
                          />
                          {variant.type === 'color' && (
                            <>
                              {(() => {
                                const isRGBName = option.label.trim().toLowerCase() === 'rgb';
                                return (
                                  <>
                                    <div
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-gray-300 cursor-pointer"
                                      style={
                                        isRGBName
                                          ? {
                                              background:
                                                'linear-gradient(135deg, #ff6b6b 0%, #4dff88 50%, #6ba8ff 100%)',
                                            }
                                          : {
                                              backgroundColor: isColorValue(option.value)
                                                ? option.value
                                                : '#ffffff',
                                            }
                                      }
                                      onClick={() => {
                                        if (!isRGBName) {
                                          setShowColorPicker({
                                            variantIndex,
                                            optionIndex,
                                          });
                                        }
                                      }}
                                    />
                                    {!isRGBName &&
                                      showColorPicker?.variantIndex === variantIndex &&
                                      showColorPicker?.optionIndex === optionIndex && (
                                        <div className="absolute z-10 mt-1">
                                          <div
                                            className="fixed inset-0"
                                            onClick={() => setShowColorPicker(null)}
                                          />
                                          <ChromePicker
                                            color={
                                              isColorValue(option.value) ? option.value : '#000000'
                                            }
                                            onChange={(color: ColorResult) =>
                                              handleColorChange(color, variantIndex, optionIndex)
                                            }
                                          />
                                        </div>
                                      )}
                                    {!isRGBName && (
                                      <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
                                        title="Pick color from screen"
                                        onClick={() => {
                                          if ('EyeDropper' in window) {
                                            const eyeDropper = new EyeDropper();
                                            eyeDropper
                                              .open()
                                              .then((result) => {
                                                updateOption(
                                                  variantIndex,
                                                  optionIndex,
                                                  'value',
                                                  result.sRGBHex,
                                                );
                                              })
                                              .catch(() => {
                                                // User canceled or failed
                                              });
                                          } else {
                                            // Fallback for browsers that don't support EyeDropper API
                                            setShowColorPicker({
                                              variantIndex,
                                              optionIndex,
                                            });
                                          }
                                        }}
                                      />
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          💰 Extra Cost (+ or -)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            tempPriceInputs[`${variantIndex}-${optionIndex}`] ??
                            String(option.priceModifier ?? 0)
                          }
                          onChange={(e) => {
                            const key = `${variantIndex}-${optionIndex}`;
                            setTempPriceInputs((prev) => ({ ...prev, [key]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const key = `${variantIndex}-${optionIndex}`;
                            const raw = e.target.value.trim();
                            const num = raw === '' ? 0 : parseFloat(raw);
                            updateOption(
                              variantIndex,
                              optionIndex,
                              'priceModifier',
                              isNaN(num) ? 0 : num,
                            );
                            setTempPriceInputs(({ [key]: _, ...rest }) => {
                              console.log(_);
                              return rest;
                            });
                          }}
                          placeholder="0 = same price, 10 = $10 more"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          📦 How Many Available
                        </label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={
                            tempStockInputs[`${variantIndex}-${optionIndex}`] ??
                            String(option.stockModifier ?? 0)
                          }
                          onChange={(e) => {
                            const key = `${variantIndex}-${optionIndex}`;
                            setTempStockInputs((prev) => ({ ...prev, [key]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const key = `${variantIndex}-${optionIndex}`;
                            const raw = e.target.value.trim();
                            const num = raw === '' ? 0 : parseInt(raw, 10);
                            updateOption(
                              variantIndex,
                              optionIndex,
                              'stockModifier',
                              isNaN(num) ? 0 : num,
                            );
                            setTempStockInputs(({ [key]: _, ...rest }) => {
                              console.log(_);
                              return rest;
                            });
                          }}
                          placeholder="Leave 0 to use main stock number"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium">📋 Extra Details</label>
                          <Button
                            type="button"
                            variant="outline"
                            size={'sm'}
                            onClick={() => addSpecification(variantIndex, optionIndex)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Detail
                          </Button>
                        </div>
                        {option.specifications?.map((spec, specIndex) => (
                          <div key={specIndex} className="flex gap-2 mb-2">
                            <Input
                              value={spec.name}
                              onChange={(e) =>
                                updateSpecification(
                                  variantIndex,
                                  optionIndex,
                                  specIndex,
                                  'name',
                                  e.target.value,
                                )
                              }
                              placeholder="Detail name"
                            />
                            <Input
                              value={spec.value}
                              onChange={(e) =>
                                updateSpecification(
                                  variantIndex,
                                  optionIndex,
                                  specIndex,
                                  'value',
                                  e.target.value,
                                )
                              }
                              placeholder="Detail info"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                removeSpecification(variantIndex, optionIndex, specIndex)
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {!(
                  editingOption?.variantIndex === variantIndex &&
                  editingOption?.optionIndex === optionIndex
                ) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{option.label}</span>
                    {option.priceModifier !== 0 && (
                      <span className="ml-2 text-blue-600">
                        ({option.priceModifier > 0 ? '+' : ''}${option.priceModifier})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {variants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No different versions yet. Click Add New Version to start!</p>
        </div>
      )}
    </div>
  );
};

export default VariantManager;
