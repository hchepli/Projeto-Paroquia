"use client";

import Link from "next/link";
import { Images, ArrowUpRight, ImageOff } from "lucide-react";
import Container from "@/components/layout/Container";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumListItem } from "@/types/institutional/albumListItem";
import {AlbumGridSkeleton} from "@/components/ui/skeletons/AlbumGridSkeleton";

function AlbumCard({ slug, title, coverUrl, photoCount }: AlbumListItem) {
    return (
        <Link
            href={`/galeria/${slug}`}
            className="group break-inside-avoid mb-5 block rounded-xl overflow-hidden bg-neutral-100 shadow-sm relative"
        >
            <img
                src={coverUrl}
                alt={title}
                loading="lazy"
                className="w-full block transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

            <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                Ver Álbum
                <ArrowUpRight size={14} />
            </span>

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex flex-col gap-0.5">
                <p className="text-white text-base sm:text-lg font-semibold leading-tight">{title}</p>
                <span className="text-white/70 text-xs">
                    {photoCount} {photoCount === 1 ? "foto" : "fotos"}
                </span>
            </div>
        </Link>
    );
}

export default function Galeria() {
    const { data: albums, loading, error, refetch } = useAlbums();

    return (
        <Container className="w-full min-h-screen my-20 pt-20">
            <div className="flex flex-col gap-1 pb-10">
                <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
                    <Images size={28} className="text-black shrink-0" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                        Nossa Comunidade em Imagens
                    </h2>
                </div>
                <p className="text-black/60 text-base sm:text-lg">
                    Momentos de fé, união e celebração que marcam a nossa história.
                </p>
            </div>

            {loading ? (
                <AlbumGridSkeleton />
            ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <ImageOff size={28} className="text-black/30" />
                    <p className="text-black/60">Não foi possível carregar os álbuns agora.</p>
                    <button
                        type="button"
                        onClick={refetch}
                        className="text-sm font-medium text-[#701513] underline underline-offset-2"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : !albums || albums.length === 0 ? (
                <p className="text-black/50 pb-20">Ainda não há álbuns com fotos publicadas.</p>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                    {albums.map((album) => (
                        <AlbumCard key={album.id} {...album} />
                    ))}
                </div>
            )}
        </Container>
    );
}