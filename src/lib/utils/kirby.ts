import { readFile } from 'fs/promises';
import { join } from 'path';
import { env } from '$env/dynamic/private';
import type { ProjectMetadata, BlogPostMetadata } from '$lib/types';

// Re-export types for backward compatibility
export type { ProjectMetadata, BlogPostMetadata, Project } from '$lib/types';

function kirbyAuthHeader(): string {
	return 'Basic ' + btoa(`${env.KIRBY_API_USER}:${env.KIRBY_API_PASSWORD}`);
}

export async function kirbyFetch(path: string): Promise<{ data: any }> {
	const res = await fetch(`${env.KIRBY_API_URL}/api/${path}`, {
		headers: { Authorization: kirbyAuthHeader() }
	});
	if (!res.ok) {
		throw new Error(`Kirby API ${path} → ${res.status}`);
	}
	return res.json();
}

function mapKirbyProject(page: any): ProjectMetadata {
	const c = page.content ?? {};
	return {
		title: c.title,
		subtitle: c.subtitle,
		mainDescription: c.maindescription,
		date: new Date(c.date || Date.now()),
		priority: parseInt(c.priority || '0', 10),
		isRestricted: c.isrestricted === 'true',
		previewImage: c.previewimage,
		nextCardImage: c.nextcardimage,
		mainImage: c.mainimage,
		slug: page.slug
	};
}

/**
 * Get a single project by slug
 */
export async function getProject(slug: string): Promise<ProjectMetadata | null> {
	try {
		const { data } = await kirbyFetch(`pages/projects+${slug}`);
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
		const { data } = await kirbyFetch('pages/projects/children?limit=100&select=id,slug,content');
		const projects: ProjectMetadata[] = data
			.map(mapKirbyProject)
			.filter((p: ProjectMetadata) => includeRestricted || !p.isRestricted);

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
 * Get the markdown content for a project (stored in content.md on disk)
 */
export async function getProjectContent(slug: string): Promise<string> {
	try {
		const filePath = join(process.cwd(), 'cms', 'content', 'projects', slug, 'content.md');
		return await readFile(filePath, 'utf-8');
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
export async function getAboutPage(): Promise<{ body: { text: string }[] }> {
	try {
		const { data } = await kirbyFetch('pages/about');
		const body: string = data.content?.body ?? '';
		// Split on blank lines to reproduce the multiple-paragraph structure
		const paragraphs = body
			.split(/\n{2,}/)
			.map((p: string) => p.trim())
			.filter(Boolean);
		return { body: paragraphs.map((text) => ({ text })) };
	} catch (error) {
		console.error('Failed to load about page:', error);
		return { body: [] };
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
		timeSpent: c.timespent ? parseInt(c.timespent, 10) : undefined,
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
		const { data } = await kirbyFetch('pages/blog/children?limit=100&select=id,slug,content');
		return data
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
 * Get the markdown content for a blog post (stored in content.md on disk)
 */
export async function getBlogPostContent(slug: string): Promise<string> {
	try {
		const filePath = join(process.cwd(), 'cms', 'content', 'blog', slug, 'content.md');
		return await readFile(filePath, 'utf-8');
	} catch {
		return '';
	}
}
