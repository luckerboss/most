import { getCollection } from 'astro:content';

/**
 * Все посты блога, отсортированные по pubDate по убыванию. В проде черновики
 * (draft: true) скрыты, в dev — видны, чтобы их было удобно писать и проверять.
 */
export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Посты одного сегмента поверх getPublishedPosts. Записи с segment "common"
 * считаются общими и попадают в выдачу и business, и it.
 * @param {"business"|"it"} segment
 */
export async function getPostsBySegment(segment) {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.segment === segment || post.data.segment === 'common');
}

/**
 * Прикидка времени чтения по сырому markdown (entry.body): грубо чистим от
 * разметки, считаем слова, делим на 180 слов/мин, округляем вверх (мин. 1).
 * Не remark-плагином — во фронт-энде карточек списков render() не вызывается.
 * @param {string} body
 */
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

/**
 * Форматирует дату в dd.mm.yyyy (локаль ru-RU), как в заглушках на главной.
 * @param {Date} date
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Маппинг записи коллекции blog в контракт LatestPosts.astro
 * ({ title, excerpt, href, date, minutes, segment }).
 */
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
