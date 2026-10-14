// Skeleton de carregamento para o card de álbum em /galeria.
// Mantém as mesmas proporções/alturas variadas do masonry real para
// evitar "pulo de layout" quando os dados chegam.
export default function AlbumCardSkeleton({ heightClass }: { heightClass: string }) {
  return (
    <div className="break-inside-avoid mb-5 rounded-xl overflow-hidden bg-neutral-100 relative animate-pulse">
      <div className={`w-full ${heightClass} bg-neutral-200`} />

      <div className="absolute top-3 right-3 h-6 w-24 rounded-full bg-neutral-300/80" />

      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex flex-col gap-2">
        <div className="h-4 w-2/3 rounded bg-neutral-300/80" />
        <div className="h-3 w-1/3 rounded bg-neutral-300/60" />
      </div>
    </div>
  );
}

// Grid completo usado enquanto os álbuns carregam. Alturas variadas
// simulam o efeito masonry real (colunas com cards de tamanhos diferentes).
const SKELETON_HEIGHTS = ["h-56", "h-72", "h-64", "h-80", "h-60", "h-72"];

export function AlbumGridSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
      {SKELETON_HEIGHTS.map((heightClass, index) => (
        <AlbumCardSkeleton key={index} heightClass={heightClass} />
      ))}
    </div>
  );
}