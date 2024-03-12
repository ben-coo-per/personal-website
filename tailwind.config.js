/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			animation: {
				gradient: 'gradient 8s linear infinite',
				blur: 'blur 2s linear infinite alternate'
			},
			keyframes: {
				gradient: {
					to: { 'background-position': '200% center' }
				},
				blur: {
					'0%': { filter: 'blur(6px)' },
					'100%': { filter: 'blur(7px)' }
				}
			},
			colors: {
				'custom-black': '#081312'
			}
		},
		fontFamily: {
			sans: ['Neue Montreal', 'ui-sans-serif', 'system-ui'],
			serif: ['Hatton', 'ui-serif', 'Georgia']
		}
	},
	plugins: []
};
