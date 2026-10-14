"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, HeartHandshake, Mail } from "lucide-react";
import Container from "@/components/layout/Container";
import { usePastoral } from "@/hooks/usePastoral";

interface PastoralDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function PastoralDetailPage({ params }: PastoralDetailPageProps) {
  const { slug } = use(params);
  const { data: pastoral, loading } = usePastoral(slug);

  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/pastorais"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para Pastorais
      </Link>

      {loading || !pastoral ? (
        loading ? (
          <p className="text-black/60 pb-20">Carregando pastoral...</p>
        ) : (
          <div className="flex flex-col gap-3 py-20 text-center">
            <p className="text-black/70 text-lg font-medium">Pastoral não encontrada.</p>
            <Link href="/pastorais" className="text-[#701513] underline w-fit mx-auto">
              Voltar para a lista de pastorais
            </Link>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-8 max-w-3xl">
          <div className="flex items-center gap-2 text-[#701513]">
            <HeartHandshake size={22} />
            <span className="text-sm font-medium">Pastorais</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black">
            {pastoral.name}
          </h1>

          {pastoral.description && (
            <p className="text-black/70 text-base lg:text-lg leading-relaxed">
              {pastoral.description}
            </p>
          )}

          {pastoral.contact && (
            <a
              href={`mailto:${pastoral.contact}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#701513] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Mail size={18} />
              {pastoral.contact}
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
