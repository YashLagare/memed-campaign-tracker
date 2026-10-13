/**
 * Currency conversion utilities to safely handle monetary values in integer paise
 * 1 INR = 100 paise
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
