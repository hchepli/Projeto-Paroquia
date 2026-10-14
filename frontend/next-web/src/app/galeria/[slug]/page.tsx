"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Images, ImageOff } from "lucide-react";
import Container from "@/components/layout/Container";
import PhotoLightbox from "@/components/ui/layout/PhotoLightbox";
import PhotoGridSkeleton from "@/components/ui/skeletons/PhotoGridSkeleton";
import { useAlbum } from "@/hooks/useAlbum";

interface AlbumDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = use(params);
  const { data: album, loading, error, refetch } = useAlbum(slug);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/galeria"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para Galeria
      </Link>

      {loading ? (
        <PhotoGridSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ImageOff size={28} className="text-black/30" />
          <p className="text-black/60">Não foi possível carregar este álbum agora.</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-medium text-[#701513] underline underline-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      ) : !album ? (
        <div className="flex flex-col gap-3 py-20 text-center">
          <p className="text-black/70 text-lg font-medium">Álbum não encontrado.</p>
          <Link href="/galeria" className="text-[#701513] underline w-fit mx-auto">
            Voltar para a galeria
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 pb-2">
            <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
              <Images size={28} className="text-black shrink-0" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                {album.title}
              </h1>
            </div>
            {album.description && (
              <p className="text-black/60 text-base sm:text-lg">{album.description}</p>
            )}
          </div>

          {album.photos.length === 0 ? (
            <p className="text-black/50 text-sm">Ainda não há fotos neste álbum.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {album.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="aspect-square rounded-xl overflow-hidden bg-neutral-100 shadow-sm relative group block w-full text-left"
                >
                  <img
                    src={photo.url}
                    alt={photo.description ?? album.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {photo.description && (
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs px-2 pt-4 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {photo.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeIndex !== null && (
            <PhotoLightbox
              photos={album.photos}
              activeIndex={activeIndex}
              onClose={() => setActiveIndex(null)}
              onNavigate={setActiveIndex}
            />
          )}
        </div>
      )}
    </Container>
  );
}