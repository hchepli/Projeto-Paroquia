import { useAsyncData } from "@/hooks/useAsyncData";
import { getAllAlbums } from "@/services/albumService";

export function useAlbums() {
  return useAsyncData(getAllAlbums);
}
