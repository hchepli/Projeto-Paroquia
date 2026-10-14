import { contactActionMock } from "@/data/institutional/contactAction";
import { ContactAction } from "@/types/institutional/contactAction";

const DELAY_MS = 300;

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/contato/acoes");
// return response.json();
export async function getContactActions(): Promise<ContactAction[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return contactActionMock;
}