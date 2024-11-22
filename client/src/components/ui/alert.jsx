export function Alert({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-blue-50 text-blue-700',
    destructive: 'bg-red-50 text-red-700',
    success: 'bg-green-50 text-green-700'
  };

  return (
    <div className={`p-4 rounded-md ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}