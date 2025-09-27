import Product from '@/models/Products';

interface StockUpdateResult {
  success: boolean;
  productId: string;
  error?: string;
}

// Minimal shape needed by stock functions
interface OrderItemForStock {
  product: string;
  quantity: number;
  variants?: Array<{
    variantName: string;
    optionValue: string;
    optionLabel?: string;
    subVariants?: Array<{
      subVariantName: string;
      optionValue: string;
      optionLabel?: string;
      subSubVariants?: Array<{
        subSubVariantName: string;
        optionValue: string;
        optionLabel?: string;
      }>;
    }>;
  }>;
}

export async function restoreStockForCancelledOrder(orderItems: OrderItemForStock[]): Promise<StockUpdateResult[]> {
  const results: StockUpdateResult[] = [];

  for (const item of orderItems) {
    try {
      const product = await Product.findById(item.product);
      if (!product) {
        console.warn(`Product not found for stock restoration: ${item.product}`);
        results.push({
          success: false,
          productId: item.product,
          error: 'Product not found'
        });
        continue;
      }

      // No longer restore main stock - only variant-specific stock

      // Handle variant stock restoration - now required since no base stock
      if (!item.variants || item.variants.length === 0) {
        console.warn(`No variants found for order item ${item.product} - cannot restore stock`);
        results.push({
          success: false,
          productId: item.product,
          error: 'No variants specified for stock restoration'
        });
        continue;
      }

      if (!product.variants || product.variants.length === 0) {
        console.warn(`Product ${item.product} has no variants - cannot restore stock`);
        results.push({
          success: false,
          productId: item.product,
          error: 'Product has no variants for stock restoration'
        });
        continue;
      }

      console.log(`Processing ${item.variants.length} variants for product ${item.product}`);

      for (const itemVariant of item.variants) {
        const variantName = itemVariant.variantName;
        const optionValue = itemVariant.optionValue || itemVariant.optionLabel;

        console.log(`Looking for variant: ${variantName} with option: ${optionValue}`);

        // Find the variant in the product
        const productVariant = product.variants.find((v: { name: string }) => v.name === variantName);
        if (!productVariant) {
          console.warn(`Variant not found for restoration: ${variantName} in product ${item.product}`);
          continue;
        }

        // Find the option in the variant
        const optionIndex = productVariant.options.findIndex(
          (opt: { label: string; value: string }) =>
            opt.label === optionValue || opt.value === optionValue ||
            opt.label?.toLowerCase() === optionValue?.toLowerCase() ||
            opt.value?.toLowerCase() === optionValue?.toLowerCase()
        );

        if (optionIndex === -1) {
          console.warn(`Option not found for restoration: ${optionValue} in variant ${variantName}`);
          continue;
        }

        // Check if there are sub-variants to restore
        if (itemVariant.subVariants && itemVariant.subVariants.length > 0) {
          for (const subVariant of itemVariant.subVariants) {
            const subVariantName = subVariant.subVariantName;
            const subOptionValue = subVariant.optionValue || subVariant.optionLabel;

            // Find sub-variant in the product variant option
            const subVariants = productVariant.options[optionIndex].subVariants;
            const productSubVariant = Array.isArray(subVariants)
              ? subVariants.find((sv: { name: string }) => sv.name === subVariantName)
              : undefined;

            if (!productSubVariant) {
              console.warn(`Sub-variant not found: ${subVariantName}`);
              continue;
            }

            const subOptionIndex = productSubVariant.options.findIndex(
              (opt: { label: string; value: string }) =>
                opt.label === subOptionValue || opt.value === subOptionValue ||
                opt.label?.toLowerCase() === subOptionValue?.toLowerCase() ||
                opt.value?.toLowerCase() === subOptionValue?.toLowerCase()
            );

            if (subOptionIndex === -1) {
              console.warn(`Sub-option not found: ${subOptionValue} in sub-variant ${subVariantName}`);
              continue;
            }

            // Check if there are sub-sub-variants to restore
            if (subVariant.subSubVariants && subVariant.subSubVariants.length > 0) {
              for (const subSubVariant of subVariant.subSubVariants) {
                const subSubVariantName = subSubVariant.subSubVariantName;
                const subSubOptionValue = subSubVariant.optionValue;

                // Find sub-sub-variant in the product sub-variant option
                const productSubSubVariant = productSubVariant.options[subOptionIndex].subSubVariants?.find(
                  (ssv: { name: string }) => ssv.name === subSubVariantName
                );

                if (!productSubSubVariant) {
                  console.warn(`Sub-sub-variant not found: ${subSubVariantName}`);
                  continue;
                }

                const subSubOptionIndex = productSubSubVariant.options.findIndex(
                  (opt: { label: string; value: string }) =>
                    opt.label === subSubOptionValue || opt.value === subSubOptionValue ||
                    opt.label?.toLowerCase() === subSubOptionValue?.toLowerCase() ||
                    opt.value?.toLowerCase() === subSubOptionValue?.toLowerCase()
                );

                if (subSubOptionIndex === -1) {
                  console.warn(`Sub-sub-option not found: ${subSubOptionValue} in sub-sub-variant ${subSubVariantName}`);
                  continue;
                }

                // Restore sub-sub-variant stock
                const updateQuery = {
                  $inc: {
                    [`variants.$[v].options.${optionIndex}.subVariants.$[sv].options.${subOptionIndex}.subSubVariants.$[ssv].options.${subSubOptionIndex}.stock`]: item.quantity
                  }
                };

                await Product.updateOne(
                  { _id: item.product },
                  updateQuery,
                  {
                    arrayFilters: [
                      { 'v._id': productVariant._id },
                      { 'sv._id': productSubVariant._id },
                      { 'ssv._id': productSubSubVariant._id }
                    ]
                  }
                );

                console.log(`Successfully restored ${item.quantity} units to sub-sub-variant ${subSubVariantName}:${subSubOptionValue}`);
              }
            } else {
              // Restore sub-variant stock
              const updateQuery = {
                $inc: {
                  [`variants.$[v].options.${optionIndex}.subVariants.$[sv].options.${subOptionIndex}.stock`]: item.quantity
                }
              };

              await Product.updateOne(
                { _id: item.product },
                updateQuery,
                {
                  arrayFilters: [
                    { 'v._id': productVariant._id },
                    { 'sv._id': productSubVariant._id }
                  ]
                }
              );

              console.log(`Successfully restored ${item.quantity} units to sub-variant ${subVariantName}:${subOptionValue}`);
            }
          }
        } else {
          // Restore main variant stock
          const updateQuery = {
            $inc: {
              [`variants.$[v].options.${optionIndex}.stock`]: item.quantity
            }
          };

          await Product.updateOne(
            { _id: item.product },
            updateQuery,
            {
              arrayFilters: [
                { 'v._id': productVariant._id }
              ]
            }
          );

          console.log(`Successfully restored ${item.quantity} units to variant ${variantName}:${optionValue}`);
        }
      }

      results.push({
        success: true,
        productId: item.product
      });

      console.log(`Successfully restored ${item.quantity} units to product ${item.product}`);
    } catch (error) {
      console.error(`Error restoring stock for product ${item.product}:`, error);

      // No fallback to main stock since we removed it
      results.push({
        success: false,
        productId: item.product,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Reduces stock for order items (used when creating orders)
 * @param orderItems - Array of order items to reduce stock for
 * @returns Array of results for each product update
 */
export async function reduceStockForOrder(orderItems: OrderItemForStock[]): Promise<StockUpdateResult[]> {
  const results: StockUpdateResult[] = [];

  for (const item of orderItems) {
    try {
      const product = await Product.findById(item.product);
      if (!product) {
        console.warn(`Product not found: ${item.product}`);
        results.push({
          success: false,
          productId: item.product,
          error: 'Product not found'
        });
        continue;
      }

      // No longer reduce main stock - only variant-specific stock

      // Handle variant stock reduction - now required since no base stock
      if (!item.variants || item.variants.length === 0) {
        console.warn(`No variants found for order item ${item.product} - cannot reduce stock`);
        results.push({
          success: false,
          productId: item.product,
          error: 'No variants specified for stock reduction'
        });
        continue;
      }

      if (!product.variants || product.variants.length === 0) {
        console.warn(`Product ${item.product} has no variants - cannot reduce stock`);
        results.push({
          success: false,
          productId: item.product,
          error: 'Product has no variants for stock reduction'
        });
        continue;
      }

      for (const itemVariant of item.variants) {
        const variantName = itemVariant.variantName;
        const optionValue = itemVariant.optionValue || itemVariant.optionLabel;

        // Find the variant in the product
        const productVariant = product.variants.find((v: { name: string }) => v.name === variantName);
        if (!productVariant) {
          console.warn(`Variant not found: ${variantName} in product ${item.product}`);
          continue;
        }

        // Find the option in the variant
        const optionIndex = productVariant.options.findIndex(
          (opt: { label: string; value: string }) =>
            opt.label === optionValue || opt.value === optionValue ||
            opt.label?.toLowerCase() === optionValue?.toLowerCase() ||
            opt.value?.toLowerCase() === optionValue?.toLowerCase()
        );

        if (optionIndex === -1) {
          console.warn(`Option not found: ${optionValue} in variant ${variantName}`);
          continue;
        }

        // Check if there are sub-variants to reduce
        if (itemVariant.subVariants && itemVariant.subVariants.length > 0) {
          for (const subVariant of itemVariant.subVariants) {
            const subVariantName = subVariant.subVariantName;
            const subOptionValue = subVariant.optionValue || subVariant.optionLabel;

            // Find sub-variant in the product variant option
            const subVariants = productVariant.options[optionIndex].subVariants;
            const productSubVariant = Array.isArray(subVariants)
              ? subVariants.find((sv: { name: string }) => sv.name === subVariantName)
              : undefined;

            if (!productSubVariant) {
              console.warn(`Sub-variant not found: ${subVariantName}`);
              continue;
            }

            const subOptionIndex = productSubVariant.options.findIndex(
              (opt: { label: string; value: string }) =>
                opt.label === subOptionValue || opt.value === subOptionValue ||
                opt.label?.toLowerCase() === subOptionValue?.toLowerCase() ||
                opt.value?.toLowerCase() === subOptionValue?.toLowerCase()
            );

            if (subOptionIndex === -1) {
              console.warn(`Sub-option not found: ${subOptionValue} in sub-variant ${subVariantName}`);
              continue;
            }

            // Check if there are sub-sub-variants to reduce
            if (subVariant.subSubVariants && subVariant.subSubVariants.length > 0) {
              for (const subSubVariant of subVariant.subSubVariants) {
                const subSubVariantName = subSubVariant.subSubVariantName;
                const subSubOptionValue = subSubVariant.optionValue;

                // Find sub-sub-variant in the product sub-variant option
                const productSubSubVariant = productSubVariant.options[subOptionIndex].subSubVariants?.find(
                  (ssv: { name: string }) => ssv.name === subSubVariantName
                );

                if (!productSubSubVariant) {
                  console.warn(`Sub-sub-variant not found: ${subSubVariantName}`);
                  continue;
                }

                const subSubOptionIndex = productSubSubVariant.options.findIndex(
                  (opt: { label: string; value: string }) =>
                    opt.label === subSubOptionValue || opt.value === subSubOptionValue ||
                    opt.label?.toLowerCase() === subSubOptionValue?.toLowerCase() ||
                    opt.value?.toLowerCase() === subSubOptionValue?.toLowerCase()
                );

                if (subSubOptionIndex === -1) {
                  console.warn(`Sub-sub-option not found: ${subSubOptionValue} in sub-sub-variant ${subSubVariantName}`);
                  continue;
                }

                // Reduce sub-sub-variant stock
                const updateQuery = {
                  $inc: {
                    [`variants.$[v].options.${optionIndex}.subVariants.$[sv].options.${subOptionIndex}.subSubVariants.$[ssv].options.${subSubOptionIndex}.stock`]: -item.quantity
                  }
                };

                await Product.updateOne(
                  { _id: item.product },
                  updateQuery,
                  {
                    arrayFilters: [
                      { 'v._id': productVariant._id },
                      { 'sv._id': productSubVariant._id },
                      { 'ssv._id': productSubSubVariant._id }
                    ]
                  }
                );
              }
            } else {
              // Reduce sub-variant stock
              const updateQuery = {
                $inc: {
                  [`variants.$[v].options.${optionIndex}.subVariants.$[sv].options.${subOptionIndex}.stock`]: -item.quantity
                }
              };

              await Product.updateOne(
                { _id: item.product },
                updateQuery,
                {
                  arrayFilters: [
                    { 'v._id': productVariant._id },
                    { 'sv._id': productSubVariant._id }
                  ]
                }
              );
            }
          }
        } else {
          // Reduce main variant stock
          const updateQuery = {
            $inc: {
              [`variants.$[v].options.${optionIndex}.stock`]: -item.quantity
            }
          };

          await Product.updateOne(
            { _id: item.product },
            updateQuery,
            {
              arrayFilters: [
                { 'v._id': productVariant._id }
              ]
            }
          );
        }
      }

      results.push({
        success: true,
        productId: item.product
      });
    } catch (error) {
      console.error(`Error reducing stock for product ${item.product}:`, error);
      results.push({
        success: false,
        productId: item.product,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}