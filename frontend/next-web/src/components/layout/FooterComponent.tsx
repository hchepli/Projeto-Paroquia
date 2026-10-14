import SectionDivider from "./chevski/SectionDivider";
import Container from "./Container";

export default function FooterComponent() {
  return (
<footer className="relative bg-[#701513] pb-6 pb-6">

      <Container className="w-full flex flex-col gap-10">
    <SectionDivider showLogo showName rotate  className="transform translate-y-[-5px]"/>
        {/* Topo: texto + card "Sinta-se em casa" */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-white text-3xl tracking-wide font-semibold">
              Obrigado pela sua Visita!
            </h3>
            <p className="text-white text-lg tracking-wide">
              Nos acompanhe nas Redes Sociais
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center rounded-full justify-center bg-white p-2"
              >
                <img className="w-7 h-auto" src="/img/svg/instagram.png" alt="Instagram" />
              </a>
              <a
                href="#"
                className="flex items-center rounded-full justify-center bg-white p-2"
              >
                <img className="w-7 h-auto" src="/img/svg/youtube.png" alt="Youtube" />
              </a>
              <a
                href="#"
                className="flex items-center rounded-full justify-center bg-white p-2"
              >
                <img className="w-7 h-auto" src="/img/svg/facebook.png" alt="Facebook" />
              </a>
            </div>
          </div>

          {/* <div className="bg-white rounded-full flex items-center p-3 pl-8 gap-8">
            <div className="flex flex-col shrink-0">
              <span className="flex items-center gap-2 text-[#701513] font-semibold text-lg whitespace-nowrap">
                <HeartHandshake size={22} />
                Sinta-se em casa.
              </span>
              <span className="text-gray-500 text-sm">
                Crie seu perfil e conecte-se
                <br />
                com nossa comunidade
              </span>
            </div>
            <a
              href="#"
              className="bg-[#701513] text-white text-base font-medium rounded-full px-8 py-4 flex items-center gap-3 whitespace-nowrap shrink-0"
            >
              Criar Perfil Agora
              <span>→</span>
            </a>
          </div> */}
        </div>

        {/* Colunas de links */}
        <div className="flex flex-col md:flex-row justify-between gap-8 pt-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-sm">Missas:</h4>
            <ul className="text-white/70 text-sm flex flex-col gap-1">
              <li>Domingos: 14h, 19h</li>
              <li>Segunda: 19h</li>
              <li>Terça: 19h</li>
              <li>Quarta: 19h</li>
              <li>Quinta: 19h</li>
              <li>Sexta: 19h</li>
              <li>Sabado: 19h</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-sm">Onde Estamos?</h4>
            <div className="rounded-md text-white/70 text-sm w-64">
              <p>R. dos Carajás, 200 - Petrópolis, Joinville - SC</p>
              <p>Cep: 89230-750</p>
              <p>Telefone: (47) 3436-3779 </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-sm">Links Úteis:</h4>
            <ul className="text-white/70 text-sm flex flex-col gap-1">
              <li><a href="#">Pedidos de Oração</a></li>
              <li><a href="#">Faça sua Doação</a></li>
              <li><a href="#">Portal da Transparência</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-sm">Navegação:</h4>
            <ul className="text-white/70 text-sm flex flex-col gap-1">
              <li><a href="#">Home</a></li>
              <li><a href="#">Eventos</a></li>
              <li><a href="#">Comunidade</a></li>
              <li><a href="#">Sacramentos</a></li>
              <li><a href="#">Galeria</a></li>
              <li><a href="#">Contato</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-sm text-white/80">
            &copy; {new Date().getFullYear()} Paróquia Divino Espírito Santo - Joinville. Todos os direitos reservados.
          </p>
        </div>

      </Container>
    </footer>
  );
}