import rss from "@astrojs/rss";
import { getPublishedPosts } from "@/lib/blog.js";

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: "Мост — блог",
    description:
      "Разборы для владельцев малого бизнеса и продуктовых команд: заявки и CRM, требования, SRS, discovery.",
    site: context.site,
    items: posts.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/blog/${entry.id}`,
    })),
    customData: "<language>ru-ru</language>",
  });
}
