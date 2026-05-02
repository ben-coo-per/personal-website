import { env } from '$env/dynamic/private';
import { marked } from 'marked';
import type { ProjectMetadata, BlogPostMetadata, AboutData } from '$lib/types';

// Re-export types for backward compatibility
export type { ProjectMetadata, BlogPostMetadata, Project, AboutData } from '$lib/types';

function kirbyAuthHeader(): string {
	return 'Basic ' + btoa(`${env.KIRBY_API_USER}:${env.KIRBY_API_PASSWORD}`);
}

// In-process cache decoupling the frontend from Kirby uptime.
// - Within FRESH_MS we serve cached data without re-fetching.
// - On any fetch failure we serve stale data up to STALE_MS old, so brief Fly
//   outages or cold starts don't error pages on bencooper.xyz.
// On Vercel, this lives per warm lambda instance, which is enough to absorb
// most flakiness; cold starts re-prime the cache from Kirby on first request.
const FRESH_MS = 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
type CacheEntry = { body: { data: any }; storedAt: number };
const responseCache = new Map<string, CacheEntry>();

export async function kirbyFetch(path: string): Promise<{ data: any }> {
	const now = Date.now();
	const cached = responseCache.get(path);
	if (cached && now - cached.storedAt < FRESH_MS) {
		return cached.body;
	}
	try {
		const res = await fetch(`${env.KIRBY_API_URL}/api/${path}`, {
			headers: { Authorization: kirbyAuthHeader() }
		});
		if (!res.ok) {
			throw new Error(`Kirby API ${path} → ${res.status}`);
		}
		const body = (await res.json()) as { data: any };
		responseCache.set(path, { body, storedAt: now });
		return body;
	} catch (err) {
		if (cached && now - cached.storedAt < STALE_MS) {
			console.warn(`Kirby fetch failed for ${path}, serving stale (${Math.round((now - cached.storedAt) / 1000)}s old):`, err);
			return cached.body;
		}
		throw err;
	}
}

function mapKirbyProject(page: any): ProjectMetadata {
	const c = page.content ?? {};
	return {
		title: c.title,
		subtitle: c.subtitle,
		mainDescription: c.maindescription,
		date: new Date(c.date || Date.now()),
		priority: parseInt(c.priority || '0', 10),
		isRestricted: c.isrestricted === true || c.isrestricted === 'true',
		archived: c.archived === true || c.archived === 'true',
		timeSpent: c.timespent ? parseFloat(c.timespent) : undefined,
		websiteUrl: c.websiteurl || undefined,
		githubLink: c.githublink || undefined,
		instagramLink: c.instagramlink || undefined,
		onshapeLink: c.onshapelink || undefined,
		downloadableFile: c.downloadablefile || undefined,
		previewImage: c.previewimage,
		bgColor: c.bgcolor || undefined,
		slug: page.slug
	};
}

// Kirby exposes `status` as a top-level page property (draft | unlisted | listed).
// We whitelist (rather than blacklist 'draft') so a page with missing/unexpected
// status fails closed — collection endpoints with `?select=` have at times
// returned pages without `status` populated, which let drafts slip through as
// empty cards on the live site.
const isListed = (page: any) => page?.status === 'listed';
// Direct-URL fetches accept unlisted too — that's what "unlisted" is for.
const isAccessible = (page: any) => page?.status === 'listed' || page?.status === 'unlisted';
// Belt-and-suspenders: a listed page without a title is broken content, not
// something we want to render in a card.
const hasTitle = (page: any) => typeof page?.content?.title === 'string' && page.content.title.trim().length > 0;

/**
 * Get a single project by slug
 */
export async function getProject(slug: string): Promise<ProjectMetadata | null> {
	try {
		const { data } = await kirbyFetch(`pages/projects+${slug}`);
		if (!isAccessible(data)) return null;
		return mapKirbyProject(data);
	} catch (error) {
		console.error(`Failed to load project ${slug}:`, error);
		return null;
	}
}

/**
 * Get all projects (optionally including restricted ones)
 */
export async function getProjects(includeRestricted = false): Promise<ProjectMetadata[]> {
	try {
		const { data } = await kirbyFetch('pages/projects/children?limit=100&select=id,slug,content,status');
		const projects: ProjectMetadata[] = data
			.filter((p: any) => isListed(p) && hasTitle(p))
			.map(mapKirbyProject)
			.filter((p: ProjectMetadata) => !p.archived && (includeRestricted || !p.isRestricted));

		return projects.sort((a, b) => {
			if (a.priority !== b.priority) return b.priority - a.priority;
			return b.date.getTime() - a.date.getTime();
		});
	} catch (error) {
		console.error('Failed to load projects:', error);
		return [];
	}
}

/**
 * Get the next project in order (wraps around)
 */
export async function getNextProjectInOrder(
	currentSlug: string,
	includeRestricted = false
): Promise<ProjectMetadata | null> {
	const allProjects = await getProjects(includeRestricted);
	const currentIndex = allProjects.findIndex((p) => p.slug === currentSlug);
	if (currentIndex === -1 || allProjects.length <= 1) return null;
	return allProjects[(currentIndex + 1) % allProjects.length];
}

