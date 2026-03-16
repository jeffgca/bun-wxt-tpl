import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/module-svelte'],
	manifest: {
		host_permissions: ['<all_urls>'],
		permissions: ['storage', 'tabs', 'activeTab', 'alarms'],
		action: {
			default_title: 'Wxt / Bun / Svelte Template',
			// No default_popup - clicking the button will be handled by the background script
		},
	},
	svelte: {
		vite: {
			compilerOptions: {
				experimental: {
					async: true,
				},
			},
		},
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
})
