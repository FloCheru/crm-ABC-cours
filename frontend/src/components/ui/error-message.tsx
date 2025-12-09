import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  children?: React.ReactNode;
  className?: string;
}

export function ErrorMessage({ children, className = '' }: ErrorMessageProps) {
  if (!children) return null;

  return (
    <div
      className={`flex items-center gap-2 mt-1 text-sm text-red-600 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
