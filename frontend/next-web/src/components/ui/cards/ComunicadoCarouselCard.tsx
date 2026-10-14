import Image from "next/image";
import Link from "next/link";

interface ComunicadoCarouselCardProps {
  slug: string;
  image: string;
  imageAlt: string;
  badgeLabel: string;
  title: string;
  visibleFrom?: "base" | "sm" | "lg" | "xl";
  className?: string;
}

const visibilityClasses: Record<NonNullable<ComunicadoCarouselCardProps["visibleFrom"]>, string> = {
  base: "block",
  sm: "hidden sm:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

export default function ComunicadoCarouselCard({
  slug,
  image,
  imageAlt,
  badgeLabel,
  title,
  visibleFrom = "base",
  className = "",
}: ComunicadoCarouselCardProps) {
  return (
    <Link
      href={`/comunicados/${slug}`}
      className={`${visibilityClasses[visibleFrom]} relative aspect-[5/3] rounded-xl overflow-hidden ${className}`}
    >
      <Image src={image} alt={imageAlt} fill className="object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-4 right-3 sm:right-4 flex flex-col justify-center items-start gap-1">
        <span className="flex justify-center items-center text-xs font-semibold text-white bg-[#FF7700]/40 backdrop-blur-sm px-3 py-1 rounded-full">
          {badgeLabel}
        </span>
        <p className="text-xs sm:text-sm font-semibold text-white tracking-wide leading-[1.2]">
          {title}
        </p>
      </div>
    </Link>
  );
}
