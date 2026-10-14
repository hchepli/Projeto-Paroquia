"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { HeartHandshake, ArrowUpRight } from "lucide-react";
import { usePastorals } from "@/hooks/usePastorals";

interface PastoralCardProps {
    slug: string;
    name: string;
    description: string | null;
}

function PastoralCard({ slug, name, description }: PastoralCardProps) {
    return (
        <Link
            href={`/pastorais/${slug}`}
            className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-[#F1B933]/40 bg-[#701513] transition-colors hover:border-[#F1B933] w-[260px] min-h-[220px] px-6 py-6 flex-shrink-0"
        >
            <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-white/90">
                Saiba Mais
                <ArrowUpRight size={22} />
            </span>

            <HeartHandshake className="h-10 w-10 text-[#F1B933] shrink-0" strokeWidth={1.5} />

            <div className="flex flex-col gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-wide text-white uppercase leading-snug break-words">
                    {name}
                </span>
                {description && (
                    <p className="text-sm text-white/70 line-clamp-3">{description}</p>
                )}
            </div>
        </Link>
    );
}

export default function Pastorais() {
    const { data: pastorals, loading } = usePastorals();

    return (
        <Container className="w-full min-h-screen mt-20 pt-20">
            <div className="flex flex-col gap-1 pb-10">
                <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
                    <HeartHandshake size={28} className="text-black shrink-0" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                        Pastorais
                    </h2>
                </div>
                <p className="text-black/60 text-base sm:text-lg">
                    Conheça os grupos de atuação da nossa comunidade e como participar.
                </p>
            </div>

            {loading || !pastorals ? (
                <p className="text-black/60 pb-20">Carregando pastorais...</p>
            ) : (
                <div className="flex flex-wrap justify-center items-start gap-6 pb-20">
                    {pastorals.map((pastoral) => (
                        <PastoralCard
                            key={pastoral.id}
                            slug={pastoral.slug}
                            name={pastoral.name}
                            description={pastoral.description}
                        />
                    ))}
                </div>
            )}
        </Container>
    );
}
