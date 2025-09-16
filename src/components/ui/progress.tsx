import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("w-full h-2 rounded-full bg-muted", className)}>
      <div className="h-2 rounded-full bg-[#2CA6A4]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export { Progress }


