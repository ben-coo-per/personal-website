import { env } from '$env/dynamic/private';
import { PUBLIC_R2_URL } from '$env/static/public';
import { marked } from 'marked';
import { parse as yamlParse } from 'yaml';
import type { ProjectMetadata, BlogPostMetadata, AboutData, HomeData } from '$lib/types';

export type { ProjectMetadata, BlogPostMetadata, Project, AboutData, HomeData } from '$lib/types';

// Decouple the frontend from R2 latency / blips: serve cached responses for
// FRESH_MS without re-fetching, and fall back to stale responses up to STALE_MS
// old on any fetch failure. Per warm Vercel lambda; cold starts re-prime.
const FRESH_MS = 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
type CacheEntry = { value: unknown; storedAt: number };
const responseCache = new Map<string, CacheEntry>();

async function r2Fetch<T>(path: string, parse: (text: string) => T): Promise<T> {
	const now = Date.now();
	const cached = responseCache.get(path);
	if (cached && now - cached.storedAt < FRESH_MS) {
		return cached.value as T;
	}
	try {
		const res = await fetch(`${PUBLIC_R2_URL}/${path}`);
		if (!res.ok) throw new Error(`R2 ${path} → ${res.status}`);
		const value = parse(await res.text());
		responseCache.set(path, { value, storedAt: now });
		return value;
	} catch (err) {
		if (cached && now - cached.storedAt < STALE_MS) {
			console.warn(`R2 fetch failed for ${path}, serving stale (${Math.round((now - cached.storedAt) / 1000)}s old):`, err);
			return cached.value as T;
		}
		throw err;
	}
}

const fetchJson = <T>(path: string) => r2Fetch<T>(path, (t) => JSON.parse(t) as T);
const fetchYaml = <T>(path: string) => r2Fetch<T>(path, (t) => yamlParse(t) as T);
const fetchText = (path: string) => r2Fetch<string>(path, (t) => t);

type RawProject = {
	slug: string;
	title?: string;
	subtitle?: string;
	mainDescription?: string;
	date?: string;
	priority?: number;
	restricted?: boolean;
	unlisted?: boolean;
	archived?: boolean;
	timeSpent?: number;
	websiteUrl?: string;
	githubLink?: string;
	instagramLink?: string;
	onshapeLink?: string;
	downloadableFile?: string;
	previewImage?: string;
	bgColor?: string;
};

type RawBlogPost = {
	slug: string;
	title?: string;
	excerpt?: string;
	publishedAt?: string;
	unlisted?: boolean;
	githubLink?: string;
	instagramLink?: string;
	onshapeLink?: string;
	downloadableFile?: string;
};

function toProject(raw: RawProject): ProjectMetadata {
	return {
		title: raw.title,
		subtitle: raw.subtitle,
		mainDescription: raw.mainDescription,
		date: new Date(raw.date || Date.now()),
		priority: raw.priority ?? 0,
		isRestricted: raw.restricted === true,
		archived: raw.archived === true,
		timeSpent: raw.timeSpent,
		websiteUrl: raw.websiteUrl,
		githubLink: raw.githubLink,
		instagramLink: raw.instagramLink,
		onshapeLink: raw.onshapeLink,
		downloadableFile: raw.downloadableFile,
		previewImage: raw.previewImage,
		bgColor: raw.bgColor,
		slug: raw.slug
	};
}

function toBlogPost(raw: RawBlogPost): BlogPostMetadata {
	return {
		title: raw.title || 'Untitled',
		slug: raw.slug,
		excerpt: raw.excerpt || '',
		publishedAt: new Date(raw.publishedAt || Date.now()),
		githubLink: raw.githubLink,
		instagramLink: raw.instagramLink,
		onshapeLink: raw.onshapeLink,
		downloadableFile: raw.downloadableFile
	};
}

const hasTitle = (p: { title?: string }) =>
	typeof p.title === 'string' && p.title.trim().length > 0;

async function loadProjectIndex(): Promise<RawProject[]> {
	try {
		return await fetchJson<RawProject[]>('projects/_index.json');
	} catch (e) {
		console.error('Failed to load projects/_index.json:', e);
		return [];
	}
}

async function loadBlogIndex(): Promise<RawBlogPost[]> {
	try {
		return await fetchJson<RawBlogPost[]>('blog/_index.json');
	} catch (e) {
		console.error('Failed to load blog/_index.json:', e);
		return [];
	}
}

