import { sacramentMock } from "@/data/institutional/sacrament";
import { getSacramentFaq } from "@/data/institutional/sacramentFaq";
import { contactInfoMock } from "@/data/institutional/contactInfo";
import { Sacrament, SacramentDetail } from "@/types/institutional/sacrament";

const DELAY_MS = 300;

// Monta o link de WhatsApp usado no CTA da página de detalhe do
// sacramento, reaproveitando o mesmo número de contactInfoMock usado
// na página de Contato e na página de detalhe de Evento.
function buildSacramentWhatsappHref(sacramentName: string): string {
  const baseNumber = contactInfoMock.whatsappHref.split("?")[0];
  const message = `Olá! Gostaria de saber mais sobre como me preparar para o sacramento de ${sacramentName}.`;
  return `${baseNumber}?text=${encodeURIComponent(message)}`;
}

// Retorna todos os sacramentos para a página /sacramentos, ordenados por
// displayOrder (RF07). TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/sacramentos");
// return response.json();
export async function getAllSacraments(): Promise<Sacrament[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return [...sacramentMock].sort((a, b) => a.displayOrder - b.displayOrder);
}

// Retorna o detalhe de um sacramento para a página /sacramentos/[slug],
// incluindo documentos necessários (RF07), FAQ e o link de WhatsApp do CTA.
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/sacramentos/${slug}`);
// if (!response.ok) return null;
// return response.json();
export async function getSacramentDetail(slug: string): Promise<SacramentDetail | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const sacrament = sacramentMock.find((s) => s.slug === slug);
  if (!sacrament) return null;

  return {
    id: sacrament.id,
    slug: sacrament.slug,
    name: sacrament.name,
    description: sacrament.description ?? "",
    requiredDocuments: sacrament.requiredDocuments
      ? sacrament.requiredDocuments.split(",").map((doc) => doc.trim())
      : [],
    faq: getSacramentFaq(sacrament.slug),
    whatsappHref: buildSacramentWhatsappHref(sacrament.name),
  };
}
