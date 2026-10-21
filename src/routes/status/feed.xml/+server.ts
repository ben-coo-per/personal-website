import { getStatuses } from '$lib/utils/content';
import type { RequestHandler } from './$types';

const SITE = 'https://www.bencooper.xyz';

const xmlEscape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

function titleFor(text: string): string {
	const t = text.replace(/\s+/g, ' ').trim();
	if (!t) return 'photo update';
	return t.length > 80 ? `${t.slice(0, 79).trimEnd()}…` : t;
}

export const GET: RequestHandler = async () => {
	const posts = await getStatuses(30);

	const items = posts
		.map((post) => {
			const link = `${SITE}/status/${post.slug}`;
			const images = post.images
				.map((img) => `<p><img src="${xmlEscape(SITE + img.url)}" alt="${xmlEscape(img.alt)}" /></p>`)
				.join('');
			const place = post.place ? `<p>@ ${xmlEscape(post.place)}</p>` : '';
			return `		<item>
			<title>${xmlEscape(titleFor(post.text))}</title>
			<link>${link}</link>
			<guid isPermaLink="true">${link}</guid>
			<pubDate>${post.publishedAt.toUTCString()}</pubDate>
			<description>${cdata(`<p>${post.html}</p>${place}${images}`)}</description>
		</item>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Ben Cooper — status</title>
		<link>${SITE}/about</link>
		<description>Short updates from Ben Cooper: what he's making, buying, reading and wandering into.</description>
		<language>en</language>
		<atom:link href="${SITE}/status/feed.xml" rel="self" type="application/rss+xml" />
${posts[0] ? `		<lastBuildDate>${posts[0].publishedAt.toUTCString()}</lastBuildDate>\n` : ''}${items}
	</channel>
</rss>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=300'
		}
	});
};
