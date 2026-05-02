export interface ProjectMetadata {
	title?: string;
	subtitle?: string;
	mainDescription?: string;
	date: Date;
	priority: number;
	isRestricted: boolean;
	previewImage?: string;
	bgColor?: string;
	slug: string;
	archived?: boolean;
	timeSpent?: number;
	websiteUrl?: string;
	githubLink?: string;
	instagramLink?: string;
	onshapeLink?: string;
	downloadableFile?: string;
}

// Type alias for compatibility with existing components
export type Project = ProjectMetadata;

export interface AboutData {
	body: { html: string }[];
	email: string;
	github: string;
	instagram: string;
	linkedin: string;
	location: string;
	building: string[];
	reading: string[];
	watching: string[];
	playing: string[];
	aiProfile?: string;
}

export interface BlogPostMetadata {
	title: string;
	slug: string;
	excerpt: string;
	publishedAt: Date;
	githubLink?: string;
	instagramLink?: string;
	onshapeLink?: string;
	downloadableFile?: string;
}
