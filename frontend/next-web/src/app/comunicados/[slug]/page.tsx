"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import Container from "@/components/layout/Container";
import { useAnnouncement } from "@/hooks/useAnnouncement";
import { formatEventDate } from "@/utils/date"; // util genérico de data, não é específico de evento

const FALLBACK_ANNOUNCEMENT_IMAGE = "/img/hero/eventos-img.png";

interface AnnouncementDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { slug } = use(params);
  const { data: announcement, loading } = useAnnouncement(slug);

  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/comunicados"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para Comunicados
      </Link>

      {loading || !announcement ? (
        loading ? (
          <p className="text-black/60 pb-20">Carregando comunicado...</p>
        ) : (
          <div className="flex flex-col gap-3 py-20 text-center">
            <p className="text-black/70 text-lg font-medium">Comunicado não encontrado.</p>
            <Link href="/comunicados" className="text-[#701513] underline w-fit mx-auto">
              Voltar para a lista de comunicados
            </Link>
          </div>
        )
      ) : (
        <article className="max-w-3xl mx-auto flex flex-col gap-6">
          <img
            src={announcement.image ?? FALLBACK_ANNOUNCEMENT_IMAGE}
            alt={announcement.title}
            className="w-full h-[220px] sm:h-[320px] lg:h-[400px] object-cover rounded-2xl"
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium rounded-full px-3 py-1 bg-[#701513]/10 text-[#701513]">
                {announcement.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-black/50">
                <CalendarDays size={14} />
                {formatEventDate(announcement.publishedAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black">
              {announcement.title}
            </h1>
          </div>

          <p className="text-black/70 text-base lg:text-lg leading-relaxed whitespace-pre-line">
            {announcement.content}
          </p>
        </article>
      )}
    </Container>
  );
}
