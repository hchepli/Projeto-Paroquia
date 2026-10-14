import { ArrowUpRight } from "lucide-react";
import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type CommonProps = {
  variant?: "primary" | "secondary" | "secondary-dark";
  icon?: boolean;
  size?: "default" | "sm";
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export default function Button({
  variant = "primary",
  icon = false,
  size = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "group relative isolate overflow-hidden flex items-center justify-center gap-1 tracking-wide rounded-full";

  const variants = {
    primary:
      "bg-[#701513] border border-[#701513] text-white",
    secondary:
      "bg-transparent border border-white text-white hover:text-black",
    "secondary-dark":
      "bg-transparent border border-black text-black hover:text-white",
  };

  const overlays = {
    primary: "bg-[#4a0d0c]",
    secondary: "bg-white",
    "secondary-dark": "bg-black",
  };

  const sizes = {
    default: "py-4 px-10",
    sm: "py-2 px-4 text-sm",
  };

  const combinedClassName = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  const content = (
    <>
      <span
        aria-hidden
        className={`absolute inset-0 -z-10 origin-left scale-x-0 transform transition-transform duration-300 ease-out group-hover:scale-x-100 ${overlays[variant]}`}
      />

      <span className="relative z-10 flex items-center justify-center gap-1 transition-colors duration-300 ease-out">
        {children}
        {icon && <ArrowUpRight size={18} />}
      </span>
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props as ButtonAsAnchor;
    return (
      <a href={href} className={combinedClassName} {...anchorProps}>
        {content}
      </a>
    );
  }

  return (
    <button className={combinedClassName} {...(props as ButtonAsButton)}>
      {content}
    </button>
  );
}