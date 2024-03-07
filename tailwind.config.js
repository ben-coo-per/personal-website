/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {},
		fontFamily: {
			sans: ['Neue Montreal', 'ui-sans-serif', 'system-ui'],
			serif: ['Hatton', 'ui-serif', 'Georgia']
		}
	},
	plugins: []
};
