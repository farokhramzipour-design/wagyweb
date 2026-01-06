import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  default: 'bg-brand-green text-white hover:bg-brand-green/90',
  primary: 'bg-accent-orange text-white hover:bg-accent-orange/90',
  destructive: 'bg-red-500 text-white hover:bg-red-500/90',
  outline: 'border border-neutral-gray bg-transparent hover:bg-neutral-light-gray',
  secondary: 'bg-neutral-light-gray text-brand-charcoal hover:bg-neutral-gray',
  ghost: 'hover:bg-neutral-light-gray',
  link: 'text-brand-green underline-offset-4 hover:underline',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
