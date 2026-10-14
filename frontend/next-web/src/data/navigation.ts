import { NavItem } from "@/types/nav";
import { pastoralMock } from "@/data/institutional/pastoral";

export const navigation: NavItem[] = [
  {
    title: "Início",
    href: "/",
  },
  {
    title: "Calendário",
    href: "/calendario",
  },
  {
    title: "Eventos",
    href: "/eventos"
  },
  {
    title: "Comunicados",
    href: "/comunicados",
  },
  {
    title: "Sacramentos",
    href: "/sacramentos",
  },
  {
    title: "Pastorais",
    href: "/pastorais",
    // Dropdown com as pastorais cadastradas (RF09). Montado a partir do
    // mesmo mock usado pela página /pastorais — quando isso virar uma
    // chamada de API, basta trocar a origem dos dados aqui.
    children: pastoralMock.map((pastoral) => ({
      title: pastoral.name,
      href: `/pastorais/${pastoral.slug}`,
    })),
  },
  {
    title: "Galeria",
    href: "/galeria",
  },
  {
    title: "Sobre Nós",
    href: "/sobre-nos",
  },
  {
    title: "Contato",
    href: "/contato",
  },
];