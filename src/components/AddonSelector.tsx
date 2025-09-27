'use client';

import React from 'react';
import { Addon, SelectedAddon } from '@/lib/productVariants';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface AddonSelectorProps {
  addons: Addon[];
  selectedAddons: SelectedAddon[];
  onAddonChange: (addonName: string, optionLabel: string, quantity: number) => void;
}

const AddonSelector: React.FC<AddonSelectorProps> = ({
  addons,
  selectedAddons,
  onAddonChange,
}) => {
  const getSelectedAddon = (addonName: string, optionLabel: string) => {
    return selectedAddons.find(sa => sa.addonName === addonName && sa.optionLabel === optionLabel);
  };

  const getSelectedQuantity = (addonName: string, optionLabel: string) => {
    const selected = getSelectedAddon(addonName, optionLabel);
    return selected?.quantity || 0;
  };

  const isAddonSelected = (addonName: string, optionLabel: string) => {
    return getSelectedQuantity(addonName, optionLabel) > 0;
  };

  const renderCheckboxAddon = (addon: Addon) => {
    const options = addon.options.length > 0 ? addon.options : [{ label: addon.name, price: 0 }];
    const isMinimal = options.length === 1 && !addon.description && options[0].label === addon.name;

    if (isMinimal) {
      const option = options[0];
      const isSelected = isAddonSelected(addon.name, option.label);
      const checkboxId = `${addon.name}-${option.label}`;
      return (
        <div key={addon.name} className="mt-4">
          <div className={`flex items-center gap-2 px-0 py-1`}>
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              onCheckedChange={(checked) => onAddonChange(addon.name, option.label, checked ? 1 : 0)}
              className="h-4 w-4 bg-white border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium text-black">
              {option.label} <span className="text-blue-600 font-semibold">+Rs. {(option.price || 0).toLocaleString()}</span>
            </Label>
          </div>
        </div>
      );
    }

    return (
      <div key={addon.name} className="mt-6 p-4  border border-gray-200 rounded-lg">
        <h4 className="font-semibold flex items-center gap-2 mb-3">
          {addon.name}
          {addon.required && <span className="text-red-500 text-sm">*</span>}
        </h4>
        {addon.description && (
          <p className="text-gray-600 text-sm mb-3">{addon.description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option, index) => {
            const isSelected = isAddonSelected(addon.name, option.label);
            return (
              <div
                key={`${addon.name}-${option.label}-${index}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors duration-150 ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                } text-black`}
              >
                {(() => {
                  const checkboxId = `${addon.name}-${option.label}`;
                  return (
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onAddonChange(addon.name, option.label, checked ? 1 : 0)
                      }
                      aria-label={`${option.label} addon`}
                      className="h-4 w-4 bg-white border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  );
                })()}
                <div className="flex-1 truncate">
                  <Label className="cursor-pointer text-sm font-medium text-black" htmlFor={`${addon.name}-${option.label}`}>
                  {option.label} <span className="text-blue-600 font-semibold">+Rs. {(option.price || 0).toLocaleString()}</span>
                  </Label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  if (addons.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mt-8 mb-4">Add-ons & Extras</h3>
      {addons.map((addon) => renderCheckboxAddon(addon))}
    </div>
  );
};

export default AddonSelector;
