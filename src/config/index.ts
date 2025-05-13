
// src/config/index.ts
export const network    = process.env.NEXT_PUBLIC_NETWORK!
export const IS_DEV     = process.env.NODE_ENV === "development"
export const GAS_BUDGET = process.env.NEXT_PUBLIC_GAS_BUDGET!
export const DEBUG      = process.env.NEXT_PUBLIC_DEBUG === "true"
export const MODE  = process.env.VITE_MODE === "true"

export function debugLog(...args: unknown[]) {
  if (DEBUG) {
    console.log(...args)
  }
}
