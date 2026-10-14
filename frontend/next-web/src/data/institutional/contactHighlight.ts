import { ContactHighlight } from "@/types/institutional/contactHighlight";

export const contactHighlightMock: ContactHighlight[] = [
  {
    id: "contact-highlight-visita",
    title: "Quer fazer uma visita?",
    description: "R. das Corujas, 200 - Petrópolis",
    href: "https://maps.google.com/?q=R.+das+Corujas,+200+-+Petrópolis",
  },
  {
    id: "contact-highlight-telefone",
    title: "Nosso telefone para contato",
    description: "(47) 3465-3214",
    href: "tel:+55473465-3214",
  },
  {
    id: "contact-highlight-email",
    title: "Você pode mandar email aqui",
    description: "psec74@diocesejoinville.com.br",
    href: "mailto:psec74@diocesejoinville.com.br",
  },
  {
    id: "contact-highlight-horario",
    title: "Estamos abertos às",
    description: "09:00 am - 18:00 pm",
    href: "/contato",
  },
];