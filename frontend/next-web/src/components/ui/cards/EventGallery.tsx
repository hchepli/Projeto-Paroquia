import { ImageOff, Images } from "lucide-react";
import { EventPhotoItem, EventStatus } from "@/types/event/eventListItem";

interface EventGalleryProps {
  photos: EventPhotoItem[];
  status: EventStatus;
}

export default function EventGallery({ photos, status }: EventGalleryProps) {
  const isFuture = status === "future";

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
        <ImageOff size={28} className="text-black/30" />
        <p className="text-black/50 text-sm lg:text-base">
          {isFuture
            ? "As fotos deste evento serão publicadas aqui assim que ele acontecer."
            : "Ainda não há fotos disponíveis para este evento."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-black/80">
        <Images size={20} />
        <h3 className="text-lg lg:text-xl font-semibold">Galeria</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.description ?? "Foto do evento"}
            className="w-full h-[140px] sm:h-[160px] object-cover rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
