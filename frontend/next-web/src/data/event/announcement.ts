import { Announcement } from "@/types/event/announcement";

export const announcementMock: Announcement[] = [
  {
    id: "announcement-1",
    slug: "congresso-de-familias-2026",
    title:
      "Vem aí o Congresso de Famílias 2026: Inscrições abertas para um final de semana de renovação.",
    content:
      "A paróquia convida todas as famílias para o Congresso de Famílias 2026, um final de semana dedicado à oração, formação e convivência. Serão palestras, momentos de partilha entre casais e atividades para crianças e jovens, com o objetivo de fortalecer os laços familiares à luz da fé. As inscrições podem ser feitas na secretaria paroquial ou diretamente com os coordenadores de pastoral.",
    category: "Ministerios",
    image: "/img/comunicados/noticia.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-08T12:00:00.000Z",
  },
  {
    id: "announcement-2",
    slug: "escala-de-voluntarios-1",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/ministerios.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "announcement-3",
    slug: "escala-de-voluntarios-2",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/ministerios.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-04T09:00:00.000Z",
  },
  {
    id: "announcement-4",
    slug: "escala-de-voluntarios-3",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-03T09:00:00.000Z",
  },
  {
    id: "announcement-5",
    slug: "escala-de-voluntarios-4",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "announcement-6",
    slug: "escala-de-voluntarios-5",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "announcement-7",
    slug: "escala-de-voluntarios-6",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-05-31T09:00:00.000Z",
  },
  {
    id: "announcement-8",
    slug: "escala-de-voluntarios-7",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "announcement-9",
    slug: "escala-de-voluntarios-8",
    title: "Escala de Voluntários: Confira quem serve no próximo domingo",
    content:
      "Confira abaixo a escala de voluntários para o próximo domingo. Pedimos que os escalados confirmem presença com antecedência junto à coordenação de suas pastorais. Em caso de indisponibilidade, avise o quanto antes para que possamos organizar a substituição.",
    category: "Ministerios",
    image: "/img/comunicados/carrossel.png",
    authorId: null,
    status: "PUBLICADO",
    publishedAt: "2026-05-29T09:00:00.000Z",
  },
  {
    // Exemplo de rascunho (UC024 - comunicado ainda não publicado pela Secretaria).
    // Deve ficar de fora de toda consulta pública (validar filtro em announcementService).
    id: "announcement-10",
    slug: "comunicado-em-rascunho-teste",
    title: "[Rascunho de teste] Não deve aparecer no site público",
    content: "Conteúdo de teste apenas para validar o filtro de status RASCUNHO/PUBLICADO.",
    category: "Ministerios",
    image: "/img/comunicados/ministerios.png",
    authorId: null,
    status: "RASCUNHO",
    publishedAt: "2026-06-09T09:00:00.000Z",
  },
];