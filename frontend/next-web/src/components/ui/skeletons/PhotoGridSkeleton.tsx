// Skeleton de carregamento para /galeria/[slug] (grid de fotos do álbum).
export default function PhotoGridSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2 pb-2">
        <div className="h-7 w-64 max-w-full rounded bg-neutral-200" />
        <div className="h-4 w-80 max-w-full rounded bg-neutral-100" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-xl bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}