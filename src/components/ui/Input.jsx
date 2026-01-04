import React from 'react';
import { cn } from '@/lib/utils'; // Assuming your cn utility is in lib

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-neutral-gray bg-white px-3 py-2 text-sm text-brand-charcoal ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-dark-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
