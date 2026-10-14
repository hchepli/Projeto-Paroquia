import { ContactAction } from "@/types/institutional/contactAction";

export const contactActionMock: ContactAction[] = [
  {
    id: "contact-action-voluntario",
    title: "Seja um Voluntário!",
    description:
      "Coloque seus dons em prática e ajude a construir nossa comunidade. Descubra onde você pode servir.",
    buttonLabel: "Quero ser",
    href: "/pastorais",
  },
  {
    id: "contact-action-doacao",
    title: "Faça sua Doação!",
    description:
      "Sua generosidade mantém nossa missão viva. Contribua com alegria e ajude nossa comunidade a crescer.",
    buttonLabel: "Fazer doação",
    href: "/doacoes",
  },
];