import { Pastoral } from "@/types/institutional/pastoral";

// Dados mockados das Pastorais (RF09). Estrutura pensada para ser trocada
// facilmente por uma chamada de API no futuro, sem alterar os consumidores
// (hooks/serviço já isolam essa origem de dados).
export const pastoralMock: Pastoral[] = [
  {
    id: "pastoral-1",
    slug: "catequese",
    name: "Catequese",
    description:
      "Responsável pela formação cristã de crianças, adolescentes e adultos, preparando para os sacramentos e o crescimento na fé.",
    contact: "catequese@diocesejoinville.com.br",
  },
  {
    id: "pastoral-2",
    slug: "liturgia",
    name: "Liturgia",
    description:
      "Cuida da organização e beleza das celebrações litúrgicas, envolvendo leitores, ministros da eucaristia e coroinhas.",
    contact: "liturgia@diocesejoinville.com.br",
  },
  {
    id: "pastoral-3",
    slug: "caridade",
    name: "Pastoral da Caridade",
    description:
      "Atua junto às famílias em situação de vulnerabilidade, promovendo ações de solidariedade e assistência social.",
    contact: "caridade@diocesejoinville.com.br",
  },
  {
    id: "pastoral-4",
    slug: "jovens",
    name: "Pastoral da Juventude",
    description:
      "Reúne jovens da comunidade em encontros de formação, oração e convivência, incentivando a vivência da fé e a liderança.",
    contact: "juventude@diocesejoinville.com.br",
  },
  {
    id: "pastoral-5",
    slug: "familia",
    name: "Pastoral Familiar",
    description:
      "Apoia e fortalece as famílias da comunidade por meio de encontros, formações e acompanhamento de casais.",
    contact: "familia@diocesejoinville.com.br",
  },
  {
    id: "pastoral-6",
    slug: "musica",
    name: "Pastoral da Música",
    description:
      "Responsável pelo canto e pela música nas celebrações, animando a comunidade durante as missas e eventos especiais.",
    contact: "musica@diocesejoinville.com.br",
  },
];
