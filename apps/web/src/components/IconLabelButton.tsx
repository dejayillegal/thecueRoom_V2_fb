import React from "react";

interface IconLabelButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  iconPosition?: "left" | "right";
}

/**
 * Accessible button component with both icon and label
 * Replaces icon-only buttons throughout the codebase
 */
export function IconLabelButton({
  icon,
  label,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  iconPosition = "left",
}: IconLabelButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-700 text-gray-300 focus:ring-gray-500",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const iconSizeStyles = {
    sm: "[&_svg]:w-3.5 [&_svg]:h-3.5",
    md: "[&_svg]:w-4 [&_svg]:h-4",
    lg: "[&_svg]:w-5 [&_svg]:h-5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={label}
    >
      {iconPosition === "left" && (
        <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeStyles[size]}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="font-medium">{label}</span>
      {iconPosition === "right" && (
        <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeStyles[size]}`} aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}

export default IconLabelButton;
