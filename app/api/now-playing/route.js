import { getNowPlaying } from "@/lib/nowPlaying";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getNowPlaying();
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=8, stale-while-revalidate=30",
      },
    });
  } catch {
    return Response.json(
      {
        streamTitle: "danceFM Radio",
        artist: "danceFM",
        track: "Nonstop dance music",
        album: null,
        artwork: null,
        appleUrl: null,
        live: false,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
