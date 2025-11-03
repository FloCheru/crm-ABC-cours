import { AlertCircle } from "lucide-react";

export interface ErrorMessageProps {
  children: React.ReactNode;
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  if (!children) return null;

  return (
    <p className="text-sm flex items-center gap-1 mt-2 text-red-600" role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{children}</span>
    </p>
  );
}
