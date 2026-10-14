import { ArrowUpRight } from "lucide-react";
import { ContactHighlight } from "@/types/institutional/contactHighlight";

interface ContactHighlightCardProps {
  highlight: ContactHighlight;
}

export default function ContactHighlightCard({ highlight }: ContactHighlightCardProps) {
  return (
    <div className="w-full flex justify-between items-start gap-4 border border-gray-200 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-base sm:text-lg font-semibold text-black">
          {highlight.title}
        </span>
        <p className="text-sm sm:text-base text-black/50 leading-[1.3]">
          {highlight.description}
        </p>
      </div>
      <a
        href={highlight.href}
        target={highlight.href.startsWith("http") ? "_blank" : undefined}
        rel={highlight.href.startsWith("http") ? "noopener noreferrer" : undefined}
        aria-label={highlight.title}
        className="shrink-0 flex justify-center items-center p-2.5 rounded-full border border-black/10 text-black transition-colors duration-300 bg-[#701513] hover:bg-transparent text-white hover:text-black"
      >
        <ArrowUpRight size={19} />
      </a>
    </div>
  );
}
