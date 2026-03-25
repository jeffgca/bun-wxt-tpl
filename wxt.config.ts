import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	modules: ['@wxt-dev/webextension-polyfill', '@wxt-dev/module-svelte'],
	manifest: {
		host_permissions: ['<all_urls>'],
		permissions: ['storage', 'tabs', 'activeTab', 'alarms'],
		action: {
			default_title: 'Wxt / Bun / Svelte Template',
			// default_popup: 'popup.html',
		},
		browser_action: {
			default_title: 'Wxt / Bun / Svelte Template',
			// default_popup: 'popup.html',
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
