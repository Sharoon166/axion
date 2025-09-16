'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Variant, VariantOption } from '@/lib/productVariants';

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

  const detectTypeFromName = (name: string): Variant['type'] => {
    const n = name.toLowerCase();
    if (n.includes('color') || n.includes('colour') || n.includes('colours')) return 'color';
    return 'size'; // render as tag-style for anything else
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
    const newOption: VariantOption = {
      label: '',
      value: '',
      priceModifier: 0,
      stockModifier: 0,
      specifications: [],
    };
    const updated = [...variants];
    updated[variantIndex].options.push(newOption);
    onChange(updated);
    setEditingOption({ variantIndex, optionIndex: updated[variantIndex].options.length - 1 });
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
        <Button type="button" onClick={addVariant} className='bg-(--color-logo) text-white hover:bg-(--color-logo)/90' size="sm">
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
              <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(variantIndex)}>
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
              <Button type="button" variant="outline" size="sm" onClick={() => addOption(variantIndex)}>
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
                        <label className="block text-xs font-medium mb-1">Name (what customers see)</label>
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            updateOption(variantIndex, optionIndex, 'label', e.target.value)
                          }
                          placeholder="Like: Red, Large, Cotton"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Code (for the computer)</label>
                        <Input
                          value={option.value}
                          onChange={(e) =>
                            updateOption(variantIndex, optionIndex, 'value', e.target.value)
                          }
                          placeholder="Like: #ff0000, L, cotton"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">💰 Extra Cost (+ or -)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={option.priceModifier}
                          onChange={(e) =>
                            updateOption(
                              variantIndex,
                              optionIndex,
                              'priceModifier',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0 = same price, 10 = $10 more"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">📦 How Many Available</label>
                        <Input
                          type="number"
                          value={option.stockModifier}
                          onChange={(e) =>
                            updateOption(
                              variantIndex,
                              optionIndex,
                              'stockModifier',
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="Leave 0 to use main stock number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">🖼️ Picture Link (optional)</label>
                        <Input
                          value={option.image || ''}
                          onChange={(e) =>
                            updateOption(variantIndex, optionIndex, 'image', e.target.value)
                          }
                          placeholder="Link to picture for this choice"
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
