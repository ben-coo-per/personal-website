import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		fs: {
			// Allow serving files from the CMS content directory (one level up)
			allow: ['..']
		}
	},
	resolve: {
		alias: {
			'/cms-assets': path.resolve('../cms/content/projects')
		}
	}
});
