import * as React from "react"
import { IMaskInput, IMaskInputProps } from "react-imask"
import { cn } from "@/lib/utils"

const inputVariants = "flex h-10 w-full rounded-md border-2 border-border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/50 shadow-sm hover:shadow-md focus-visible:shadow-lg"

const MaskedInput = React.forwardRef<
  HTMLInputElement,
  IMaskInputProps<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <IMaskInput
      inputRef={ref}
      className={cn(inputVariants, className)}
      {...props}
    />
  )
})

MaskedInput.displayName = "MaskedInput"

export { MaskedInput }