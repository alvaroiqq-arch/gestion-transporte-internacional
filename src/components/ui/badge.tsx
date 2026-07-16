import * as React from "react"

import { cn } from "@/lib/utils"

type Tono =
  | "neutral"
  | "info"
  | "exito"
  | "advertencia"
  | "peligro"

const tonos: Record<Tono, string> = {
  // Colores cálidos coherentes con la paleta de la app (crema/terracota)
  neutral: "bg-[#efe1cf] text-[#5a4936] dark:bg-[#3a2e22] dark:text-[#d8c6b0]",
  info: "bg-[#dce8e4] text-[#38594f] dark:bg-[#25352f] dark:text-[#a9cabf]",
  exito: "bg-[#d9e7cf] text-[#3f5a30] dark:bg-[#2a3822] dark:text-[#b3cea0]",
  advertencia: "bg-[#f6e2b8] text-[#7a5a1c] dark:bg-[#453619] dark:text-[#e2c489]",
  peligro: "bg-[#f1cfc7] text-[#8a3626] dark:bg-[#43241e] dark:text-[#e0a99c]",
}

function Badge({
  tono = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tono?: Tono }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tonos[tono],
        className
      )}
      {...props}
    />
  )
}

export { Badge, type Tono }
