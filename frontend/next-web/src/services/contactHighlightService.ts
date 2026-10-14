import { contactHighlightMock } from "@/data/institutional/contactHighlight";
import { ContactHighlight } from "@/types/institutional/contactHighlight";

const DELAY_MS = 300;

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/contato/destaques");
// return response.json();
export async function getContactHighlights(): Promise<ContactHighlight[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return contactHighlightMock;
}