export interface ProjectMetadata {
	title?: string;
	subtitle?: string;
	mainDescription?: string;
	date: Date;
	priority: number;
	isRestricted: boolean;
	previewImage?: string;
	nextCardImage?: string;
	mainImage?: string;
	slug: string;
}

// Type alias for compatibility with existing components
export type Project = ProjectMetadata;

export interface BlogPostMetadata {
	title: string;
	slug: string;
	excerpt: string;
	publishedAt: Date;
	timeSpent?: number;
	githubLink?: string;
	instagramLink?: string;
	onshapeLink?: string;
	downloadableFile?: string;
}
