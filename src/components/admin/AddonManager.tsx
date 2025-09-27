'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Addon, AddonOption } from '@/lib/productVariants';

interface AddonManagerProps {
  addons: Addon[];
  onChange: (addons: Addon[]) => void;
}

const AddonManager: React.FC<AddonManagerProps> = ({ addons, onChange }) => {
  const [editingAddon, setEditingAddon] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<{
    addonIndex: number;
    optionIndex: number;
  } | null>(null);

  const addAddon = () => {
    const newAddon: Addon = {
      name: '',
      description: '',
      type: 'checkbox',
      required: false,
      maxQuantity: 1,
      options: [],
    };
    onChange([...addons, newAddon]);
    setEditingAddon(addons.length);
  };

  const updateAddon = (index: number, field: keyof Addon, value: string | number) => {
    const updated = [...addons];
    // Always enforce checkbox type and optional selection
    updated[index] = { ...updated[index], [field]: value, type: 'checkbox', required: false };
    onChange(updated);
  };

  const removeAddon = (index: number) => {
    const updated = addons.filter((_, i) => i !== index);
    onChange(updated);
    if (editingAddon === index) {
      setEditingAddon(null);
    }
  };

  const addOption = (addonIndex: number) => {
    const newOption: AddonOption = {
      label: '',
      price: 0,
      description: '',
    };
    const updated = [...addons];
    updated[addonIndex].options.push(newOption);
    onChange(updated);
    setEditingOption({ addonIndex, optionIndex: updated[addonIndex].options.length - 1 });
  };

  const updateOption = (
    addonIndex: number,
    optionIndex: number,
    field: keyof AddonOption,
    value: string | number,
  ) => {
    const updated = [...addons];
    updated[addonIndex].options[optionIndex] = {
      ...updated[addonIndex].options[optionIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const removeOption = (addonIndex: number, optionIndex: number) => {
    const updated = [...addons];
    updated[addonIndex].options = updated[addonIndex].options.filter((_, i) => i !== optionIndex);
    onChange(updated);
    if (editingOption?.addonIndex === addonIndex && editingOption?.optionIndex === optionIndex) {
      setEditingOption(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Add-ons</h3>
        <Button type="button" onClick={addAddon} className="bg-(--color-logo) text-white hover:bg-(--color-logo)/90" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Add-on
        </Button>
      </div>

      {addons.map((addon, addonIndex) => (
        <div key={addonIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Add-on {addonIndex + 1}</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAddon(editingAddon === addonIndex ? null : addonIndex)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeAddon(addonIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {editingAddon === addonIndex && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Add-on Name</label>
                <Input
                  value={addon.name}
                  onChange={(e) => updateAddon(addonIndex, 'name', e.target.value)}
                  placeholder="e.g., Extended Warranty, Gift Wrapping"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                {/* Locked to checkbox per requirements */}
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                  Checkbox (Multiple Selection)
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={addon.description || ''}
                  onChange={(e) => updateAddon(addonIndex, 'description', e.target.value)}
                  placeholder="Optional description for this add-on"
                  rows={2}
                />
              </div>
              {/* Required toggle removed: add-ons are always optional */}
              {addon.type === 'quantity' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Max Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={addon.maxQuantity}
                    onChange={(e) =>
                      updateAddon(addonIndex, 'maxQuantity', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Options</h5>
              <Button type="button" variant="outline" size="sm" onClick={() => addOption(addonIndex)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>

            {addon.options.map((option, optionIndex) => (
              <div key={optionIndex} className="border border-gray-100 rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Option {optionIndex + 1}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingOption(
                          editingOption?.addonIndex === addonIndex &&
                            editingOption?.optionIndex === optionIndex
                            ? null
                            : { addonIndex, optionIndex },
                        )
                      }
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOption(addonIndex, optionIndex)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {editingOption?.addonIndex === addonIndex &&
                  editingOption?.optionIndex === optionIndex && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Label</label>
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            updateOption(addonIndex, optionIndex, 'label', e.target.value)
                          }
                          placeholder="e.g., 2 Year Warranty, Premium Box"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={option.price}
                          onChange={(e) =>
                            updateOption(
                              addonIndex,
                              optionIndex,
                              'price',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <Textarea
                          value={option.description || ''}
                          onChange={(e) =>
                            updateOption(addonIndex, optionIndex, 'description', e.target.value)
                          }
                          placeholder="Optional detailed description"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                {!(
                  editingOption?.addonIndex === addonIndex &&
                  editingOption?.optionIndex === optionIndex
                ) && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-blue-600 font-semibold">
                        +${option.price.toFixed(2)}
                      </span>
                    </div>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {addons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No add-ons configured. Click Add Add-on to get started.</p>
        </div>
      )}
    </div>
  );
};

export default AddonManager;
