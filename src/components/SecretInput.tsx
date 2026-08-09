"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type SecretInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password/secret field with an inner eye toggle to show or hide the value.
 */
export function SecretInput({ className = "", id, ...props }: SecretInputProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="relative w-full">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`w-full pr-11 ${className}`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-realm-silver-muted transition-colors hover:bg-white/10 hover:text-realm-silver"
        aria-label={visible ? "Hide secret" : "Show secret"}
        aria-controls={inputId}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
