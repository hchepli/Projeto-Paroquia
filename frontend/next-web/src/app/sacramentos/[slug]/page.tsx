"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Church } from "lucide-react";
import Container from "@/components/layout/Container";
import SacramentSidebar from "@/components/ui/cards/SacramentSidebar";
import EventFaq from "@/components/ui/layout/EventFaq"; // componente genérico de FAQ, já usado em /eventos
import { useSacrament } from "@/hooks/useSacrament";

interface SacramentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function SacramentDetailPage({ params }: SacramentDetailPageProps) {
  const { slug } = use(params);
  const { data: sacrament, loading } = useSacrament(slug);

  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/sacramentos"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para Sacramentos
      </Link>

      {loading || !sacrament ? (
        loading ? (
          <p className="text-black/60 pb-20">Carregando sacramento...</p>
        ) : (
          <div className="flex flex-col gap-3 py-20 text-center">
            <p className="text-black/70 text-lg font-medium">Sacramento não encontrado.</p>
            <Link href="/sacramentos" className="text-[#701513] underline w-fit mx-auto">
              Voltar para a lista de sacramentos
            </Link>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#701513]">
                <Church size={22} />
                <span className="text-sm font-medium">Vida Sacramental</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black">
                {sacrament.name}
              </h1>

              <p className="text-black/70 text-base lg:text-lg leading-relaxed">
                {sacrament.description}
              </p>
            </div>

            {/* Sidebar fixa: documentos + CTA */}
            <SacramentSidebar
              requiredDocuments={sacrament.requiredDocuments}
              whatsappHref={sacrament.whatsappHref}
            />
          </div>

          <EventFaq items={sacrament.faq} />
        </div>
      )}
    </Container>
  );
}
