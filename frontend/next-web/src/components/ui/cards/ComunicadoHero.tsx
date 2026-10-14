import Image from "next/image";
import Link from "next/link";

interface ComunicadoHeroProps {
  slug: string;
  image: string;
  imageAlt: string;
  badgeLabel: string;
  title: string;
}

export default function ComunicadoHero({
  slug,
  image,
  imageAlt,
  badgeLabel,
  title,
}: ComunicadoHeroProps) {
  return (
    <Link
      href={`/comunicados/${slug}`}
      className="w-full h-full min-w-0 relative rounded-2xl overflow-hidden aspect-[16/10] block"
    >
      <Image src={image} alt={imageAlt} fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-10 sm:bottom-16 lg:bottom-25 left-5 sm:left-8 lg:left-10 right-5 sm:right-8 flex flex-col items-start gap-3">
        <span className="flex justify-center items-center text-sm sm:text-md font-semibold text-white bg-[#FF7700]/40 backdrop-blur-sm px-4 py-1 rounded-full">
          {badgeLabel}
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white max-w-2xl">
          {title}
        </h1>
      </div>
    </Link>
  );
}
