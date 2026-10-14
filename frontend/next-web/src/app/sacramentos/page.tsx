"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { Bird, Wine, Heart, Flame, ArrowUpRight, LucideIcon, Church } from "lucide-react";
import { useSacraments } from "@/hooks/useSacraments";

// Ícone por slug — o type Sacrament não tem campo de ícone (é só visual do
// front), então mantemos esse mapeamento aqui. Sacramentos sem ícone
// mapeado caem no ícone genérico (Church).
const iconBySlug: Record<string, LucideIcon> = {
    batismo: Bird,
    eucaristia: Wine,
    casamento: Heart,
    crisma: Flame,
};

interface SacramentoCardProps {
    slug: string;
    name: string;
}

function SacramentoCard({ slug, name }: SacramentoCardProps) {
    const Icon = iconBySlug[slug] ?? Church;

    return (
        <Link
            href={`/sacramentos/${slug}`}
            className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#F1B933]/40 bg-[#701513] transition-colors hover:border-[#F1B933] w-[260px] min-h-[260px] px-4 py-8 flex-shrink-0"
        >
            <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-white/90">
                Saiba Mais
                <ArrowUpRight size={22} />
            </span>

            <Icon className="h-16 w-16 text-[#F1B933] shrink-0" strokeWidth={1.5} />

            <span className="text-xl sm:text-2xl font-bold tracking-wide text-white uppercase text-center leading-snug break-words">
                {name}
            </span>
        </Link>
    );
}

export default function Sacramentos() {
    const { data: sacraments, loading } = useSacraments();

    return (
        <Container className="w-full min-h-screen mt-20 pt-20">
            <div className="flex flex-col gap-1 pb-10">
                <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
                    <Church size={28} className="text-black shrink-0" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                        Vida Sacramental
                    </h2>
                </div>
                <p className="text-black/60 text-base sm:text-lg">
                    Orientações, significados e informações sobre os sacramentos em nossa paróquia.
                </p>
            </div>

            {loading || !sacraments ? (
                <p className="text-black/60 pb-20">Carregando sacramentos...</p>
            ) : (
                <div className="flex flex-wrap justify-center items-start gap-6 pb-20">
                    {sacraments.map((sacrament) => (
                        <SacramentoCard key={sacrament.id} slug={sacrament.slug} name={sacrament.name} />
                    ))}
                </div>
            )}
        </Container>
    );
}
