import type { MetadataRoute } from "next";
import { getSiteUrl } from "./lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return ["/", "/join", "/terms", "/privacy"].map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
