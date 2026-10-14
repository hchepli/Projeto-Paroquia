import { Event } from "@/types/event/event";

// Datas geradas relativas a "hoje" para sempre exibir os 3 estados do card
// (passado / hoje / futuro) na página de Eventos, independente de quando for testado.
// Quando o backend existir, isso deixa de ser necessário: as datas virão do banco.
function daysFromNow(days: number, hour: number = 19): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const eventMock: Event[] = [
  {
    id: "event-1",
    slug: "festa-de-sao-jose",
    name: "Festa de São José",
    description: "Celebração em honra ao padroeiro, com missa solene e procissão pelas ruas da comunidade.",
    category: "Festa",
    startDate: daysFromNow(-40),
    endDate: null,
    location: "Igreja Matriz",
    massId: null,
    status: "ATIVO",
  },
  {
    id: "event-2",
    slug: "retiro-de-quaresma",
    name: "Retiro de Quaresma",
    description: "Encontro de reflexão e oração preparatório para a Semana Santa.",
    category: "Retiro",
    startDate: daysFromNow(-15, 8),
    endDate: daysFromNow(-14, 18),
    location: "Salão Paroquial",
    massId: null,
    status: "ATIVO",
  },
  {
    id: "event-3",
    slug: "vigilia-da-comunidade",
    name: "Vigília da Comunidade",
    description: "Noite de oração, louvor e partilha aberta a todos os grupos de pastoral.",
    category: "Encontro de Pastoral",
    startDate: daysFromNow(0, 20),
    endDate: null,
    location: "Igreja Matriz",
    massId: null,
    status: "ATIVO",
  },
  {
    id: "event-4",
    slug: "encontro-de-catequistas",
    name: "Encontro de Catequistas",
    description: "Formação continuada para os catequistas de todas as turmas da paróquia.",
    category: "Encontro de Pastoral",
    startDate: daysFromNow(12, 9),
    endDate: null,
    location: "Salão Paroquial",
    massId: null,
    status: "ATIVO",
  },
  {
    id: "event-5",
    slug: "festa-de-natal",
    name: "Festa de Natal",
    description: "Veja os próximos horários de missa e os avisos atualizados da paróquia.",
    category: "Festa",
    startDate: daysFromNow(30),
    endDate: null,
    location: "Igreja Matriz",
    massId: null,
    status: "ATIVO",
  },
  {
    id: "event-6",
    slug: "vespera-de-ano-novo",
    name: "Véspera de Ano Novo",
    description: "Curta a véspera de ano novo com Deus e com toda a nossa comunidade.",
    category: "Festa",
    startDate: daysFromNow(45, 22),
    endDate: null,
    location: "Igreja Matriz",
    massId: null,
    status: "CANCELADO",
  },
];