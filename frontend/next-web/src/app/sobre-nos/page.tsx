"use client";

import Container from "@/components/layout/Container";
import ImagePlaceholder from "@/components/ui/layout/ImagePlaceholder";
import { BookOpenText } from "lucide-react";

// Conteúdo estático (RN05: "Sobre Nós" não é gerenciável pelo admin nesta
// versão — texto e imagens fixos no front-end).
export default function SobreNos() {
  return (
    <Container className="w-full min-h-screen mt-20 pt-20 pb-20">
      <div className="flex flex-col gap-1 pb-10">
        <div className="flex items-center gap-2 border-b-2 border-[#701513] pb-1">
          <BookOpenText size={28} className="text-black shrink-0" />
          <h2 className="text-xl sm:text-2xl lg:text-3xl tracking-wide font-semibold text-black">
            Sobre Nós
          </h2>
        </div>
        <p className="text-black/60 text-base sm:text-lg">
          A história da Paróquia Divino Espírito Santo.
        </p>
      </div>

      <div className="flex flex-col gap-10 max-w-3xl mx-auto">
        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          A Paróquia Divino Espírito Santo, do Bairro Petrópolis de
          Joinville/SC, nasceu da inspiração divina e do desejo do povo
          católico em se reunir para rezar, conviver e celebrar a fração do
          Pão, a Eucaristia. Primeiramente, no ano de 1978, sob a coordenação
          do Padre Dionísio Tecilla SCJ, os católicos do referido bairro se
          reuniram em uma dependência da Escola Municipal Abdon Batista,
          celebrando a primeira Missa no dia 19 de março de 1978, dia de São
          José, Provedor da Igreja.
        </p>

        <ImagePlaceholder label="Foto antiga da paróquia" aspect="aspect-[16/9]" />

        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          Sentindo a necessidade de um local maior para acolher a demanda
          crescente dessa Igreja nascente, a comunidade elegeu uma diretoria,
          que logo priorizou a compra de um terreno no morro dos Carajás,
          possibilitando a tranquilidade do ambiente propício à contemplação.
          Sentiu-se então a necessidade de nominar a identidade desse núcleo
          comunitário, mediante uma eleição, elencando nomes da futura
          comunidade eclesial — e, com grande vantagem de aclamação,
          identificou-se que o nome seria Divino Espírito Santo. Assim,
          nascia mais uma comunidade eclesial, ligada à Paróquia do Sagrado
          Coração de Jesus, hoje Santuário do SCJ, sob a inspiração do
          Espírito Santo e sendo responsáveis pelos trabalhos pastorais os
          padres da Congregação do Sagrado Coração de Jesus (SCJ).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImagePlaceholder label="Construção do templo" aspect="aspect-[4/3]" />
          <ImagePlaceholder label="Comunidade reunida" aspect="aspect-[4/3]" />
        </div>

        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          Com a expansão do bairro e o movimento migratório, os desafios
          foram surgindo, bem como os avanços: a construção de um novo e
          amplo templo, a aquisição de um terreno para o Centro de Pastoral,
          e a dedicação ao trabalho de evangelização, catequese, visita às
          famílias e organização das frentes pastorais. A Comunidade do
          Divino, como era carinhosamente chamada, crescia na dilatação do
          Reino e na ampliação dos serviços pastorais, ao longo da passagem
          de muitos padres pela coordenação da comunidade.
        </p>

        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          Devido à necessidade de melhor atendimento presencial, Dom Irineu
          Roque Scherer e seu conselho elevaram, em 14 de fevereiro de 2014,
          a Comunidade Divino Espírito Santo à condição de Paróquia Divino
          Espírito Santo, tendo como primeiro pároco o Padre José Carlos
          Oliveira, diocesano. A partir de então, a nova Paróquia passou a
          ser coordenada pelos padres diocesanos.
        </p>

        <ImagePlaceholder label="Elevação à condição de Paróquia (2014)" aspect="aspect-[16/9]" />

        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          Em 2023, houve nova divisão geográfica das paróquias da Comarca
          Sul pela diocese, e a Paróquia passou a absorver a Comunidade N.
          Senhora Aparecida, no Parque N. Sra. Aparecida.
        </p>

        <p className="text-black/70 text-base lg:text-lg leading-relaxed">
          Atualmente, a Paróquia conta com 30 expressões pastorais, com mais
          de 250 lideranças envolvidas, em sintonia com a Pastoral Orgânica
          da Arquidiocese de Joinville/SC. Nosso propósito é que o Reino de
          Deus seja implementado. A centralidade da nossa Ação Pastoral
          encontra-se nas verdades da Igreja Católica Apostólica Romana,
          pautadas na Tradição, na Sagrada Escritura e no Magistério, como
          testemunho das virtudes teologais da Fé, Esperança e Caridade.
        </p>
      </div>
    </Container>
  );
}
