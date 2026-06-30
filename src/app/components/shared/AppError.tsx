import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

type AppErrorProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppError({
  title = "Something went wrong",
  message = "The page could not be loaded. Please try again.",
  actionLabel = "Try again",
  onAction,
}: AppErrorProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {onAction && (
          <Button className="mt-5 bg-green-600 hover:bg-green-700" onClick={onAction}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
