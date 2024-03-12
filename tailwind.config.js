/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			animation: {
				gradient: 'gradient 8s linear infinite'
			},
			keyframes: {
				gradient: {
					to: { 'background-position': '200% center' }
				}
			}
		},
		fontFamily: {
			sans: ['Neue Montreal', 'ui-sans-serif', 'system-ui'],
			serif: ['Hatton', 'ui-serif', 'Georgia']
		}
	},
	plugins: []
};
