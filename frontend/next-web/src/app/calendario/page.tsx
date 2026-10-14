"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";
import { Calendar, Info, X } from "lucide-react";
import EventCalendar from "@/components/ui/calendar/EventCalendar";
import CalendarLegendItem from "@/components/ui/calendar/CalendarLegendItem";
import { calendarCategories } from "@/data/event/calendarCategory";

export default function Calendario() {
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    return (
        <Container className="w-full min-h-screen mt-20 pt-20">

            {/* CALENDÁRIO + LEGENDA */}
            <section className="w-full flex flex-col lg:flex-row gap-8 mb-16 sm:mb-20 lg:mb-30">

                {/* Bloco 1: título + subtítulo + botão de legenda (mobile) + calendário */}
                <div className="flex flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
                            <Calendar size={28} className="text-black shrink-0" />
                            <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
                                Calendário de Eventos e Missas
                            </h2>
                        </div>
                        <p className="text-black/60 text-base sm:text-lg">
                            Acompanhe a programação completa da Paróquia Divino Espírito Santo.
                        </p>
                    </div>

                    {/* Botão "Ver Legenda" — abaixo de lg: fica aqui, entre o subtítulo e o calendário, alinhado à direita */}
                    <div className="lg:hidden flex justify-end">
                        <button
                            onClick={() => setIsLegendOpen(true)}
                            className="flex items-center gap-2 text-sm font-medium text-[#701513] border border-[#701513] rounded-full px-4 py-2 hover:bg-[#701513]/5 transition-colors"
                        >
                            <Info size={16} />
                            Ver Legenda
                        </button>

                        {/* Overlay + painel flutuante */}
                        <div
                            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${
                                isLegendOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                            }`}
                        >
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setIsLegendOpen(false)}
                            />

                            <div
                                className={`relative bg-white rounded-2xl p-5 m-4 w-full max-w-xs shadow-xl transition-all duration-300 ease-out ${
                                    isLegendOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                                }`}
                            >
                                <button
                                    onClick={() => setIsLegendOpen(false)}
                                    aria-label="Fechar legenda"
                                    className="absolute top-3 right-3 text-black/60 hover:text-black transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <span className="text-sm text-black/60 block mb-3">Legenda:</span>
                                <div className="flex flex-col gap-3">
                                    {calendarCategories.map((category) => (
                                        <CalendarLegendItem key={category.key} color={category.color} label={category.label} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <EventCalendar />
                    </div>
                </div>

                {/* Bloco 2: legenda — desktop (lg+): sempre visível ao lado do calendário */}
                <div className="hidden lg:flex flex-col items-end justify-start gap-4">
                    <span className="text-sm text-black/60 text-right">Legenda:</span>
                    <div className="flex flex-col gap-3">
                        {calendarCategories.map((category) => (
                            <CalendarLegendItem key={category.key} color={category.color} label={category.label} />
                        ))}
                    </div>
                </div>
            </section>

        </Container>
    );
}