import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/cn';

export function Toast({ id, title, description, variant = 'default' }) {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, removeToast]);

  const variants = {
    default: 'bg-background text-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5',
        variants[variant]
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && <p className="text-sm font-medium">{title}</p>}
            {description && <p className="mt-1 text-sm">{description}</p>}
          </div>
          <button
            onClick={() => removeToast(id)}
            className="ml-4 flex-shrink-0 rounded-md bg-transparent text-sm font-medium text-inherit hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
