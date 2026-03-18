import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://colosseum.locsafe.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/arena",
    "/arena/deploy",
    "/arena/join",
    "/arena/leaderboard",
    "/arena/docs",
  ];

  return routes.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/arena" ? 0.9 : 0.8,
  }));
}
