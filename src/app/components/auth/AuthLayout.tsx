import { Link } from "react-router";
import { FileText, Shield } from "lucide-react";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  panelTitle: string;
  panelText: string;
  reverse?: boolean;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, panelTitle, panelText, reverse = false, children }: AuthLayoutProps) {
  const brandPanel = (
    <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-8 text-white lg:flex">
      <div className="max-w-md text-center">
        <Shield className="mx-auto mb-6 h-24 w-24 opacity-90" aria-hidden="true" />
        <h2 className="mb-4 text-3xl font-bold">{panelTitle}</h2>
        <p className="text-lg text-green-100">{panelText}</p>
      </div>
    </div>
  );

  const formPanel = (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-2">
            <FileText className="h-8 w-8 text-green-600" aria-hidden="true" />
            <span className="text-2xl font-semibold">DocMind AI</span>
          </Link>
          <h1 className="mb-2 text-3xl font-bold">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );

  return <div className="flex min-h-screen">{reverse ? <>{brandPanel}{formPanel}</> : <>{formPanel}{brandPanel}</>}</div>;
}
