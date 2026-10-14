import clsx from "clsx";

interface SectionDividerProps {
  className?: string;
  fill?: string;
  showLogo?: boolean;
  showName?: boolean;
  position?: "left" | "right";
  text?: string;
  opacity?: number;
  rotate?: boolean;
}

export default function SectionDivider({
  className,
  fill = "white",
  showLogo = false,
  showName = false,
  position = "left",
  text = "CHEVSKI",
  opacity = 0.1,
  rotate = false,
}: SectionDividerProps) {
  return (
    <div
      className={clsx(
        "bottom-0 left-0 w-full h-5 sm:h-7 lg:h-9 pointer-events-none",
        className
      )}
    >
      {/* Trapézio — mobile/tablet: ângulo mais aberto */}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className={clsx("w-full h-full block lg:hidden", rotate && "rotate-180")}
      >
        <path d="M0,10 L12,0 H88 L100,10 Z" fill={fill} />
      </svg>

      {/* Trapézio — desktop: ângulo original */}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className={clsx("w-full h-full hidden lg:block", rotate && "rotate-180")}
      >
        <path d="M0,10 L5,0 H95 L100,10 Z" fill={fill} />
      </svg>

      {/* Marca d'água */}
      {(showLogo || showName) && (
        <div
          className={clsx(
            "flex px-5 sm:px-10 lg:px-17 gap-1 sm:gap-1.5 select-none",
            position === "left" ? "left-22" : "right-22"
          )}
          style={{ opacity }}
        >
          {showLogo && (
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-[2px] bg-neutral-400 shrink-0" />
          )}

          {showName && (
            <span className="text-[10px] sm:text-[12px] lg:text-[14px] font-semibold tracking-[0.20em] sm:tracking-[0.25em] lg:tracking-[0.30em] uppercase text-neutral-400 whitespace-nowrap">
              {text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}