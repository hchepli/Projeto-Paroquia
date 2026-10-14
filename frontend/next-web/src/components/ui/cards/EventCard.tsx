import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CSSProperties } from "react";

interface EventCardProps {
  image: string;
  title: string;
  description: string;
  buttonLabel?: string;
  href?: string;
  className?: string;
  style?: CSSProperties;
  imageOnly?: boolean;
  width?: number;
  height?: number;
}

export default function EventCard({
  image,
  title,
  description,
  buttonLabel = "Saiba Mais",
  href,
  className = "",
  style,
  imageOnly = false,
  width,
  height,
}: EventCardProps) {
  if (imageOnly) {
    const wrapperClassName = `group flex-shrink-0 rounded-[16px] overflow-hidden bg-black/60 ${className}`;
    const image_ = (
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />
    );

    // No mobile o card mostra só a imagem, então ela é o card inteiro
    // e precisa levar direto para o evento (RF010/UC019).
    if (href) {
      return (
        <Link href={href} aria-label={title} className={wrapperClassName} style={{ width, height, ...style }}>
          {image_}
        </Link>
      );
    }

    return (
      <div className={wrapperClassName} style={{ width, height, ...style }}>
        {image_}
      </div>
    );
  }

  const wrapperClassName = `group flex flex-col justify-center items-center bg-black/60 rounded-[24px] w-[240px] md:w-[260px] lg:w-[350px] flex-shrink-0 transition-transform duration-300 ease-out hover:-translate-y-1 ${className}`;

  const cardContent = (
    <>
      <div className="w-full overflow-hidden rounded-t-[24px]">
        <img
          src={image}
          alt={title}
          className="w-full h-[120px] md:h-[140px] lg:h-[160px] object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="w-full flex flex-col items-start justify-center gap-2 py-3 md:py-4 px-3">
        <h2 className="text-lg md:text-xl text-white font-semibold">{title}</h2>
        <p className="text-white/80 w-[85%] text-sm">{description}</p>
      </div>
      <div className="flex justify-end items-center w-full pb-3 md:pb-4 pr-3">
        {/* Card inteiro já é o link (UC019) - isto é só o indicativo visual do CTA,
            não um <button> real, para evitar link aninhado dentro de link. */}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#701513] border border-[#701513] text-white py-2 px-4 text-sm tracking-wide transition-colors duration-300 ease-out group-hover:bg-[#4a0d0c]">
          {buttonLabel}
          <ArrowUpRight size={16} />
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClassName} style={style}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={wrapperClassName} style={style}>
      {cardContent}
    </div>
  );
}