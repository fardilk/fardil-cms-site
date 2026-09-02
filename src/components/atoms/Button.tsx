import React from "react";

type Variant = "primary" | "secondary" | "plain" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Font Awesome class rendered before the label. */
  icon?: string;
  children?: React.ReactNode;
}

// Shopify's primary is near-black, not a brand colour; secondary is a white
// surface with a hairline border. Keeping that split is most of the look.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#303030] text-white hover:bg-[#1a1a1a] border border-transparent shadow-[0_1px_0_rgb(26_26_26/0.24)]",
  secondary:
    "bg-white text-[#303030] border border-[#cdcdcd] hover:bg-[#f7f7f7] shadow-[0_1px_0_rgb(26_26_26/0.05)]",
  plain: "bg-transparent text-[#005bd3] border border-transparent hover:bg-[#f1f1f1]",
  danger: "bg-[#c62828] text-white border border-transparent hover:bg-[#a51f1f]",
};

const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  className = "",
  icon,
  children,
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {icon && <i className={`fa ${icon}`} aria-hidden="true" />}
    {children}
  </button>
);

export default Button;
