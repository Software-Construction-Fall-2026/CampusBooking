import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.js',
	// Sets up the firebase emulator before any system tests
	globalSetup: './e2e/global-setup.js',
	// Only one test at a time since they use the same emulated database
	workers: 1,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		timeout: 120_000
	}
});
