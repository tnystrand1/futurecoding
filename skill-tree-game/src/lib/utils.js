import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 * This is the standard utility function used in shadcn/ui components
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats XP values with commas for better readability
 */
export function formatXP(xp) {
  return new Intl.NumberFormat().format(xp)
}

/**
 * Calculates progress percentage between two values
 */
export function calculateProgress(current, total) {
  if (total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

/**
 * Generates a random ID for components
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Debounces a function call
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Formats skill tier names
 */
export function formatTierName(tier) {
  const tierNames = {
    1: "Foundations",
    2: "Applications", 
    3: "Specializations"
  }
  return tierNames[tier] || `Tier ${tier}`
}

/**
 * Gets skill state class for styling
 */
export function getSkillStateClass(state) {
  const stateClasses = {
    locked: "opacity-50 grayscale",
    available: "ring-2 ring-blue-400 animate-pulse",
    unlocked: "ring-2 ring-green-400",
    completed: "ring-2 ring-gold-400 bg-gradient-to-br from-yellow-200 to-yellow-400"
  }
  return stateClasses[state] || ""
}