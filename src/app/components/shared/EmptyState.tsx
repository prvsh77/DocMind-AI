import type { LucideIcon } from "lucide-react";
import { FileSearch } from "lucide-react";
import { Button } from "../ui/button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon = FileSearch,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-white p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5 bg-green-600 hover:bg-green-700" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
