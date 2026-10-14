"use client";

import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import Container from "@/components/layout/Container";

export default function MissaDetailPage() {
  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <Link
        href="/calendario"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Voltar para o Calendário
      </Link>

      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Info size={32} className="text-black/40" />
        <p className="text-black/70 text-lg font-medium">
          Ainda não há uma página de detalhes para missas.
        </p>
        <p className="text-black/50 text-sm max-w-md">
          Por enquanto, o calendário só mostra os horários. Informações
          detalhadas sobre cada celebração serão adicionadas em uma próxima
          etapa do projeto.
        </p>
        <Link href="/calendario" className="text-[#701513] underline w-fit mt-2">
          Voltar para a lista de eventos
        </Link>
      </div>
    </Container>
  );
}