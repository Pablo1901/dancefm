import { getPlaylist } from "@/lib/playlist";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await getPlaylist(200);
  return Response.json(
    { playlist: data },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
      },
    }
  );
}
