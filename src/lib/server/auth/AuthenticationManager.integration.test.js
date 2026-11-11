import { describe, it, expect, beforeEach } from 'vitest';
import dataManager from '#lib/server/DataManager.js';
import { clearEmulator } from '#lib/server/testing/emulator.js';
import auth, {
	AuthenticationError
} from '#lib/server/auth/AuthenticationManager.js';

beforeEach(clearEmulator);

const JUAN = {
	email: 'juan@miners.utep.edu',
	name: 'Juan',
	role: 'student'
};
const PASSWORD = 'pass123';

describe('AuthenticationManager sign up', () => {
	// Sign up hashes the password so it's not just plain text
	it('stores the new user with a hashed password', async () => {
		const { user } = await auth.signUp({ ...JUAN, password: PASSWORD });
		const stored = await dataManager.load({
			collection: 'users',
			id: user.getUserId()
		});

		expect(stored).toMatchObject(JUAN);
		expect(stored.passwordHash).not.toContain(PASSWORD);
		expect(await auth.checkPassword(PASSWORD, stored.passwordHash)).toBe(true);
	});

	// No duplicate emails are allowed
	it('rejects a second sign up with the same email', async () => {
		await auth.signUp({ ...JUAN, password: PASSWORD });
		await expect(
			auth.signUp({
				...JUAN,
				password: 'different'
			})
		).rejects.toThrow(AuthenticationError);

		const users = await dataManager.load({ collection: 'users' });
		expect(users).toHaveLength(1);
	});
});

describe('AuthenticationManager sessions', () => {
	beforeEach(async () => {
		await auth.signUp({ ...JUAN, password: PASSWORD });
	});

	// Make sure user can log in only with the right password
	it('rejects an incorrect password', async () => {
		await expect(
			auth.logIn({ ...JUAN, password: 'badpassword1234' })
		).rejects.toThrow(AuthenticationError);
	});

	// The session gets invalidated when you log out
	it('returns the user while logged in and null after logging out', async () => {
		const { session } = await auth.logIn({ ...JUAN, password: PASSWORD });
		const current = await auth.getCurrentUser(session.token);
		expect(current.getEmail()).toBe(JUAN.email);

		await auth.logOut(session.token);
		expect(await auth.getCurrentUser(session.token)).toBeNull();
	});
});
