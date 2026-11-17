import dataManager from '#lib/server/DataManager.js';
import authenticationManager from '#lib/server/auth/AuthenticationManager.js';
import { clearEmulator } from '#lib/server/testing/emulator.js';
import { ADMIN, RESOURCES } from './helpers.js';

// Starts every run with the same sample data
// The admins can't make accounts through the UI
// so we just make a sample admin account
export default async function globalSetup() {
	await clearEmulator();

	await dataManager.save({
		collection: 'users',
		id: ADMIN.id,
		documentData: {
			id: ADMIN.id,
			email: ADMIN.email,
			name: ADMIN.name,
			role: 'admin',
			passwordHash: await authenticationManager.getPasswordHash(ADMIN.password)
		}
	});

	for (const { id, ...resource } of RESOURCES) {
		await dataManager.save({
			collection: 'resources',
			id,
			documentData: { ...resource, availability: true }
		});
	}
}
