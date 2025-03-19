import fetch from "node-fetch";

interface IGDBAuth {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("IGDB credentials not configured");
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error("Failed to get IGDB access token");
  }

  const auth: IGDBAuth = await response.json();
  accessToken = auth.access_token;
  tokenExpiry = Date.now() + (auth.expires_in * 1000) - 60000; // Expire 1 minute early

  return accessToken;
}

export async function searchIGDBGames(query: string) {
  const token = await getAccessToken();
  const clientId = process.env.IGDB_CLIENT_ID;

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId!,
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: `search "${query}";
          fields name,cover.url,first_release_date,platforms.name,genres.name,rating,summary;
          limit 10;
          where version_parent = null;`,
  });

  if (!response.ok) {
    throw new Error("IGDB API request failed");
  }

  const games = await response.json();
  return games.map((game: any) => ({
    igdbId: game.id,
    title: game.name,
    cover: game.cover?.url?.replace("t_thumb", "t_cover_big"),
    releaseDate: game.first_release_date 
      ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
      : null,
    platforms: game.platforms?.map((p: any) => p.name) || [],
    genres: game.genres?.map((g: any) => g.name) || [],
    rating: Math.round(game.rating) || null,
    summary: game.summary || null,
  }));
}
