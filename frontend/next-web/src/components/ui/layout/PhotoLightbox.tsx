"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { AlbumPhotoItem } from "@/types/institutional/albumListItem";

interface PhotoLightboxProps {
  photos: AlbumPhotoItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({ photos, activeIndex, onClose, onNavigate }: PhotoLightboxProps) {
  const goNext = useCallback(() => {
    onNavigate((activeIndex + 1) % photos.length);
  }, [activeIndex, photos.length, onNavigate]);

  const goPrevious = useCallback(() => {
    onNavigate((activeIndex - 1 + photos.length) % photos.length);
  }, [activeIndex, photos.length, onNavigate]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrevious]);

  const photo = photos[activeIndex];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white"
      >
        <X size={32} />
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goPrevious();
          }}
          aria-label="Foto anterior"
          className="absolute left-2 sm:left-6 text-white/70 hover:text-white"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      <img
        src={photo.url}
        alt={photo.description ?? "Foto do álbum"}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full object-contain rounded-lg"
      />

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goNext();
          }}
          aria-label="Próxima foto"
          className="absolute right-2 sm:right-6 text-white/70 hover:text-white"
        >
          <ChevronRight size={40} />
        </button>
      )}

      {photo.description && (
        <p
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center px-4"
        >
          {photo.description}
        </p>
      )}
    </div>
  );
}
