import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],
	kit: {
		adapter: vercel()
	},
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	},
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.svx'],
			layout: {
				// You can add specific layouts for different content types
				// project: './src/routes/project/[slug]/+page.svx'
			}
		})
	]
};
export default config;
