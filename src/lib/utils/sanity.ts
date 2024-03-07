import type { PortableTextBlock } from '@portabletext/types';
import { createClient } from '@sanity/client';
import type { ImageAsset, Slug } from '@sanity/types';
import groq from 'groq';

import { PUBLIC_SANITY_DATASET, PUBLIC_SANITY_PROJECT_ID } from '$env/static/public';

if (!PUBLIC_SANITY_PROJECT_ID || !PUBLIC_SANITY_DATASET) {
	throw new Error(
		'You must include the sanity project ID and dataset in your environment variables.'
	);
}

export const client = createClient({
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET,
	useCdn: false, // `false` if you want to ensure fresh data
	apiVersion: '2023-03-20' // date of setup
});

export async function getProjects(): Promise<Project[]> {
	return await client.fetch(
		groq`*[_type == "project" && defined(slug.current)] | order(_createdAt desc)`
	);
}

export async function getProject(slug: string): Promise<Project> {
	return await client.fetch(groq`*[_type == "project" && slug.current == $slug][0]`, {
		slug
	});
}

export interface Project {
	_type: 'project';
	_createdAt: string;
	title?: string;
	subtitle?: string;
	slug: Slug;
	previewImage?: ImageAsset;
	images: ImageAsset[];
	blurbs: PortableTextBlock[];
}
