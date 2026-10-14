import { Sacrament } from "@/types/institutional/sacrament";

// Slugs seguem o que já estava hardcoded em app/sacramentos/page.tsx
// (/sacramentos/batismo, /sacramentos/eucaristia, etc.).
// requiredDocuments fica como string separada por vírgula por enquanto
// (mesmo formato do type atual) — o service faz o split para exibição.
export const sacramentMock: Sacrament[] = [
  {
    id: "sacrament-1",
    slug: "batismo",
    name: "Batismo",
    description:
      "O Batismo é a porta de entrada para a vida cristã e para os demais sacramentos. Por meio dele, a pessoa é purificada do pecado original, torna-se filho(a) de Deus e membro da Igreja.",
    requiredDocuments: "Certidão de nascimento da criança, RG e CPF dos pais, RG e CPF dos padrinhos",
    displayOrder: 1,
  },
  {
    id: "sacrament-2",
    slug: "eucaristia",
    name: "Primeira Eucaristia",
    description:
      "A Eucaristia é o sacramento em que Jesus Cristo se faz presente sob as espécies do pão e do vinho. A Primeira Eucaristia marca o momento em que a criança ou jovem recebe, pela primeira vez, a comunhão.",
    requiredDocuments: "Certidão de Batismo, comprovante de participação na catequese",
    displayOrder: 2,
  },
  {
    id: "sacrament-3",
    slug: "casamento",
    name: "Matrimônio",
    description:
      "O Matrimônio é o sacramento que une o homem e a mulher em aliança de amor e fidelidade diante de Deus e da comunidade, formando uma nova família.",
    requiredDocuments:
      "Certidão de Batismo atualizada (últimos 6 meses), RG e CPF dos noivos, comprovante de curso de preparação para o matrimônio",
    displayOrder: 3,
  },
  {
    id: "sacrament-4",
    slug: "crisma",
    name: "Crisma",
    description:
      "A Crisma (ou Confirmação) fortalece a graça recebida no Batismo, unindo mais firmemente o cristão a Cristo e à Igreja, e o preparando para viver e testemunhar a fé.",
    requiredDocuments: "Certidão de Batismo, comprovante de participação na catequese de Crisma",
    displayOrder: 4,
  },
];