export async function getProject(slug: string): Promise<ProjectMetadata | null> {
	const index = await loadProjectIndex();
	const raw = index.find((p) => p.slug === slug);
	if (!raw || !hasTitle(raw)) return null;
	return toProject(raw);
}

export async function getProjects(includeRestricted = false): Promise<ProjectMetadata[]> {
	const index = await loadProjectIndex();
	const projects = index
		.filter(hasTitle)
		.filter((p) => !p.unlisted && !p.archived)
		.map(toProject)
		.filter((p) => includeRestricted || !p.isRestricted);

	return projects.sort((a, b) => {
		if (a.priority !== b.priority) return b.priority - a.priority;
		return b.date.getTime() - a.date.getTime();
	});
}

export async function getNextProjectInOrder(
	currentSlug: string,
	includeRestricted = false
): Promise<ProjectMetadata | null> {
	const all = await getProjects(includeRestricted);
	const i = all.findIndex((p) => p.slug === currentSlug);
	if (i === -1 || all.length <= 1) return null;
	return all[(i + 1) % all.length];
}

export async function getStorehouseProjects(): Promise<ProjectMetadata[]> {
	const index = await loadProjectIndex();
	return index
		.filter(hasTitle)
		.filter((p) => !p.unlisted && p.archived)
		.map(toProject)
		.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getProjectContent(slug: string): Promise<string> {
	try {
		return await fetchText(`projects/${slug}/content.md`);
	} catch {
		return '';
	}
}

export function verifyPasscode(passcode: string): boolean {
	const codes = (env.PASSCODES ?? '')
		.split(',')
		.map((c) => c.trim())
		.filter(Boolean);
	return codes.includes(passcode);
}

type RawAbout = {
	body?: string;
	building?: string[];
	reading?: string[];
	watching?: string[];
	playing?: string[];
	aiProfile?: string;
	email?: string;
	github?: string;
	instagram?: string;
	linkedin?: string;
	location?: string;
};

const FALLBACK_ABOUT: AboutData = {
	body: [],
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

function toInlineList(items: string[] | undefined): string[] {
	return (items ?? []).map((s) => marked.parseInline(s) as string);
}

export async function getAboutPage(): Promise<AboutData> {
	let raw: RawAbout;
	try {
		raw = await fetchYaml<RawAbout>('pages/about.yml');
	} catch (error) {
		console.error('Failed to load about page:', error);
		return FALLBACK_ABOUT;
	}
	const paragraphs = (raw.body ?? '')
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean);
	return {
		body: paragraphs.map((text) => ({ html: marked.parseInline(text) as string })),
		email: raw.email ?? '',
		github: raw.github ?? '',
		instagram: raw.instagram ?? '',
		linkedin: raw.linkedin ?? '',
		location: raw.location ?? '',
		building: toInlineList(raw.building),
		reading: toInlineList(raw.reading),
		watching: toInlineList(raw.watching),
		playing: toInlineList(raw.playing),
		aiProfile: raw.aiProfile ?? ''
	};
}

type RawHome = {
	taglines?: string[];
};

const FALLBACK_HOME: HomeData = {
	taglines: ['engineer, designer, developer']
};

export async function getHomePage(): Promise<HomeData> {
	try {
		const raw = await fetchYaml<RawHome>('pages/home.yml');
		const taglines = (raw.taglines ?? []).map((t) => t.trim()).filter(Boolean);
		return { taglines: taglines.length ? taglines : FALLBACK_HOME.taglines };
	} catch (error) {
		console.error('Failed to load home page:', error);
		return FALLBACK_HOME;
	}
}

export async function getAiProfile(): Promise<string> {
	try {
		const raw = await fetchYaml<RawAbout>('pages/about.yml');
		return (raw.aiProfile ?? '').trim().replace(/-->/g, '-->');
	} catch {
		return '';
	}
}

export async function getBlogPost(slug: string): Promise<BlogPostMetadata | null> {
	const index = await loadBlogIndex();
	const raw = index.find((p) => p.slug === slug);
	if (!raw || !hasTitle(raw)) return null;
	return toBlogPost(raw);
}

export async function getBlogPosts(): Promise<BlogPostMetadata[]> {
	const index = await loadBlogIndex();
	return index
		.filter(hasTitle)
		.filter((p) => !p.unlisted)
		.map(toBlogPost)
		.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getBlogPostContent(slug: string): Promise<string> {
	try {
		return await fetchText(`blog/${slug}/content.md`);
	} catch {
		return '';
	}
}
