import Image from "next/image";
import Link from "next/link";

interface NewsSidebarCardProps {
  slug: string;
  image: string;
  imageAlt: string;
  badgeLabel: string;
  title: string;
}

export default function NewsSidebarCard({
  slug,
  image,
  imageAlt,
  badgeLabel,
  title,
}: NewsSidebarCardProps) {
  return (
    <Link href={`/comunicados/${slug}`} className="flex items-stretch justify-center gap-4 min-w-0">
      <div className="relative w-[clamp(4.5rem,16vw,7rem)] h-[clamp(4.5rem,16vw,7rem)] shrink-0 rounded-lg overflow-hidden">
        <Image src={image} alt={imageAlt} fill className="object-cover" />
      </div>
      <div className="flex flex-col items-start justify-center gap-2 min-w-0">
        <span className="flex justify-center items-center text-sm sm:text-md font-semibold text-white bg-[#0059FF]/40 backdrop-blur-sm px-4 py-1 rounded-full">
          {badgeLabel}
        </span>
        <p className="max-w-[85%] text-[clamp(0.9rem,1.4vw,1.25rem)] font-semibold text-black tracking-wide leading-[1.2]">
          {title}
        </p>
      </div>
    </Link>
  );
}
