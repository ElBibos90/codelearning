import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ 
  className = '',
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled = false,
  children,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-100 focus-visible:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10"
  };

  return (
    <button
      ref={ref}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
