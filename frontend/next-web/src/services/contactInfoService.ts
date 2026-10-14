import { contactInfoMock } from "@/data/institutional/contactInfo";
import { ContactInfo } from "@/types/institutional/contactInfo";

const DELAY_MS = 300;

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/contato/info");
// return response.json();
export async function getContactInfo(): Promise<ContactInfo> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return contactInfoMock;
}
