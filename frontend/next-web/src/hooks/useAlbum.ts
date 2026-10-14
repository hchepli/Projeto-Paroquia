import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getAlbumDetail } from "@/services/albumService";

export function useAlbum(slug: string) {
  const fetcher = useCallback(() => getAlbumDetail(slug), [slug]);
  return useAsyncData(fetcher);
}
