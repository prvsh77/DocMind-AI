import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type FormFieldProps = {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  autoComplete?: string;
};

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  registration,
  error,
  autoComplete,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
