import React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Game-specific variants
        tier1: "bg-green-100 text-green-800 border-green-200",
        tier2: "bg-blue-100 text-blue-800 border-blue-200",
        tier3: "bg-purple-100 text-purple-800 border-purple-200",
        xp: "bg-yellow-100 text-yellow-800 border-yellow-200",
        unlocked: "bg-emerald-100 text-emerald-800 border-emerald-200",
        locked: "bg-gray-100 text-gray-600 border-gray-200",
        available: "bg-orange-100 text-orange-800 border-orange-200 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }