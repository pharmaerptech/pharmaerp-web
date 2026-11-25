/**
 * Centralized Scheme Discount Calculation Utility for PharmaERP
 * 
 * Rules:
 * 1. Normalized scheme percentage and quantity must be positive.
 * 2. 50% scheme special case: applies when quantity >= 2.
 * 3. General schemes: threshold check via fullFreeQty >= quarterThreshold.
 * 4. When scheme applies, the FULL scheme discount percentage is applied directly (100% of scheme percentage).
 */

export const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

/**
 * Compute scheme discount for a given quantity and scheme percentage.
 * When the scheme applies (fullFreeQty >= quarterThreshold, or scheme == 50% with qty >= 2),
 * the FULL scheme discount is applied directly (100% of the scheme percentage).
 * 
 * @param {number} qty - Item quantity
 * @param {number} schemePercent - Scheme discount percentage from batch/product
 * @returns {{ freeQty: number, schemeDiscountPercent: number, finalDiscountPercent: number, schemeApply: boolean }}
 */
export const computeSchemeDiscount = (qty, schemePercent) => {
  const normalizedQty = safeNum(qty, 0);
  const normalizedScheme = safeNum(schemePercent, 0);

  if (normalizedQty <= 0 || normalizedScheme <= 0) {
    return { freeQty: 0, schemeDiscountPercent: 0, finalDiscountPercent: 0, schemeApply: false };
  }

  // Special case: 50% scheme — apply full discount directly when qty >= 2
  if (normalizedScheme === 50) {
    if (normalizedQty < 2) {
      return { freeQty: 0, schemeDiscountPercent: 0, finalDiscountPercent: 0, schemeApply: false };
    }
    return {
      freeQty: 0,
      schemeDiscountPercent: normalizedScheme,
      finalDiscountPercent: normalizedScheme,
      schemeApply: true,
    };
  }

  // Threshold calculation
  const fullFreeQty = (normalizedQty * normalizedScheme) / (100 - normalizedScheme);
  const quarterThreshold = (normalizedScheme / (100 - normalizedScheme)) / 0.4;

  const schemeApply = fullFreeQty >= quarterThreshold;
  const finalDiscountPercent = schemeApply ? normalizedScheme : 0;

  return {
    freeQty: 0,
    schemeDiscountPercent: finalDiscountPercent,
    finalDiscountPercent,
    schemeApply,
  };
};

