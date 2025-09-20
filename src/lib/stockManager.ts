import Product from '@/models/Products';
import { OrderItem } from '@/types';

interface StockUpdateResult {
  success: boolean;
  productId: string;
  error?: string;
}

/**
 * Restores stock for cancelled order items
 * @param orderItems - Array of order items to restore stock for
 * @returns Array of results for each product update
 */
export async function restoreStockForCancelledOrder(orderItems: OrderItem[]): Promise<StockUpdateResult[]> {
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

      // Always restore main stock
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );

      // Handle variant stock restoration if variants exist
      console.log(`Checking variants for product ${item.product}:`, {
        itemHasVariants: !!(item.variants && item.variants.length > 0),
        itemVariants: item.variants,
        productHasVariants: !!(product.variants && product.variants.length > 0),
        productVariantsCount: product.variants?.length || 0
      });

      if (item.variants && item.variants.length > 0 && product.variants && product.variants.length > 0) {
        console.log(`Processing ${item.variants.length} variants for product ${item.product}`);
        
        for (const itemVariant of item.variants) {
          const variantName = itemVariant.variantName;
          const optionValue = itemVariant.optionValue || itemVariant.optionLabel;

          console.log(`Looking for variant: ${variantName} with option: ${optionValue}`);

          // Find the variant in the product
          const productVariant = product.variants.find((v: { name: string }) => v.name === variantName);
          if (!productVariant) {
            console.warn(`Variant not found for restoration: ${variantName} in product ${item.product}`);
            console.warn(`Available variants:`, product.variants.map((v: { name: string }) => v.name));
            continue;
          }

          console.log(`Found variant: ${variantName}, looking for option: ${optionValue}`);

          // Find the option in the variant (try multiple matching strategies)
          const optionIndex = productVariant.options.findIndex(
            (opt: { label: string; value: string }) => 
              opt.label === optionValue || opt.value === optionValue ||
              opt.label?.toLowerCase() === optionValue?.toLowerCase() ||
              opt.value?.toLowerCase() === optionValue?.toLowerCase()
          );

          if (optionIndex === -1) {
            console.warn(`Option not found for restoration: ${optionValue} in variant ${variantName}`);
            console.warn(`Available options:`, productVariant.options.map((opt: { label: string; value: string }) => ({ label: opt.label, value: opt.value })));
            continue;
          }

          console.log(`Found option at index ${optionIndex}, restoring ${item.quantity} units`);

          // Restore variant stock
          const updateQuery = {
            $inc: {
              [`variants.$[v].options.${optionIndex}.stockModifier`]: item.quantity
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

          console.log(`Successfully restored ${item.quantity} units to variant ${variantName}:${optionValue} for product ${item.product}`);
        }
      } else {
        console.log(`Skipping variant restoration for product ${item.product}:`, {
          reason: !item.variants || item.variants.length === 0 ? 'No item variants' : 'No product variants'
        });
      }

      results.push({
        success: true,
        productId: item.product
      });

      console.log(`Successfully restored ${item.quantity} units to product ${item.product}`);
    } catch (error) {
      console.error(`Error restoring stock for product ${item.product}:`, error);
      
      // Try fallback: just restore main stock
      try {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
        
        results.push({
          success: true,
          productId: item.product,
          error: 'Restored main stock only due to variant error'
        });
      } catch (fallbackError) {
        console.error(`Fallback stock restoration failed for product ${item.product}:`, fallbackError);
        results.push({
          success: false,
          productId: item.product,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return results;
}

/**
 * Reduces stock for order items (used when creating orders)
 * @param orderItems - Array of order items to reduce stock for
 * @returns Array of results for each product update
 */
export async function reduceStockForOrder(orderItems: OrderItem[]): Promise<StockUpdateResult[]> {
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

      // Always reduce main stock
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );

      // Handle variant stock reduction if variants exist
      if (item.variants && item.variants.length > 0 && product.variants && product.variants.length > 0) {
        for (const itemVariant of item.variants) {
          const variantName = itemVariant.variantName;
          const optionValue = itemVariant.optionValue || itemVariant.optionLabel;

          // Find the variant in the product
          const productVariant = product.variants.find((v: { name: string }) => v.name === variantName);
          if (!productVariant) {
            console.warn(`Variant not found: ${variantName} in product ${item.product}`);
            continue;
          }

          // Find the option in the variant (try multiple matching strategies)
          const optionIndex = productVariant.options.findIndex(
            (opt: { label: string; value: string }) => 
              opt.label === optionValue || opt.value === optionValue ||
              opt.label?.toLowerCase() === optionValue?.toLowerCase() ||
              opt.value?.toLowerCase() === optionValue?.toLowerCase()
          );

          if (optionIndex === -1) {
            console.warn(`Option not found: ${optionValue} in variant ${variantName}`);
            console.warn(`Available options:`, productVariant.options.map((opt: { label: string; value: string }) => ({ label: opt.label, value: opt.value })));
            continue;
          }

          // Reduce variant stock
          const updateQuery = {
            $inc: {
              [`variants.$[v].options.${optionIndex}.stockModifier`]: -item.quantity
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