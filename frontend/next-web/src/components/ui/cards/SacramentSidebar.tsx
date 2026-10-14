import { FileText } from "lucide-react";
import Button from "@/components/ui/buttons/Button";

interface SacramentSidebarProps {
  requiredDocuments: string[];
  whatsappHref: string;
}

export default function SacramentSidebar({ requiredDocuments, whatsappHref }: SacramentSidebarProps) {
  return (
    <aside className="w-full lg:w-[320px] shrink-0">
      <div className="lg:sticky lg:top-28 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-black/80">
            <FileText size={18} />
            <h3 className="text-base lg:text-lg font-semibold">Documentos Necessários</h3>
          </div>

          {requiredDocuments.length === 0 ? (
            <p className="text-black/50 text-sm">A confirmar com a secretaria paroquial.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm lg:text-base text-black/70 list-disc list-inside">
              {requiredDocuments.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          )}
        </div>

        {/* CTA abre uma conversa de WhatsApp com a mensagem preenchida,
            mesmo padrão usado na página de detalhe de Evento. */}
        <Button
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="default"
          className="w-full"
        >
          Quero Fazer Este Sacramento
        </Button>
      </div>
    </aside>
  );
}
