import { getCollection } from 'astro:content';

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getPostsBySegment(segment) {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.segment === segment || post.data.segment === 'common');
}

export function readingTime(body) {
  const plain = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~`-]/g, ' ')
    .trim();
  const words = plain.length ? plain.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function toCardProps(entry) {
  return {
    title: entry.data.title,
    excerpt: entry.data.description,
    href: `/blog/${entry.id}`,
    date: formatDate(entry.data.pubDate),
    minutes: readingTime(entry.body),
    segment: entry.data.segment,
  };
}
