import { client } from '$lib/utils/sanity';

export const load = async () => {
	const restrictedProjects = await client.fetch(`
		*[_type == "project" && isRestricted == true] | order(date desc) {
			_type,
			_createdAt,
			title,
			subtitle,
			mainDescription,
			previewImage,
			mainImage,
			slug,
			date,
			priority,
			gallery,
			_id
		}
	`);

	return {
		restrictedProjects:
			restrictedProjects.map((project: any) => ({
				...project,
				date: new Date(project.date)
			})) || []
	};
};
