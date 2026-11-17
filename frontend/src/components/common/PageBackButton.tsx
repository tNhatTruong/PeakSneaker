import { ArrowLeft } from "lucide-react";
import { type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface PageBackButtonProps {
  fallbackTo: string;
  label?: string;
  className?: string;
  variant?: "capsule" | "subtle" | "dark";
}

export default function PageBackButton({
  fallbackTo,
  label = "Quay lại",
  className = "",
  variant = "capsule",
}: PageBackButtonProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = (): void => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleBack}
        className={`group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-all duration-200 hover:text-zinc-950 active:scale-95 ${className}`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 transition-all duration-200 group-hover:-translate-x-1 group-hover:bg-zinc-950 group-hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "dark") {
    return (
      <button
        type="button"
        onClick={handleBack}
        className={`group inline-flex items-center gap-2.5 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-100 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-white hover:bg-white hover:text-zinc-950 hover:shadow-md active:scale-95 ${className}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-white transition-all duration-200 group-hover:-translate-x-0.5 group-hover:bg-zinc-950 group-hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
        <span>{label}</span>
      </button>
    );
  }

  // Default: Capsule variant
  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-2.5 rounded-full border border-zinc-200/90 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-800 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white hover:shadow-md active:scale-95 ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:bg-white group-hover:text-zinc-950">
        <ArrowLeft className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </button>
  );
}
