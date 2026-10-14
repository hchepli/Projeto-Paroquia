"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { EventFaqItem } from "@/types/event/eventListItem";

interface EventFaqProps {
  items: EventFaqItem[];
}

export default function EventFaq({ items }: EventFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
        <HelpCircle size={24} className="text-black shrink-0" />
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-black">
          Perguntas Frequentes
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="font-medium text-black">{item.question}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-black/50 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 text-black/70 text-sm lg:text-base">{item.answer}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
