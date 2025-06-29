import { createClient } from '@sanity/client';
import type { ImageAsset, Slug } from '@sanity/types';
import groq from 'groq';
import type { PortableTextBlock } from '@portabletext/types';

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

export async function getProjects(includeRestricted = false): Promise<Project[]> {
	return await client
		.fetch(
			groq`*[_type == "project" && defined(slug.current) ${includeRestricted ? '' : '&& (!defined(isRestricted) || isRestricted == false)'}] | order(priority desc, date desc)`
		)
		.then((projects) => {
			return projects.map((project: Project) => {
				return {
					...project,
					date: new Date(project.date)
				};
			});
		});
}

export async function getProject(slug: string): Promise<Project | null> {
	const project = await client.fetch(
		groq`
      *[_type == "project" && slug.current == $slug][0] {
        ...,
        gallery[]{
          ...,
          _type == "video" => {
            "muxPlaybackId": asset->playbackId,
            "muxAssetId": asset->assetId,
            "muxStatus": asset->status,
            "muxData": asset->data
          }
        }
      }
    `,
		{ slug }
	);

	console.log('FFFFOFOFOFOFOOFOFO');
	console.log('Fetched project:', project);

	if (!project) return null;

	return {
		...project,
		date: new Date(project.date)
	};
}

export async function getNextProjectInOrder(
	slug: string,
	includeRestricted?: boolean
): Promise<Project> {
	const allProjects = await getProjects(includeRestricted);
	const currentIndex = allProjects.findIndex((project) => project.slug.current === slug);
	const nextIndex = (currentIndex + 1) % allProjects.length;
	return allProjects[nextIndex];
}

export async function getAboutPage(): Promise<{ body: PortableTextBlock[] }> {
	return await client.fetch(groq`*[_type == "about"][0]`);
}

type Blurb = {
	_type: 'blurb';
	text: string;
	styling: string;
};

type Video = {
	_type: 'video';
	muxPlaybackId: string;
	muxAssetId: string;
	muxStatus: string;
};

export interface Project {
	_type: 'project';
	_createdAt: string;
	title?: string;
	subtitle?: string;
	slug: Slug;
	isRestricted?: boolean;
	previewImage?: ImageAsset;
	mainImage?: ImageAsset;
	mainDescription?: string;
	gallery: (ImageAsset | Blurb | Video)[];
	date: Date;
}
