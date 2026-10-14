import { ImageOff } from "lucide-react";

interface ImagePlaceholderProps {
  label?: string;
  className?: string;
  // Proporção do placeholder (Tailwind aspect-*), ex: "aspect-[4/3]".
  aspect?: string;
}

// Placeholder genérico de imagem, com proporção fixa definida via `aspect`,
// para reservar o espaço no layout até que a foto real seja cadastrada.
// Segue o mesmo padrão visual (borda tracejada + fundo neutro) já usado em
// EventGallery para "sem fotos ainda".
export default function ImagePlaceholder({
  label = "Foto em breve",
  className = "",
  aspect = "aspect-[4/3]",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center ${aspect} ${className}`}
    >
      <ImageOff size={28} className="text-black/30" />
      <p className="text-black/50 text-sm px-4">{label}</p>
    </div>
  );
}
