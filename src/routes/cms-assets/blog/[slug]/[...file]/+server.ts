import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

const MIME_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	stl: 'model/stl',
	pdf: 'application/pdf'
};

export const GET: RequestHandler = async ({ params }) => {
	const { slug, file } = params;

	// Prevent directory traversal attacks
	if (slug.includes('..') || file.includes('..')) {
		error(400, 'Invalid path');
	}

	const filePath = path.resolve(`./cms/content/blog/${slug}/${file}`);

	// Ensure the resolved path is within the expected directory
	const expectedBase = path.resolve('./cms/content/blog');
	if (!filePath.startsWith(expectedBase)) {
		error(400, 'Invalid path');
	}

	if (!existsSync(filePath)) {
		error(404, 'File not found');
	}

	try {
		const fileBuffer = readFileSync(filePath);
		const ext = path.extname(file).toLowerCase().slice(1);
		const contentType = MIME_TYPES[ext] || 'application/octet-stream';

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		error(500, 'Failed to read file');
	}
};
