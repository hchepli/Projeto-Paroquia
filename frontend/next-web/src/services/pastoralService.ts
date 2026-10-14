import { pastoralMock } from "@/data/institutional/pastoral";
import { Pastoral } from "@/types/institutional/pastoral";

const DELAY_MS = 300;

// Retorna todas as pastorais para a página /pastorais e para o dropdown do
// header. TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/pastorais");
// return response.json();
export async function getAllPastorals(): Promise<Pastoral[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return [...pastoralMock];
}

// Retorna o detalhe de uma pastoral para a página /pastorais/[slug].
// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch(`/api/pastorais/${slug}`);
// if (!response.ok) return null;
// return response.json();
export async function getPastoralDetail(slug: string): Promise<Pastoral | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return pastoralMock.find((p) => p.slug === slug) ?? null;
}
