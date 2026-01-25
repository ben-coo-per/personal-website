import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import type { ProjectMetadata, BlogPostMetadata } from '$lib/types';

// Re-export types for backward compatibility
export type { ProjectMetadata, BlogPostMetadata, Project } from '$lib/types';

/**
 * Parse Kirby's text format (Field: Value separated by ----)
 */
function parseKirbyFile(content: string): Record<string, string> {
	const blocks = content.split('----').filter((block) => block.trim());
	const metadata: Record<string, string> = {};

	for (const block of blocks) {
		const colonIndex = block.indexOf(':');
		if (colonIndex === -1) continue;

		const key = block.substring(0, colonIndex).trim();
		const value = block.substring(colonIndex + 1).trim();

		if (key && value) {
			metadata[key.toLowerCase()] = value;
		}
	}

	return metadata;
}

/**
 * Get a single project by slug
 */
export function getProject(slug: string): ProjectMetadata | null {
	const projectPath = path.resolve(`./cms/content/projects/${slug}/project.txt`);

	try {
		const content = readFileSync(projectPath, 'utf-8');
		const rawMetadata = parseKirbyFile(content);

		return {
			title: rawMetadata.title,
			subtitle: rawMetadata.subtitle,
			mainDescription: rawMetadata.maindescription,
			date: new Date(rawMetadata.date || Date.now()),
			priority: parseInt(rawMetadata.priority || '0', 10),
			isRestricted: rawMetadata.isrestricted === 'true',
			previewImage: rawMetadata.previewimage,
			nextCardImage: rawMetadata.nextcardimage,
			mainImage: rawMetadata.mainimage,
			slug
		};
	} catch (error) {
		console.error(`Failed to load project ${slug}:`, error);
		return null;
	}
}

/**
 * Get all projects (optionally including restricted ones)
 */
export function getProjects(includeRestricted = false): ProjectMetadata[] {
	const projectsPath = path.resolve('./cms/content/projects');

	try {
		const projectDirs = readdirSync(projectsPath).filter((dir) => {
			const fullPath = path.join(projectsPath, dir);
			return statSync(fullPath).isDirectory();
		});

		const projects = projectDirs
			.map((slug) => getProject(slug))
			.filter((project): project is ProjectMetadata => {
				if (!project) return false;
				if (!includeRestricted && project.isRestricted) return false;
				return true;
			});

		// Sort by priority (desc) then date (desc)
		return projects.sort((a, b) => {
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}
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
export function getNextProjectInOrder(
	currentSlug: string,
	includeRestricted = false
): ProjectMetadata | null {
	const allProjects = getProjects(includeRestricted);
	const currentIndex = allProjects.findIndex((project) => project.slug === currentSlug);

	if (currentIndex === -1 || allProjects.length <= 1) return null;

	const nextIndex = (currentIndex + 1) % allProjects.length;
	return allProjects[nextIndex];
}

/**
 * Get the markdown content for a project
 */
export function getProjectContent(slug: string): string {
	const contentPath = path.resolve(`./cms/content/projects/${slug}/content.md`);

	try {
		return readFileSync(contentPath, 'utf-8');
	} catch (error) {
		// Content file is optional - some projects may not have one
		return '';
	}
}

/**
 * Get list of asset files for a project
 */
export function getProjectAssets(slug: string): string[] {
	const projectPath = path.resolve(`./cms/content/projects/${slug}`);

	try {
		return readdirSync(projectPath).filter(
			(file) => file !== 'project.txt' && !file.startsWith('.')
		);
	} catch (error) {
		console.error(`Failed to load assets for ${slug}:`, error);
		return [];
	}
}

/**
 * Verify a passcode for restricted content
 */
export function verifyPasscode(passcode: string): boolean {
	const passcodesPath = path.resolve('./cms/content/passcodes.txt');

	try {
		const content = readFileSync(passcodesPath, 'utf-8');
		const passcodes = parseKirbyFile(content);

		// Check if the passcode exists and is active
		const codes = passcodes.codes?.split(',').map((c) => c.trim()) || [];
		return codes.includes(passcode);
	} catch (error) {
		console.error('Failed to verify passcode:', error);
		return false;
	}
}

/**
 * Get about page content
 */
export function getAboutPage(): { body: { text: string }[] } {
	const aboutPath = path.resolve('./cms/content/about.txt');

	try {
		const content = readFileSync(aboutPath, 'utf-8');
		// Split by ---- and extract Body fields
		const blocks = content.split('----').filter((block) => block.trim());
		const bodyParagraphs: { text: string }[] = [];

		for (const block of blocks) {
			const colonIndex = block.indexOf(':');
			if (colonIndex === -1) continue;

			const key = block.substring(0, colonIndex).trim().toLowerCase();
			const value = block.substring(colonIndex + 1).trim();

			if (key === 'body' && value) {
				bodyParagraphs.push({ text: value });
			}
		}

		return { body: bodyParagraphs };
	} catch (error) {
		console.error('Failed to load about page:', error);
		return { body: [] };
	}
}

// ============================================
// Blog Post Functions
// ============================================

/**
 * Get a single blog post by slug
 */
export function getBlogPost(slug: string): BlogPostMetadata | null {
	const blogPath = path.resolve(`./cms/content/blog/${slug}/blog.txt`);

	try {
		const content = readFileSync(blogPath, 'utf-8');
		const rawMetadata = parseKirbyFile(content);

		return {
			title: rawMetadata.title || 'Untitled',
			slug: rawMetadata.slug || slug,
			excerpt: rawMetadata.excerpt || '',
			publishedAt: new Date(rawMetadata.publishedat || Date.now()),
			timeSpent: rawMetadata.timespent ? parseInt(rawMetadata.timespent, 10) : undefined,
			githubLink: rawMetadata.githublink,
			instagramLink: rawMetadata.instagramlink,
			onshapeLink: rawMetadata.onshapelink,
			downloadableFile: rawMetadata.downloadablefile
		};
	} catch (error) {
		console.error(`Failed to load blog post ${slug}:`, error);
		return null;
	}
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getBlogPosts(): BlogPostMetadata[] {
	const blogPath = path.resolve('./cms/content/blog');

	try {
		const blogDirs = readdirSync(blogPath).filter((dir) => {
			const fullPath = path.join(blogPath, dir);
			return statSync(fullPath).isDirectory();
		});

		const posts = blogDirs
			.map((slug) => getBlogPost(slug))
			.filter((post): post is BlogPostMetadata => post !== null);

		// Sort by publishedAt date (newest first)
		return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
	} catch (error) {
		console.error('Failed to load blog posts:', error);
		return [];
	}
}

/**
 * Get the markdown content for a blog post
 */
export function getBlogPostContent(slug: string): string {
	const contentPath = path.resolve(`./cms/content/blog/${slug}/content.md`);

	try {
		return readFileSync(contentPath, 'utf-8');
	} catch (error) {
		console.error(`Failed to load blog post content for ${slug}:`, error);
		return '';
	}
}
