"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type SecretInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password/secret field with an inner eye toggle on the far right.
 */
export function SecretInput({ className = "", id, style, ...props }: SecretInputProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="relative w-full">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`box-border w-full ${className}`.trim()}
        style={{
          ...style,
          // Beat any px/pr utilities so typed text never sits under the eye.
          paddingInlineEnd: "2.75rem",
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-realm-silver-muted transition-colors hover:bg-white/10 hover:text-realm-silver"
        style={{ insetInlineEnd: "0.625rem" }}
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
