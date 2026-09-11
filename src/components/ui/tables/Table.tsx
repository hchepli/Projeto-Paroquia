interface MovimentacaoRow {
  data: string;
  descricao: string;
  tipo: string;
  usuario: string;
}

interface TableProps {
  title: string;
  items: MovimentacaoRow[];
  forbidden?: boolean;
  isLoading?: boolean;
}

export default function Table({ title, items, forbidden, isLoading }: TableProps) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full">
      <h6 className="font-medium text-lg">{title}</h6>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-[rgba(0,0,0,0.5)]">
              <th className="font-normal py-2 pr-4">Data</th>
              <th className="font-normal py-2 pr-4">Descrição</th>
              <th className="font-normal py-2 pr-4">Tipo</th>
              <th className="font-normal py-2">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {forbidden ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Você não tem acesso a essa informação.
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-[rgba(0,0,0,0.4)]">
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="border-t border-[rgba(0,0,0,0.08)] text-sm">
                  <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.data}</td>
                  <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.descricao}</td>
                  <td className="py-3 pr-4 text-[rgba(0,0,0,0.7)]">{item.tipo}</td>
                  <td className="py-3 text-[rgba(0,0,0,0.7)]">{item.usuario}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}