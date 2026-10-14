"use client";

import { useEffect, useState } from "react";
import Container from "@/components/layout/Container";
import { HatGlasses } from "lucide-react";
import ComunicadoHero from "@/components/ui/cards/ComunicadoHero";
import NewsSidebarCard from "@/components/ui/cards/NewsSidebarCard";
import FundraisingCard from "@/components/ui/cards/FundraisingCard";
import ComunicadoCarouselCard from "@/components/ui/cards/ComunicadoCarouselCard";
import AnnouncementCarouselArrows from "@/components/ui/buttons/AnnouncementCarouselArrows";
import { useFeaturedAnnouncement } from "@/hooks/useFeaturedAnnouncement";
import { useSidebarAnnouncements } from "@/hooks/useSidebarAnnouncements";
import { useCarouselAnnouncements } from "@/hooks/useCarouselAnnouncements";
import { useActiveFundraisingCampaign } from "@/hooks/useActiveFundraisingCampaign";
import { useCarouselItemsPerView } from "@/hooks/useCarouselItemsPerView";

const FALLBACK_ANNOUNCEMENT_IMAGE = "/img/hero/eventos-img.png"; // usada quando o comunicado não tem imagem própria

export default function Comunicados() {
    const { data: featuredAnnouncement, loading: featuredLoading } = useFeaturedAnnouncement();
    const { data: sidebarAnnouncements, loading: sidebarLoading } = useSidebarAnnouncements();
    const { data: carouselAnnouncements, loading: carouselLoading } = useCarouselAnnouncements();
    const { data: fundraisingCampaign, loading: fundraisingLoading } = useActiveFundraisingCampaign();

    // Quantos cards cabem por "página" no breakpoint atual (1 mobile, 2 sm, 3 lg, 4 xl)
    const carouselItemsPerView = useCarouselItemsPerView();

    const [carouselPage, setCarouselPage] = useState(0);
    const totalCarouselPages = carouselAnnouncements
        ? Math.ceil(carouselAnnouncements.length / carouselItemsPerView)
        : 0;

    // Se o breakpoint mudar (ex: resize/rotate), garante que a página atual
    // continua válida em vez de deixar o carrossel "preso"
    useEffect(() => {
        setCarouselPage((page) => Math.min(page, Math.max(totalCarouselPages - 1, 0)));
    }, [totalCarouselPages]);

    const visibleCarouselAnnouncements = (carouselAnnouncements ?? []).slice(
        carouselPage * carouselItemsPerView,
        carouselPage * carouselItemsPerView + carouselItemsPerView
    );
    const canGoNextPage = carouselPage < totalCarouselPages - 1;
    const canGoPreviousPage = carouselPage > 0;

    return (
        <Container className="w-full min-h-screen mt-20 pt-20">

            {/* HERO + SIDEBAR */}
            <section className="w-full grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-10 items-start">

                {featuredLoading || !featuredAnnouncement ? (
                    <div className="w-full rounded-2xl overflow-hidden aspect-[16/10] flex items-center justify-center bg-gray-100">
                        <p className="text-black/60">Carregando destaque...</p>
                    </div>
                ) : (
                    <ComunicadoHero
                        slug={featuredAnnouncement.slug}
                        image={featuredAnnouncement.image ?? FALLBACK_ANNOUNCEMENT_IMAGE}
                        imageAlt={featuredAnnouncement.title}
                        badgeLabel={featuredAnnouncement.category}
                        title={featuredAnnouncement.title}
                    />
                )}

                {/* Sidebar */}
                 <div className="w-full min-w-0 h-full flex flex-col justify-between  gap-3 mt-2">
                    <div className="flex flex-col gap-7">
                    {/* Título da sidebar */}
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex items-center gap-2 border-b-3 border-[#701513] pb-2">
                            <HatGlasses size={32} className="text-black shrink-0" />
                            <h4 className="text-lg sm:text-xl font-semibold text-black">Fique por Dentro</h4>
                        </div>
                    </div>
                    
                    {sidebarLoading || !sidebarAnnouncements ? (
                        <p className="text-black/60">Carregando comunicados...</p>
                    ) : (
                        sidebarAnnouncements[0] && (
                            <NewsSidebarCard
                                slug={sidebarAnnouncements[0].slug}
                                image={sidebarAnnouncements[0].image ?? FALLBACK_ANNOUNCEMENT_IMAGE}
                                imageAlt={sidebarAnnouncements[0].title}
                                badgeLabel={sidebarAnnouncements[0].category}
                                title={sidebarAnnouncements[0].title}
                            />
                        )
                    )}

                    {sidebarLoading || !sidebarAnnouncements ? null : (
                        sidebarAnnouncements[1] && (
                            <NewsSidebarCard
                                slug={sidebarAnnouncements[1].slug}
                                image={sidebarAnnouncements[1].image ?? FALLBACK_ANNOUNCEMENT_IMAGE}
                                imageAlt={sidebarAnnouncements[1].title}
                                badgeLabel={sidebarAnnouncements[1].category}
                                title={sidebarAnnouncements[1].title}
                            />
                        )
                    )}
                    </div>

                    {fundraisingLoading || !fundraisingCampaign ? (
                        <p className="text-black/60">Carregando campanha...</p>
                    ) : (
                        <FundraisingCard
                            title={fundraisingCampaign.title}
                            description={fundraisingCampaign.description}
                            currentAmount={fundraisingCampaign.currentAmount}
                            goalAmount={fundraisingCampaign.goalAmount}
                        />
                    )}
                </div>
            </section>

            {/* CARROSSEL */}
            <section className="w-full flex items-center justify-between gap-3 sm:gap-5 my-16 sm:my-20 lg:my-30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 flex-1 min-w-0">
                    {carouselLoading || !carouselAnnouncements
                        ? <p className="text-black/60">Carregando...</p>
                        : visibleCarouselAnnouncements.map((announcement) => (
                            <ComunicadoCarouselCard
                                key={announcement.id}
                                slug={announcement.slug}
                                image={announcement.image ?? FALLBACK_ANNOUNCEMENT_IMAGE}
                                imageAlt={announcement.title}
                                badgeLabel={announcement.category}
                                title={announcement.title}
                            />
                        ))}
                </div>

                <AnnouncementCarouselArrows
                    onNext={() => canGoNextPage && setCarouselPage((p) => p + 1)}
                    onPrevious={() => canGoPreviousPage && setCarouselPage((p) => p - 1)}
                    canGoNext={canGoNextPage}
                    canGoPrevious={canGoPreviousPage}
                />
            </section>

        </Container>
    );
}