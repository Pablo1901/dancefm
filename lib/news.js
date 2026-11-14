import { NEWS_FEED_URL } from "./station.js";

const CACHE_TTL = 1000 * 60 * 10;
let cached = null;

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match);
}

function clean(value) {
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, tag) {
  const match = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")
  );
  return match ? match[1] : "";
}

function pickImage(block) {
  const media =
    block.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ||
    block.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ||
    block.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1];
  if (media) return decodeEntities(media);

  const encoded = pick(block, "content:encoded");
  const url = encoded.match(/https?:\/\/[^\s"'<\]]+/)?.[0];
  if (url && /\.(jpe?g|png|webp|gif)/i.test(url)) return decodeEntities(url);

  const inline = block.match(/<img[^>]*src="([^"]+)"/i)?.[1];
  return inline ? decodeEntities(inline) : null;
}

function readingTime(text) {
  const words = String(text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parseFeed(xml) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items.map((block, index) => {
    const title = clean(pick(block, "title"));
    const link = clean(pick(block, "link"));
    const description = clean(pick(block, "description")).replace(
      /\s*The post .*? appeared first on .*$/i,
      ""
    );
    const author = clean(pick(block, "author")) || "DJ Mag";
    const publishedAt = clean(pick(block, "pubDate"));
    const category = clean(pick(block, "category")) || "News";
    const slug = link.split("/").filter(Boolean).pop() || `article-${index}`;

    return {
      id: slug,
      title,
      link,
      excerpt: description,
      author,
      category,
      publishedAt,
      publishedLabel: formatDate(publishedAt),
      image: pickImage(block),
      readingTime: readingTime(`${title} ${description}`),
    };
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export async function getNews(limit = 9) {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.value.slice(0, limit);
  }

  try {
    const res = await fetch(NEWS_FEED_URL, {
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; danceFM/1.0; +https://dancefm.radio)",
      },
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(`Feed responded ${res.status}`);
    const xml = await res.text();
    const articles = parseFeed(xml).filter((item) => item.title && item.link);
    if (articles.length) cached = { at: Date.now(), value: articles };
    return articles.slice(0, limit);
  } catch {
    return cached?.value.slice(0, limit) ?? [];
  }
}
