import vercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { loadEnv } from 'vite';

// Project media (<video src="/cms-assets/…">) 302s to the R2 bucket, and CSP
// re-checks the redirect target, so the bucket has to be an allowed media source.
const { PUBLIC_R2_URL } = loadEnv('production', process.cwd(), 'PUBLIC_');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],
	kit: {
		adapter: vercel(),
		// Nonce mode lets SvelteKit's own inline bootstrap script run without
		// 'unsafe-inline' in script-src. style-src keeps 'unsafe-inline' (SvelteKit
		// only nonces styles when it's absent) for the inline bg-color <style> and
		// motion's style attributes.
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				// blob: is for /export, which decodes fetched images via object URLs.
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				'media-src': ['self', PUBLIC_R2_URL],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
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
