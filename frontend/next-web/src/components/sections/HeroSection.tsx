import { ReactNode } from "react";

interface HeroSectionProps {
  backgroundImage: string;
  align?: "start" | "end";
  overlayOpacity?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function HeroSection({
  backgroundImage,
  align = "start",
  overlayOpacity = "bg-black/80",
  children,
  className = "",
  id,
}: HeroSectionProps) {
  const alignment = align === "start" ? "items-start justify-center" : "items-end justify-end";

  return (
    <section id={id} className={`relative flex flex-col ${alignment} min-h-screen ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      <div className={`absolute inset-0 ${overlayOpacity}`} />
      <div className="relative z-10 w-full h-full">{children}</div>
    </section>
  );
}