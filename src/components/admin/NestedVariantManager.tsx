'use client';

import { Trash2, Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChromePicker } from 'react-color';
import type {
  Variant,
  VariantOption,
  SubVariant,
  SubVariantOption,
  SubSubVariant,
  SubSubVariantOption,
} from '@/lib/productVariants';
import React, { useState } from 'react';

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

// Reusable config for the color picker overlays
type ColorPickerConfig = {
  type: 'variant' | 'subvariant' | 'subsubvariant';
  variantIndex: number;
  optionIndex?: number;
  subVariantIndex?: number;
  subOptionIndex?: number;
  subSubVariantIndex?: number;
  subSubOptionIndex?: number;
};

interface NestedVariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

const NestedVariantManager: React.FC<NestedVariantManagerProps> = ({ variants = [], onChange }) => {
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set());
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  const [expandedSubVariants, setExpandedSubVariants] = useState<Set<string>>(new Set());
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<{
    variantIndex: number;
    optionIndex: number;
  } | null>(null);
  const [editingSubVariant, setEditingSubVariant] = useState<{
    variantIndex: number;
    optionIndex: number;
    subVariantIndex: number;
  } | null>(null);
  const [editingSubOption, setEditingSubOption] = useState<{
    variantIndex: number;
    optionIndex: number;
    subVariantIndex: number;
    subOptionIndex: number;
  } | null>(null);
  const [editingSubSubVariant, setEditingSubSubVariant] = useState<{
    variantIndex: number;
    optionIndex: number;
    subVariantIndex: number;
    subOptionIndex: number;
    subSubVariantIndex: number;
  } | null>(null);
  const [editingSubSubOption, setEditingSubSubOption] = useState<{
    variantIndex: number;
    optionIndex: number;
    subVariantIndex: number;
    subOptionIndex: number;
    subSubVariantIndex: number;
    subSubOptionIndex: number;
  } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<ColorPickerConfig | null>(null);

  const detectTypeFromName = (name: string): Variant['type'] => {
    const n = name.toLowerCase();
    if (n.includes('color') || n.includes('colour')) return 'color';
    if (n.includes('size')) return 'size';
    return 'dropdown';
  };

  const isColorValue = (value: string): boolean => {
    const colorRegex =
      /^(#([0-9A-F]{3}){1,2}$|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[01]?\d?\d?\s*\))$/i;
    return colorRegex.test(value);
  };

  const toggleExpanded = (type: 'variant' | 'option' | 'subvariant', key: string | number) => {
    if (type === 'variant') {
      const newExpanded = new Set(expandedVariants);
      if (newExpanded.has(key as number)) {
        newExpanded.delete(key as number);
      } else {
        newExpanded.add(key as number);
      }
      setExpandedVariants(newExpanded);
    } else if (type === 'option') {
      const newExpanded = new Set(expandedOptions);
      if (newExpanded.has(key as string)) {
        newExpanded.delete(key as string);
      } else {
        newExpanded.add(key as string);
      }
      setExpandedOptions(newExpanded);
    } else if (type === 'subvariant') {
      const newExpanded = new Set(expandedSubVariants);
      if (newExpanded.has(key as string)) {
        newExpanded.delete(key as string);
      } else {
        newExpanded.add(key as string);
      }
      setExpandedSubVariants(newExpanded);
    }
  };

  // Variant operations
  const addVariant = () => {
    const newVariant: Variant = {
      _id: `variant-${Date.now()}`,
      name: '',
      type: 'dropdown',
      required: false,
      options: [],
    };

    const currentVariants = Array.isArray(variants) ? [...variants] : [];
    const updatedVariants = [...currentVariants, newVariant];

    onChange(updatedVariants);
    setEditingVariant(updatedVariants.length - 1);
    setExpandedVariants(new Set([...expandedVariants, updatedVariants.length - 1]));
    toast.success('Variant added successfully');
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    const updated = [...variants];
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

    const newExpanded = new Set(expandedVariants);
    newExpanded.delete(index);
    setExpandedVariants(newExpanded);
  };

  // Variant option operations
  const addOption = (variantIndex: number) => {
    const variant = variants[variantIndex];
    const isColorVariant = variant.type === 'color';

    const newOption: VariantOption = {
      _id: `option-${Date.now()}`,
      label: isColorVariant ? '#000000' : '',
      value: isColorVariant ? '#000000' : '',
      priceModifier: 0,
      stock: 0,
      specifications: isColorVariant ? [{ name: 'Color', value: '#000000' }] : [],
      type: variant.type as VariantOption['type'],
      variantIndex: variantIndex,
    };

    const updated = [...variants];
    updated[variantIndex].options.push(newOption);

    onChange(updated);

    const newOptionIndex = updated[variantIndex].options.length - 1;
    setEditingOption({ variantIndex, optionIndex: newOptionIndex });

    if (isColorVariant) {
      setShowColorPicker({
        type: 'variant',
        variantIndex,
        optionIndex: newOptionIndex,
      });
    }
  };

  const updateOption = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number | boolean | Record<string, unknown> | { name: string; value: string }[],
  ) => {
    const updated = [...variants];
    const updatedOption = {
      ...updated[variantIndex].options[optionIndex],
      [field]: value,
    };

    updated[variantIndex].options[optionIndex] = updatedOption;
    onChange(updated);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].options = updated[variantIndex].options.filter(
      (_, i) => i !== optionIndex,
    );

    if (updated[variantIndex].options.length === 0) {
      removeVariant(variantIndex);
    } else {
      onChange(updated);
    }

    if (
      editingOption?.variantIndex === variantIndex &&
      editingOption?.optionIndex === optionIndex
    ) {
      setEditingOption(null);
    }
  };

  // Sub-variant operations
  const addSubVariant = (e: React.MouseEvent, variantIndex: number, optionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const newSubVariant: SubVariant = {
      _id: `subvariant-${Date.now()}`,
      name: '',
      type: 'dropdown',
      required: false,
      options: [],
    };

    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (!Array.isArray(option.subVariants)) {
      option.subVariants = [];
    }

    // Clear parent option stock since it now has sub-variants
    if (option.subVariants.length === 0) {
      option.stock = 0;
    }

    (option.subVariants as SubVariant[]).push(newSubVariant);
    onChange(updated);

    const newSubVariantIndex = (option.subVariants as SubVariant[]).length - 1;
    setEditingSubVariant({ variantIndex, optionIndex, subVariantIndex: newSubVariantIndex });

    const optionKey = `${variantIndex}-${optionIndex}`;
    setExpandedOptions(new Set([...expandedOptions, optionKey]));

    toast.success('Sub-variant added successfully');
  };

  const updateSubVariant = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    field: keyof SubVariant,
    value: string | number | boolean,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      if (field === 'name' && typeof value === 'string') {
        const type = detectTypeFromName(value);
        subVariants[subVariantIndex] = { ...subVariants[subVariantIndex], [field]: value, type };
      } else {
        subVariants[subVariantIndex] = { ...subVariants[subVariantIndex], [field]: value };
      }
    }

    onChange(updated);
  };

  const removeSubVariant = (variantIndex: number, optionIndex: number, subVariantIndex: number) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      subVariants.splice(subVariantIndex, 1);

      if (subVariants.length === 0) {
        option.subVariants = undefined;
      }
    }

    onChange(updated);
  };

  // Sub-variant option operations
  const addSubOption = (variantIndex: number, optionIndex: number, subVariantIndex: number) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subVariant = subVariants[subVariantIndex];
      const isColorVariant = subVariant.type === 'color';

      const newSubOption: SubVariantOption = {
        _id: `suboption-${Date.now()}`,
        label: isColorVariant ? '#000000' : '',
        value: isColorVariant ? '#000000' : '',
        priceModifier: 0,
        stock: 0,
        specifications: isColorVariant ? [{ name: 'Color', value: '#000000' }] : [],
      };

      subVariant.options.push(newSubOption);
      onChange(updated);

      const newSubOptionIndex = subVariant.options.length - 1;
      setEditingSubOption({
        variantIndex,
        optionIndex,
        subVariantIndex,
        subOptionIndex: newSubOptionIndex,
      });

      if (isColorVariant) {
        setShowColorPicker({
          type: 'subvariant',
          variantIndex,
          optionIndex,
          subVariantIndex,
          subOptionIndex: newSubOptionIndex,
        });
      }
    }
  };

  const updateSubOption = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    field: keyof SubVariantOption,
    value: string | number | boolean | Record<string, unknown> | { name: string; value: string }[],
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];
      subVariants[subVariantIndex].options[subOptionIndex] = {
        ...subOption,
        [field]: value,
      };
    }

    onChange(updated);
  };

  const removeSubOption = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      subVariants[subVariantIndex].options = subVariants[subVariantIndex].options.filter(
        (_, i) => i !== subOptionIndex,
      );

      if (subVariants[subVariantIndex].options.length === 0) {
        removeSubVariant(variantIndex, optionIndex, subVariantIndex);
      } else {
        onChange(updated);
      }
    }
  };

  // Sub-sub-variant operations
  const addSubSubVariant = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
  ) => {
    const newSubSubVariant: SubSubVariant = {
      _id: `subsubvariant-${Date.now()}`,
      name: '',
      type: 'dropdown',
      required: false,
      options: [],
    };

    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];

      if (!subOption.subSubVariants) {
        subOption.subSubVariants = [];
      }

      // Clear parent sub-option stock since it now has sub-sub-variants
      if (subOption.subSubVariants.length === 0) {
        subOption.stock = 0;
      }

      subOption.subSubVariants.push(newSubSubVariant);
      onChange(updated);

      const newSubSubVariantIndex = subOption.subSubVariants.length - 1;
      setEditingSubSubVariant({
        variantIndex,
        optionIndex,
        subVariantIndex,
        subOptionIndex,
        subSubVariantIndex: newSubSubVariantIndex,
      });

      const subVariantKey = `${variantIndex}-${optionIndex}-${subVariantIndex}`;
      setExpandedSubVariants(new Set([...expandedSubVariants, subVariantKey]));

      toast.success('Sub-sub-variant added successfully');
    }
  };

  // Update a sub-sub-variant's metadata
  const updateSubSubVariant = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    subSubVariantIndex: number,
    field: keyof SubSubVariant,
    value: string | number | boolean,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];
      if (subOption.subSubVariants) {
        const subSubVariants = subOption.subSubVariants as SubSubVariant[];
        if (field === 'name' && typeof value === 'string') {
          const type = detectTypeFromName(value);
          subSubVariants[subSubVariantIndex] = {
            ...subSubVariants[subSubVariantIndex],
            [field]: value,
            type,
          };
        } else {
          subSubVariants[subSubVariantIndex] = {
            ...subSubVariants[subSubVariantIndex],
            [field]: value,
          } as SubSubVariant;
        }
      }
    }

    onChange(updated);
  };

  // Remove a sub-sub-variant
  const removeSubSubVariant = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    subSubVariantIndex: number,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];

      if (subOption.subSubVariants) {
        subOption.subSubVariants.splice(subSubVariantIndex, 1);
        if (subOption.subSubVariants.length === 0) {
          subOption.subSubVariants = undefined;
        }
      }
    }

    onChange(updated);
  };

  // Add an option to a sub-sub-variant
  const addSubSubOption = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    subSubVariantIndex: number,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];
      const subSubVariant = subOption.subSubVariants![subSubVariantIndex];
      const isColorVariant = subSubVariant.type === 'color';

      const newSubSubOption: SubSubVariantOption = {
        _id: `subsuboption-${Date.now()}`,
        label: isColorVariant ? '#000000' : '',
        value: isColorVariant ? '#000000' : '',
        name: '',
        options: [],
        priceModifier: 0,
        stock: 0,
        specifications: isColorVariant ? [{ name: 'Color', value: '#000000' }] : [],
      };

      subSubVariant.options.push(newSubSubOption);
      onChange(updated);

      const newIndex = subSubVariant.options.length - 1;
      setEditingSubSubOption({
        variantIndex,
        optionIndex,
        subVariantIndex,
        subOptionIndex,
        subSubVariantIndex,
        subSubOptionIndex: newIndex,
      });

      if (isColorVariant) {
        setShowColorPicker({
          type: 'subsubvariant',
          variantIndex,
          optionIndex,
          subVariantIndex,
          subOptionIndex,
          subSubVariantIndex,
          subSubOptionIndex: newIndex,
        });
      }
    }
  };

  // Update a sub-sub-variant option
  const updateSubSubOption = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    subSubVariantIndex: number,
    subSubOptionIndex: number,
    field: keyof SubSubVariantOption,
    value: string | number | boolean | Record<string, unknown> | { name: string; value: string }[],
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];
      const subSubVariant = subOption.subSubVariants![subSubVariantIndex];
      const target = subSubVariant.options[subSubOptionIndex];
      subSubVariant.options[subSubOptionIndex] = {
        ...target,
        [field]: value,
      } as SubSubVariantOption;
    }

    onChange(updated);
  };

  // Remove a sub-sub-variant option
  const removeSubSubOption = (
    variantIndex: number,
    optionIndex: number,
    subVariantIndex: number,
    subOptionIndex: number,
    subSubVariantIndex: number,
    subSubOptionIndex: number,
  ) => {
    const updated = [...variants];
    const option = updated[variantIndex].options[optionIndex];

    if (Array.isArray(option.subVariants)) {
      const subVariants = option.subVariants as SubVariant[];
      const subOption = subVariants[subVariantIndex].options[subOptionIndex];
      const subSubVariant = subOption.subSubVariants![subSubVariantIndex];
      subSubVariant.options.splice(subSubOptionIndex, 1);
    }

    onChange(updated);
  };

  const handleColorChange = (color: ColorResult, config: ColorPickerConfig) => {
    const colorValue =
      color.rgb.a === 1
        ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
        : `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;

    const colorSpec = [{ name: 'Color', value: colorValue }];

    if (config.type === 'variant') {
      updateOption(config.variantIndex, config.optionIndex!, 'value', colorValue);
      updateOption(config.variantIndex, config.optionIndex!, 'label', colorValue);
      updateOption(config.variantIndex, config.optionIndex!, 'specifications', colorSpec);
    } else if (config.type === 'subvariant') {
      updateSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        'value',
        colorValue,
      );
      updateSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        'label',
        colorValue,
      );
      updateSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        'specifications',
        colorSpec,
      );
    } else if (config.type === 'subsubvariant') {
      updateSubSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        config.subSubVariantIndex!,
        config.subSubOptionIndex!,
        'value',
        colorValue,
      );
      updateSubSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        config.subSubVariantIndex!,
        config.subSubOptionIndex!,
        'label',
        colorValue,
      );
      updateSubSubOption(
        config.variantIndex,
        config.optionIndex!,
        config.subVariantIndex!,
        config.subOptionIndex!,
        config.subSubVariantIndex!,
        config.subSubOptionIndex!,
        'specifications',
        colorSpec,
      );
    }
  };

  const calculateTotalStock = (): number => {
    return variants.reduce((total, variant) => {
      return (
        total +
        variant.options.reduce((variantTotal, option) => {
          // If option has sub-variants, don't count its stock, count sub-variants instead
          if (Array.isArray(option.subVariants) && option.subVariants.length > 0) {
            const subVariants = option.subVariants as SubVariant[];
            return (
              variantTotal +
              subVariants.reduce((subTotal, subVariant) => {
                return (
                  subTotal +
                  subVariant.options.reduce((subOptionTotal, subOption) => {
                    // If sub-option has sub-sub-variants, don't count its stock, count sub-sub-variants instead
                    if (subOption.subSubVariants && subOption.subSubVariants.length > 0) {
                      return (
                        subOptionTotal +
                        subOption.subSubVariants.reduce((subSubTotal, subSubVariant) => {
                          return (
                            subSubTotal +
                            subSubVariant.options.reduce((subSubOptionTotal, subSubOption) => {
                              return subSubOptionTotal + subSubOption.stock;
                            }, 0)
                          );
                        }, 0)
                      );
                    } else {
                      // This is a leaf node, count its stock
                      return subOptionTotal + subOption.stock;
                    }
                  }, 0)
                );
              }, 0)
            );
          } else {
            // This is a leaf node, count its stock
            return variantTotal + option.stock;
          }
        }, 0)
      );
    }, 0);
  };

  const safeVariants = Array.isArray(variants) ? variants : [];
  const totalStock = calculateTotalStock();
  const hasVariants = safeVariants.some((v) => v.options.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎨 Nested Product Variants</h3>
          <p className="text-sm text-gray-600">
            Create variants with sub-variants and sub-sub-variants for complex product
            configurations
          </p>
          {hasVariants && (
            <div className="text-sm mt-1 text-blue-600">
              Total Stock: {totalStock} units across all variant levels
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={addVariant}
          className="bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {safeVariants.map((variant, variantIndex) => (
        <div key={variant._id} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded('variant', variantIndex)}
              >
                {expandedVariants.has(variantIndex) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              <h4 className="font-medium">
                Variant {variantIndex + 1}: {variant.name || 'Unnamed'} ({variant.options.length}{' '}
                options)
              </h4>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4  rounded">
              <div>
                <Label htmlFor={`variant-name-${variantIndex}`}>Variant Name</Label>
                <Input
                  id={`variant-name-${variantIndex}`}
                  value={variant.name}
                  onChange={(e) => updateVariant(variantIndex, 'name', e.target.value)}
                  placeholder="e.g., Color, Size, Material"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${variantIndex}`}
                  checked={variant.required}
                  onChange={(e) => updateVariant(variantIndex, 'required', e.target.checked)}
                />
                <Label htmlFor={`required-${variantIndex}`}>Required Selection</Label>
              </div>
            </div>
          )}

          {expandedVariants.has(variantIndex) && (
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Options</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(variantIndex)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              {variant.options.map((option, optionIndex) => {
                const optionKey = `${variantIndex}-${optionIndex}`;
                const isExpanded = expandedOptions.has(optionKey);
                const hasSubVariants =
                  Array.isArray(option.subVariants) && option.subVariants.length > 0;

                return (
                  <div key={option._id} className="border border-gray-100 rounded p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded('option', optionKey)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </Button>
                        {variant.type === 'color' && (
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: isColorValue(option.value)
                                ? option.value
                                : '#ffffff',
                            }}
                          />
                        )}
                        <span className="font-medium text-sm">
                          {option.label || 'Unnamed'}
                          {hasSubVariants &&
                            ` (${(option.subVariants as SubVariant[]).length} sub-variants)`}
                        </span>
                      </div>
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
                        <div className="space-y-4 p-4  rounded">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Display Name</Label>
                              <Input
                                value={option.label}
                                onChange={(e) =>
                                  updateOption(variantIndex, optionIndex, 'label', e.target.value)
                                }
                                placeholder="e.g., Red, Large, Cotton"
                              />
                            </div>
                            <div>
                              <Label>Value/Code</Label>
                              <div className="relative">
                                <Input
                                  value={option.value}
                                  onChange={(e) =>
                                    updateOption(variantIndex, optionIndex, 'value', e.target.value)
                                  }
                                  placeholder={variant.type === 'color' ? '#FF0000' : 'value'}
                                  className={variant.type === 'color' ? 'pl-10' : ''}
                                />
                                {variant.type === 'color' && (
                                  <>
                                    <div
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                                      style={{
                                        backgroundColor: isColorValue(option.value)
                                          ? option.value
                                          : '#ffffff',
                                      }}
                                      onClick={() =>
                                        setShowColorPicker({
                                          type: 'variant',
                                          variantIndex,
                                          optionIndex,
                                        })
                                      }
                                    />
                                    {showColorPicker?.type === 'variant' &&
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
                                              handleColorChange(color, showColorPicker)
                                            }
                                          />
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Only show price modifier input if this option has no sub-variants */}
                            {(!Array.isArray(option.subVariants) ||
                              option.subVariants.length === 0) && (
                              <div>
                                <Label>Price Modifier</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={option.priceModifier === 0 ? '' : option.priceModifier}
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    updateOption(
                                      variantIndex,
                                      optionIndex,
                                      'priceModifier',
                                      isNaN(value) ? 0 : value,
                                    );
                                  }}
                                  placeholder="0.00"
                                  className="w-full"
                                />
                              </div>
                            )}
                            {/* Only show stock input if this option has no sub-variants */}
                            {(!Array.isArray(option.subVariants) ||
                              option.subVariants.length === 0) && (
                              <div>
                                <Label>Stock Quantity</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={option.stock === 0 ? '' : option.stock}
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    updateOption(
                                      variantIndex,
                                      optionIndex,
                                      'stock',
                                      isNaN(value) ? 0 : Math.max(0, value),
                                    );
                                  }}
                                  placeholder="0"
                                  className="w-full"
                                />
                              </div>
                            )}
                            <div>
                              <Label>SKU (Optional)</Label>
                              <Input
                                value={option.sku || ''}
                                onChange={(e) =>
                                  updateOption(variantIndex, optionIndex, 'sku', e.target.value)
                                }
                                placeholder="PROD-RED-L"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {isExpanded && (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                          <h6 className="font-medium text-sm">Sub-Variants</h6>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => addSubVariant(e, variantIndex, optionIndex)}
                            className="w-full h-8 text-xs px-3"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Sub-Variant
                          </Button>
                        </div>

                        {Array.isArray(option.subVariants) &&
                          (option.subVariants as SubVariant[]).map(
                            (subVariant, subVariantIndex) => {
                              const subVariantKey = `${variantIndex}-${optionIndex}-${subVariantIndex}`;
                              const isSubExpanded = expandedSubVariants.has(subVariantKey);

                              return (
                                <div
                                  key={subVariant._id}
                                  className="border border-gray-200 rounded p-2 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpanded('subvariant', subVariantKey)}
                                        className="p-1 h-6 w-6 flex-shrink-0"
                                      >
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                      </Button>
                                      <span className="text-sm font-medium break-words">
                                        {subVariant.name || 'Unnamed Sub-Variant'} (
                                        {subVariant.options.length} options)
                                      </span>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setEditingSubVariant(
                                            editingSubVariant?.variantIndex === variantIndex &&
                                              editingSubVariant?.optionIndex === optionIndex &&
                                              editingSubVariant?.subVariantIndex === subVariantIndex
                                              ? null
                                              : { variantIndex, optionIndex, subVariantIndex },
                                          )
                                        }
                                        className="p-1 h-6 w-6"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          removeSubVariant(
                                            variantIndex,
                                            optionIndex,
                                            subVariantIndex,
                                          )
                                        }
                                        className="p-1 h-6 w-6"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {editingSubVariant?.variantIndex === variantIndex &&
                                    editingSubVariant?.optionIndex === optionIndex &&
                                    editingSubVariant?.subVariantIndex === subVariantIndex && (
                                      <div className="space-y-2 p-2 bg-gray-50 rounded">
                                        <div>
                                          <Label className="text-sm">Sub-Variant Name</Label>
                                          <Input
                                            value={subVariant.name}
                                            onChange={(e) =>
                                              updateSubVariant(
                                                variantIndex,
                                                optionIndex,
                                                subVariantIndex,
                                                'name',
                                                e.target.value,
                                              )
                                            }
                                            placeholder="e.g., Size, Finish"
                                            className="w-full text-sm mt-1"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={subVariant.required}
                                            onChange={(e) =>
                                              updateSubVariant(
                                                variantIndex,
                                                optionIndex,
                                                subVariantIndex,
                                                'required',
                                                e.target.checked,
                                              )
                                            }
                                          />
                                          <Label className="text-sm">Required</Label>
                                        </div>
                                      </div>
                                    )}

                                  {isSubExpanded && (
                                    <div className="space-y-2">
                                      <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium">Sub-Options</span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            addSubOption(variantIndex, optionIndex, subVariantIndex)
                                          }
                                          className="w-full text-xs h-8 px-3"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Sub-Option
                                        </Button>
                                      </div>

                                      {subVariant.options.map((subOption, subOptionIndex) => (
                                        <div
                                          key={subOption._id}
                                          className="border border-gray-100 rounded p-2 space-y-2"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              {subVariant.type === 'color' && (
                                                <div
                                                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                                  style={{
                                                    backgroundColor: isColorValue(subOption.value)
                                                      ? subOption.value
                                                      : '#ffffff',
                                                  }}
                                                />
                                              )}
                                              <span className="text-sm truncate">
                                                {subOption.label || 'Unnamed'}
                                                {(!subOption.subSubVariants ||
                                                  subOption.subSubVariants.length === 0) &&
                                                  ` (Stock: ${subOption.stock})`}
                                                {subOption.subSubVariants &&
                                                  subOption.subSubVariants.length > 0 &&
                                                  ` (${subOption.subSubVariants.length} sub-sub-variants)`}
                                              </span>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setEditingSubOption(
                                                    editingSubOption?.variantIndex ===
                                                      variantIndex &&
                                                      editingSubOption?.optionIndex ===
                                                        optionIndex &&
                                                      editingSubOption?.subVariantIndex ===
                                                        subVariantIndex &&
                                                      editingSubOption?.subOptionIndex ===
                                                        subOptionIndex
                                                      ? null
                                                      : {
                                                          variantIndex,
                                                          optionIndex,
                                                          subVariantIndex,
                                                          subOptionIndex,
                                                        },
                                                  )
                                                }
                                                className="p-1 h-6 w-6"
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                  removeSubOption(
                                                    variantIndex,
                                                    optionIndex,
                                                    subVariantIndex,
                                                    subOptionIndex,
                                                  )
                                                }
                                                className="p-1 h-6 w-6"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>

                                          {editingSubOption?.variantIndex === variantIndex &&
                                            editingSubOption?.optionIndex === optionIndex &&
                                            editingSubOption?.subVariantIndex === subVariantIndex &&
                                            editingSubOption?.subOptionIndex === subOptionIndex && (
                                              <div className="space-y-3 p-2 bg-gray-50 rounded text-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                  <div>
                                                    <Label className="text-xs">Label</Label>
                                                    <Input
                                                      value={subOption.label}
                                                      onChange={(e) =>
                                                        updateSubOption(
                                                          variantIndex,
                                                          optionIndex,
                                                          subVariantIndex,
                                                          subOptionIndex,
                                                          'label',
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="Label"
                                                      className="text-sm mt-1"
                                                    />
                                                  </div>
                                                  <div>
                                                    <Label className="text-xs">Value</Label>
                                                    <div className="relative mt-1">
                                                      <Input
                                                        value={subOption.value}
                                                        onChange={(e) =>
                                                          updateSubOption(
                                                            variantIndex,
                                                            optionIndex,
                                                            subVariantIndex,
                                                            subOptionIndex,
                                                            'value',
                                                            e.target.value,
                                                          )
                                                        }
                                                        placeholder={
                                                          subVariant.type === 'color'
                                                            ? '#FF0000'
                                                            : 'Value'
                                                        }
                                                        className={`text-sm ${
                                                          subVariant.type === 'color' ? 'pl-10' : ''
                                                        }`}
                                                      />
                                                      {subVariant.type === 'color' && (
                                                        <>
                                                          <div
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                                                            style={{
                                                              backgroundColor: isColorValue(
                                                                subOption.value,
                                                              )
                                                                ? subOption.value
                                                                : '#ffffff',
                                                            }}
                                                            onClick={() =>
                                                              setShowColorPicker({
                                                                type: 'subvariant',
                                                                variantIndex,
                                                                optionIndex,
                                                                subVariantIndex,
                                                                subOptionIndex,
                                                              })
                                                            }
                                                          />
                                                          {showColorPicker?.type === 'subvariant' &&
                                                            showColorPicker?.variantIndex ===
                                                              variantIndex &&
                                                            showColorPicker?.optionIndex ===
                                                              optionIndex &&
                                                            showColorPicker?.subVariantIndex ===
                                                              subVariantIndex &&
                                                            showColorPicker?.subOptionIndex ===
                                                              subOptionIndex && (
                                                              <div className="absolute z-10 mt-1 right-0">
                                                                <div
                                                                  className="fixed inset-0"
                                                                  onClick={() =>
                                                                    setShowColorPicker(null)
                                                                  }
                                                                />
                                                                <ChromePicker
                                                                  color={
                                                                    isColorValue(subOption.value)
                                                                      ? subOption.value
                                                                      : '#000000'
                                                                  }
                                                                  onChange={(color: ColorResult) =>
                                                                    handleColorChange(
                                                                      color,
                                                                      showColorPicker,
                                                                    )
                                                                  }
                                                                />
                                                              </div>
                                                            )}
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                  {/* Only show price modifier input if this sub-option has no sub-sub-variants */}
                                                  {(!subOption.subSubVariants ||
                                                    subOption.subSubVariants.length === 0) && (
                                                    <div>
                                                      <Label className="text-xs">Price +/-</Label>
                                                      <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                          subOption.priceModifier === 0
                                                            ? ''
                                                            : subOption.priceModifier
                                                        }
                                                        onChange={(e) => {
                                                          const value =
                                                            e.target.value === ''
                                                              ? 0
                                                              : parseFloat(e.target.value);
                                                          updateSubOption(
                                                            variantIndex,
                                                            optionIndex,
                                                            subVariantIndex,
                                                            subOptionIndex,
                                                            'priceModifier',
                                                            isNaN(value) ? 0 : value,
                                                          );
                                                        }}
                                                        placeholder="0.00"
                                                        className="h-8 text-xs mt-1"
                                                      />
                                                    </div>
                                                  )}
                                                  {/* Only show stock input if this sub-option has no sub-sub-variants */}
                                                  {(!subOption.subSubVariants ||
                                                    subOption.subSubVariants.length === 0) && (
                                                    <div>
                                                      <Label className="text-xs">Stock</Label>
                                                      <Input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                          subOption.stock === 0
                                                            ? ''
                                                            : subOption.stock
                                                        }
                                                        onChange={(e) => {
                                                          const value =
                                                            e.target.value === ''
                                                              ? 0
                                                              : parseInt(e.target.value, 10);
                                                          updateSubOption(
                                                            variantIndex,
                                                            optionIndex,
                                                            subVariantIndex,
                                                            subOptionIndex,
                                                            'stock',
                                                            isNaN(value) ? 0 : Math.max(0, value),
                                                          );
                                                        }}
                                                        placeholder="0"
                                                        className="h-8 text-xs mt-1"
                                                      />
                                                    </div>
                                                  )}
                                                </div>

                                                <div>
                                                  <div className="flex flex-col gap-2">
                                                    <Label className="text-xs font-medium">
                                                      Sub-Sub-Variants
                                                    </Label>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        addSubSubVariant(
                                                          variantIndex,
                                                          optionIndex,
                                                          subVariantIndex,
                                                          subOptionIndex,
                                                        )
                                                      }
                                                      className="text-xs w-full h-7 px-2"
                                                    >
                                                      <Plus className="w-2 h-2 mr-1" />
                                                      Add Sub-Sub-Variant
                                                    </Button>
                                                  </div>

                                                  {subOption.subSubVariants &&
                                                    subOption.subSubVariants.length > 0 && (
                                                      <div className="mt-2 space-y-2">
                                                        {subOption.subSubVariants.map(
                                                          (subSubVariant, subSubVariantIndex) => (
                                                            <div
                                                              key={subSubVariant._id}
                                                              className="border border-gray-200 rounded p-2 space-y-2 bg-white"
                                                            >
                                                              <div className="flex items-center justify-between gap-2">
                                                                <span className="text-xs font-medium break-words">
                                                                  {subSubVariant.name ||
                                                                    'Unnamed Sub-Sub-Variant'}{' '}
                                                                  ({subSubVariant.options.length}{' '}
                                                                  options)
                                                                </span>
                                                                <div className="flex gap-1 flex-shrink-0">
                                                                  <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                      setEditingSubSubVariant(
                                                                        editingSubSubVariant?.variantIndex ===
                                                                          variantIndex &&
                                                                          editingSubSubVariant?.optionIndex ===
                                                                            optionIndex &&
                                                                          editingSubSubVariant?.subVariantIndex ===
                                                                            subVariantIndex &&
                                                                          editingSubSubVariant?.subOptionIndex ===
                                                                            subOptionIndex &&
                                                                          editingSubSubVariant?.subSubVariantIndex ===
                                                                            subSubVariantIndex
                                                                          ? null
                                                                          : {
                                                                              variantIndex,
                                                                              optionIndex,
                                                                              subVariantIndex,
                                                                              subOptionIndex,
                                                                              subSubVariantIndex,
                                                                            },
                                                                      )
                                                                    }
                                                                    className="p-0.5 h-5 w-5"
                                                                  >
                                                                    <Edit className="w-2 h-2" />
                                                                  </Button>
                                                                  <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                      removeSubSubVariant(
                                                                        variantIndex,
                                                                        optionIndex,
                                                                        subVariantIndex,
                                                                        subOptionIndex,
                                                                        subSubVariantIndex,
                                                                      )
                                                                    }
                                                                    className="p-0.5 h-5 w-5"
                                                                  >
                                                                    <Trash2 className="w-2 h-2" />
                                                                  </Button>
                                                                </div>
                                                              </div>

                                                              {editingSubSubVariant?.variantIndex ===
                                                                variantIndex &&
                                                                editingSubSubVariant?.optionIndex ===
                                                                  optionIndex &&
                                                                editingSubSubVariant?.subVariantIndex ===
                                                                  subVariantIndex &&
                                                                editingSubSubVariant?.subOptionIndex ===
                                                                  subOptionIndex &&
                                                                editingSubSubVariant?.subSubVariantIndex ===
                                                                  subSubVariantIndex && (
                                                                  <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                                    <div>
                                                                      <Label className="text-xs">
                                                                        Sub-Sub-Variant Name
                                                                      </Label>
                                                                      <Input
                                                                        value={subSubVariant.name}
                                                                        onChange={(e) =>
                                                                          updateSubSubVariant(
                                                                            variantIndex,
                                                                            optionIndex,
                                                                            subVariantIndex,
                                                                            subOptionIndex,
                                                                            subSubVariantIndex,
                                                                            'name',
                                                                            e.target.value,
                                                                          )
                                                                        }
                                                                        placeholder="e.g., Finish"
                                                                        className="text-xs mt-1"
                                                                      />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                      <input
                                                                        type="checkbox"
                                                                        checked={
                                                                          subSubVariant.required
                                                                        }
                                                                        onChange={(e) =>
                                                                          updateSubSubVariant(
                                                                            variantIndex,
                                                                            optionIndex,
                                                                            subVariantIndex,
                                                                            subOptionIndex,
                                                                            subSubVariantIndex,
                                                                            'required',
                                                                            e.target.checked,
                                                                          )
                                                                        }
                                                                      />
                                                                      <Label className="text-xs">
                                                                        Required
                                                                      </Label>
                                                                    </div>
                                                                  </div>
                                                                )}

                                                              <div className="flex flex-col gap-2">
                                                                <span className="text-xs font-medium">
                                                                  Sub-Sub-Options
                                                                </span>
                                                                <Button
                                                                  type="button"
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    addSubSubOption(
                                                                      variantIndex,
                                                                      optionIndex,
                                                                      subVariantIndex,
                                                                      subOptionIndex,
                                                                      subSubVariantIndex,
                                                                    )
                                                                  }
                                                                  className="text-xs w-full h-6 px-2"
                                                                >
                                                                  <Plus className="w-2 h-2 mr-0.5" />
                                                                  Add Option
                                                                </Button>
                                                              </div>

                                                              <div className="space-y-2">
                                                                {subSubVariant.options.map(
                                                                  (
                                                                    subSubOption,
                                                                    subSubOptionIndex,
                                                                  ) => (
                                                                    <div
                                                                      key={subSubOption._id}
                                                                      className="border border-gray-100 rounded p-2 space-y-2"
                                                                    >
                                                                      <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                          {subSubVariant.type ===
                                                                            'color' && (
                                                                            <div
                                                                              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                                                              style={{
                                                                                backgroundColor:
                                                                                  isColorValue(
                                                                                    subSubOption.value,
                                                                                  )
                                                                                    ? subSubOption.value
                                                                                    : '#ffffff',
                                                                              }}
                                                                            />
                                                                          )}
                                                                          <span className="text-xs truncate">
                                                                            {subSubOption.label ||
                                                                              'Unnamed'}{' '}
                                                                            (Stock:{' '}
                                                                            {subSubOption.stock})
                                                                          </span>
                                                                        </div>
                                                                        <div className="flex gap-1 flex-shrink-0">
                                                                          <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                              setEditingSubSubOption(
                                                                                editingSubSubOption?.variantIndex ===
                                                                                  variantIndex &&
                                                                                  editingSubSubOption?.optionIndex ===
                                                                                    optionIndex &&
                                                                                  editingSubSubOption?.subVariantIndex ===
                                                                                    subVariantIndex &&
                                                                                  editingSubSubOption?.subOptionIndex ===
                                                                                    subOptionIndex &&
                                                                                  editingSubSubOption?.subSubVariantIndex ===
                                                                                    subSubVariantIndex &&
                                                                                  editingSubSubOption?.subSubOptionIndex ===
                                                                                    subSubOptionIndex
                                                                                  ? null
                                                                                  : {
                                                                                      variantIndex,
                                                                                      optionIndex,
                                                                                      subVariantIndex,
                                                                                      subOptionIndex,
                                                                                      subSubVariantIndex,
                                                                                      subSubOptionIndex,
                                                                                    },
                                                                              )
                                                                            }
                                                                            className="p-0.5 h-5 w-5"
                                                                          >
                                                                            <Edit className="w-2 h-2" />
                                                                          </Button>
                                                                          <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                              removeSubSubOption(
                                                                                variantIndex,
                                                                                optionIndex,
                                                                                subVariantIndex,
                                                                                subOptionIndex,
                                                                                subSubVariantIndex,
                                                                                subSubOptionIndex,
                                                                              )
                                                                            }
                                                                            className="p-0.5 h-5 w-5"
                                                                          >
                                                                            <Trash2 className="w-2 h-2" />
                                                                          </Button>
                                                                        </div>
                                                                      </div>

                                                                      {editingSubSubOption?.variantIndex ===
                                                                        variantIndex &&
                                                                        editingSubSubOption?.optionIndex ===
                                                                          optionIndex &&
                                                                        editingSubSubOption?.subVariantIndex ===
                                                                          subVariantIndex &&
                                                                        editingSubSubOption?.subOptionIndex ===
                                                                          subOptionIndex &&
                                                                        editingSubSubOption?.subSubVariantIndex ===
                                                                          subSubVariantIndex &&
                                                                        editingSubSubOption?.subSubOptionIndex ===
                                                                          subSubOptionIndex && (
                                                                          <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                              <div>
                                                                                <Label className="text-xs">
                                                                                  Label
                                                                                </Label>
                                                                                <Input
                                                                                  value={
                                                                                    subSubOption.label
                                                                                  }
                                                                                  onChange={(e) =>
                                                                                    updateSubSubOption(
                                                                                      variantIndex,
                                                                                      optionIndex,
                                                                                      subVariantIndex,
                                                                                      subOptionIndex,
                                                                                      subSubVariantIndex,
                                                                                      subSubOptionIndex,
                                                                                      'label',
                                                                                      e.target
                                                                                        .value,
                                                                                    )
                                                                                  }
                                                                                  placeholder="Label"
                                                                                  className="text-xs mt-1"
                                                                                />
                                                                              </div>
                                                                              <div>
                                                                                <Label className="text-xs">
                                                                                  Value
                                                                                </Label>
                                                                                <div className="relative mt-1">
                                                                                  <Input
                                                                                    value={
                                                                                      subSubOption.value
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                      updateSubSubOption(
                                                                                        variantIndex,
                                                                                        optionIndex,
                                                                                        subVariantIndex,
                                                                                        subOptionIndex,
                                                                                        subSubVariantIndex,
                                                                                        subSubOptionIndex,
                                                                                        'value',
                                                                                        e.target
                                                                                          .value,
                                                                                      )
                                                                                    }
                                                                                    placeholder={
                                                                                      subSubVariant.type ===
                                                                                      'color'
                                                                                        ? '#FF0000'
                                                                                        : 'Value'
                                                                                    }
                                                                                    className={`text-xs ${
                                                                                      subSubVariant.type ===
                                                                                      'color'
                                                                                        ? 'pl-8'
                                                                                        : ''
                                                                                    }`}
                                                                                  />
                                                                                  {subSubVariant.type ===
                                                                                    'color' && (
                                                                                    <>
                                                                                      <div
                                                                                        className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-gray-300 cursor-pointer"
                                                                                        style={{
                                                                                          backgroundColor:
                                                                                            isColorValue(
                                                                                              subSubOption.value,
                                                                                            )
                                                                                              ? subSubOption.value
                                                                                              : '#ffffff',
                                                                                        }}
                                                                                        onClick={() =>
                                                                                          setShowColorPicker(
                                                                                            {
                                                                                              type: 'subsubvariant',
                                                                                              variantIndex,
                                                                                              optionIndex,
                                                                                              subVariantIndex,
                                                                                              subOptionIndex,
                                                                                              subSubVariantIndex,
                                                                                              subSubOptionIndex,
                                                                                            },
                                                                                          )
                                                                                        }
                                                                                      />
                                                                                      {showColorPicker?.type ===
                                                                                        'subsubvariant' &&
                                                                                        showColorPicker?.variantIndex ===
                                                                                          variantIndex &&
                                                                                        showColorPicker?.optionIndex ===
                                                                                          optionIndex &&
                                                                                        showColorPicker?.subVariantIndex ===
                                                                                          subVariantIndex &&
                                                                                        showColorPicker?.subOptionIndex ===
                                                                                          subOptionIndex &&
                                                                                        showColorPicker?.subSubVariantIndex ===
                                                                                          subSubVariantIndex &&
                                                                                        showColorPicker?.subSubOptionIndex ===
                                                                                          subSubOptionIndex && (
                                                                                          <div className="absolute z-20 mt-1 right-0">
                                                                                            <div
                                                                                              className="fixed inset-0"
                                                                                              onClick={() =>
                                                                                                setShowColorPicker(
                                                                                                  null,
                                                                                                )
                                                                                              }
                                                                                            />
                                                                                            <ChromePicker
                                                                                              color={
                                                                                                isColorValue(
                                                                                                  subSubOption.value,
                                                                                                )
                                                                                                  ? subSubOption.value
                                                                                                  : '#000000'
                                                                                              }
                                                                                              onChange={(
                                                                                                color: ColorResult,
                                                                                              ) =>
                                                                                                handleColorChange(
                                                                                                  color,
                                                                                                  showColorPicker,
                                                                                                )
                                                                                              }
                                                                                            />
                                                                                          </div>
                                                                                        )}
                                                                                    </>
                                                                                  )}
                                                                                </div>
                                                                              </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                              <div>
                                                                                <Label className="text-xs">
                                                                                  Price +/-
                                                                                </Label>
                                                                                <Input
                                                                                  type="number"
                                                                                  step="0.01"
                                                                                  value={
                                                                                    subSubOption.priceModifier ===
                                                                                    0
                                                                                      ? ''
                                                                                      : subSubOption.priceModifier
                                                                                  }
                                                                                  onChange={(e) => {
                                                                                    const value =
                                                                                      e.target
                                                                                        .value ===
                                                                                      ''
                                                                                        ? 0
                                                                                        : parseFloat(
                                                                                            e.target
                                                                                              .value,
                                                                                          );
                                                                                    updateSubSubOption(
                                                                                      variantIndex,
                                                                                      optionIndex,
                                                                                      subVariantIndex,
                                                                                      subOptionIndex,
                                                                                      subSubVariantIndex,
                                                                                      subSubOptionIndex,
                                                                                      'priceModifier',
                                                                                      isNaN(value)
                                                                                        ? 0
                                                                                        : value,
                                                                                    );
                                                                                  }}
                                                                                  placeholder="0.00"
                                                                                  className="h-8 text-xs mt-1"
                                                                                />
                                                                              </div>
                                                                              <div>
                                                                                <Label className="text-xs">
                                                                                  Stock
                                                                                </Label>
                                                                                <Input
                                                                                  type="number"
                                                                                  min="0"
                                                                                  value={
                                                                                    subSubOption.stock
                                                                                  }
                                                                                  onChange={(e) => {
                                                                                    const value =
                                                                                      e.target
                                                                                        .value;
                                                                                    updateSubSubOption(
                                                                                      variantIndex,
                                                                                      optionIndex,
                                                                                      subVariantIndex,
                                                                                      subOptionIndex,
                                                                                      subSubVariantIndex,
                                                                                      subSubOptionIndex,
                                                                                      'stock',
                                                                                      value === ''
                                                                                        ? 0
                                                                                        : Number(
                                                                                            value,
                                                                                          ),
                                                                                    );
                                                                                  }}
                                                                                  placeholder="0"
                                                                                  className="text-xs mt-1"
                                                                                />
                                                                              </div>
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                    </div>
                                                                  ),
                                                                )}
                                                              </div>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NestedVariantManager;