/**
 * Get all archived (storehouse) projects, sorted by date descending
 */
export async function getStorehouseProjects(): Promise<ProjectMetadata[]> {
	try {
		const { data } = await kirbyFetch('pages/projects/children?limit=100&select=id,slug,content,status');
		return data
			.filter((p: any) => isListed(p) && hasTitle(p))
			.map(mapKirbyProject)
			.filter((p: ProjectMetadata) => p.archived)
			.sort((a: ProjectMetadata, b: ProjectMetadata) => b.date.getTime() - a.date.getTime());
	} catch (error) {
		console.error('Failed to load storehouse projects:', error);
		return [];
	}
}

/**
 * Get the markdown content for a project via the Kirby file API
 */
export async function getProjectContent(slug: string): Promise<string> {
	try {
		const { data } = await kirbyFetch(`pages/projects+${slug}/files/content.md`);
		if (!data?.url) return '';
		const res = await fetch(data.url, { headers: { Authorization: kirbyAuthHeader() } });
		if (!res.ok) return '';
		return await res.text();
	} catch {
		return '';
	}
}

/**
 * Get list of asset filenames for a project
 */
export async function getProjectAssets(slug: string): Promise<string[]> {
	try {
		const { data } = await kirbyFetch(`pages/projects+${slug}/files`);
		return data.map((f: any) => f.filename);
	} catch {
		return [];
	}
}

/**
 * Verify a passcode for restricted content.
 * Valid codes are stored in the PASSCODES env variable (comma-separated).
 */
export function verifyPasscode(passcode: string): boolean {
	const codes = (env.PASSCODES ?? '')
		.split(',')
		.map((c) => c.trim())
		.filter(Boolean);
	return codes.includes(passcode);
}

/**
 * Get about page content
 */
function parseEntries(raw: string | undefined): string[] {
	return (raw ?? '')
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map((l) => marked.parseInline(l) as string);
}

export async function getAboutPage(): Promise<AboutData> {
	const fallback: AboutData = {
		body: [] as { html: string }[],
		email: '',
		github: '',
		instagram: '',
		linkedin: '',
		location: '',
		building: [],
		reading: [],
		watching: [],
		playing: []
	};
	try {
		const { data } = await kirbyFetch('pages/about');
		const c = data.content ?? {};
		const paragraphs = (c.body ?? '')
			.split(/\n{2,}/)
			.map((p: string) => p.trim())
			.filter(Boolean);
		return {
			body: paragraphs.map((text: string) => ({ html: marked.parseInline(text) as string })),
			email: c.email ?? '',
			github: c.github ?? '',
			instagram: c.instagram ?? '',
			linkedin: c.linkedin ?? '',
			location: c.location ?? '',
			building: parseEntries(c.building),
			reading: parseEntries(c.reading),
			watching: parseEntries(c.watching),
			playing: parseEntries(c.playing),
			aiProfile: c.aiprofile ?? ''
		};
	} catch (error) {
		console.error('Failed to load about page:', error);
		return fallback;
	}
}

export async function getAiProfile(): Promise<string> {
	try {
		const { data } = await kirbyFetch('pages/about');
		const profile = (data.content?.aiprofile ?? '').trim();
		return profile.replace(/-->/g, '--\u003e');
	} catch {
		return '';
	}
}

// ============================================
// Blog Post Functions
// ============================================

function mapKirbyBlogPost(page: any): BlogPostMetadata {
	const c = page.content ?? {};
	return {
		title: c.title || 'Untitled',
		slug: page.slug,
		excerpt: c.excerpt || '',
		publishedAt: new Date(c.publishedat || Date.now()),
		githubLink: c.githublink,
		instagramLink: c.instagramlink,
		onshapeLink: c.onshapelink,
		downloadableFile: c.downloadablefile
	};
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPostMetadata | null> {
	try {
		const { data } = await kirbyFetch(`pages/blog+${slug}`);
		if (!isAccessible(data)) return null;
		return mapKirbyBlogPost(data);
	} catch (error) {
		console.error(`Failed to load blog post ${slug}:`, error);
		return null;
	}
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export async function getBlogPosts(): Promise<BlogPostMetadata[]> {
	try {
		const { data } = await kirbyFetch('pages/blog/children?limit=100&select=id,slug,content,status');
		return data
			.filter((p: any) => isListed(p) && hasTitle(p))
			.map(mapKirbyBlogPost)
			.sort(
				(a: BlogPostMetadata, b: BlogPostMetadata) =>
					b.publishedAt.getTime() - a.publishedAt.getTime()
			);
	} catch (error) {
		console.error('Failed to load blog posts:', error);
		return [];
	}
}

/**
 * Get the markdown content for a blog post via the Kirby file API
 */
export async function getBlogPostContent(slug: string): Promise<string> {
	try {
		const { data } = await kirbyFetch(`pages/blog+${slug}/files/content.md`);
		if (!data?.url) return '';
		const res = await fetch(data.url);
		if (!res.ok) return '';
		return await res.text();
	} catch {
		return '';
	}
}
