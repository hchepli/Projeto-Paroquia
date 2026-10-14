"use client"

import Container from "@/components/layout/Container";
import { PatternedPanel } from "@/components/ui/layout/PaternedPanel";
import { NewsletterForm } from "@/components/ui/form/NewsletterForm";
import ContactHighlightCard from "@/components/ui/cards/ContactHighlightCard";
import ContactActionCard from "@/components/ui/cards/ContactActionCard";
import Button from "@/components/ui/buttons/Button";
import { useContactHighlights } from "@/hooks/useContactHighlights";
import { useContactActions } from "@/hooks/useContactActions";
import { useContactInfo } from "@/hooks/useContactInfo";

export default function Contato() {
  const { data: highlights, loading: highlightsLoading } = useContactHighlights();
  const { data: actions, loading: actionsLoading } = useContactActions();
  const { data: info, loading: infoLoading } = useContactInfo();

    return (
        <Container className="w-full min-h-screen mt-20">
              <div className="diagnostico flex flex-col lg:flex-row justify-between items-start w-full py-10 md:py-20 gap-12 lg:gap-6">

          <div className="flex w-full lg:w-[45%] justify-center items-start gap-8 flex-col">
            {infoLoading || !info ? (
              <p>Carregando informações de contato...</p>
            ) : (
              <>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl text-start font-semibold">
                  {info.titleLine}{" "}
                  <span className="text-[#701513]">{info.titleHighlight}</span>
                </h3>
                <p className="text-start text-black/60 w-full sm:w-[83%]">
                  {info.description}
                </p>
                <div className="flex justify-center items-start flex-col">
                  <h4 className="text-start text-black/60">Email:</h4>
                  <p>{info.email}</p>
                </div>
                <div className="flex justify-center items-start flex-col">
                  <h4 className="text-start text-black/60">Telefone:</h4>
                  <p>{info.phone}</p>
                </div>
                <Button
                  variant="primary"
                  href={info.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {info.whatsappLabel}
                </Button>
              </>
            )}
          </div>

          <div className="w-full lg:w-[42%]">
            <div className="rounded-2xl p-6 sm:p-10 flex flex-col gap-6 shadow-md">

              <div className="flex flex-col gap-2 items-start">
                <label htmlFor="name" className="text-sm font-medium text-black">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value=""
                  placeholder="Como eu posso te chamar?"
                  className="w-full h-12 rounded-lg border border-black/30 bg-white px-4 text-sm outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-2 items-start">
                <label htmlFor="email" className="text-sm font-medium text-black">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value=""

                  placeholder="Por onde eu te respondo?"
                  className="w-full h-12 rounded-lg border border-black/30 bg-white px-4 text-sm outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-2 items-start">
                <label htmlFor="message" className="text-sm font-medium text-black">
                  Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value=""
                  placeholder="Qual é o principal desafio da sua empresa hoje?"
                  className="w-full h-36 resize-none rounded-lg border border-black/30 bg-white px-4 py-3 text-sm outline-none focus:border-black transition"
                />
              </div>

              <div className="w-full flex justify-end pt-2">
                <Button type="submit" variant="primary" icon>
                  {info?.formButtonLabel ?? "Quero Conversar"}
                </Button>
              </div>

            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full py-6 lg:py-10">
          {highlightsLoading || !highlights ? (
            <p className="col-span-full">Carregando informações de contato...</p>
          ) : (
            highlights.map((highlight) => (
              <ContactHighlightCard key={highlight.id} highlight={highlight} />
            ))
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full pb-10 lg:pb-20">
          {actionsLoading || !actions ? (
            <p className="col-span-full">Carregando ações...</p>
          ) : (
            actions.map((action) => (
              <ContactActionCard key={action.id} action={action} />
            ))
          )}
        </div>

        <div className="w-full py-6 lg:py-10">
          <PatternedPanel className="flex-col! w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-10">
            <div className="flex flex-col justify-center items-center gap-5 text-center w-full max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                Sua generosidade transforma vidas e leva esperança.
              </h2>
              <p className="text-base sm:text-lg text-black/60 leading-[1.3] w-full sm:w-[90%]">
                Contribua para a manutenção do nosso templo e ajude a criar um ambiente
                acolhedor para que todos possam celebrar a fé com dignidade.
              </p>
              <NewsletterForm
                placeholder="Clique aqui para contribuir com nossas obras sociais."
                buttonLabel="Contribuir"
                className="w-full"
                onSubmit={(value) => {
                  // ex: chamar API/checkout de doação
                  console.log("Contribuir:", value);
                }}
              />
            </div>
          </PatternedPanel>
        </div>
        </Container>
    );
}