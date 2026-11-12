import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

import User from './User.js';
import dataManager from '#lib/server/DataManager.js';
import auth, { AuthenticationError } from './AuthenticationManager.js';

// Mock data manager to avoid affecting the database
vi.mock('#lib/server/DataManager.js', () => ({
	default: { load: vi.fn(), save: vi.fn(), delete: vi.fn() }
}));

// Used for hashing session tokens
const sha256 = (text) => {
	return createHash('sha256').update(text).digest('hex');
};

const mockStudent = {
	email: 'john@campus.edu',
	name: 'John',
	role: 'student'
};

const TEST_USER_ID = 'test-user-id';

beforeEach(() => vi.clearAllMocks());

describe('AuthenticationManager', () => {
	// Hashed passwords should match the real hashed password in users collection
	it('checkPassword accepts only the password that was hashed', async () => {
		const passwordHash = await auth.getPasswordHash('secret');

		expect(await auth.checkPassword('secret', passwordHash)).toBe(true);
		expect(await auth.checkPassword('wrong', passwordHash)).toBe(false);
	});

	// Three valid roles are student, faculty, and admin
	it('hasRole compares roles ignoring case', () => {
		const user = new User(mockStudent);

		expect(auth.hasRole(user, 'STUDENT')).toBe(true);
		expect(auth.hasRole(user, 'faculty')).toBe(false);
		expect(auth.hasRole(null, 'student')).toBe(false);
	});

	// Sessions are set by the client but auth only returns them,
	// so we don't test that client responsibility part here
	it('signUp saves the user and a session', async () => {
		dataManager.load.mockResolvedValue([]);

		const { user, session } = await auth.signUp({
			...mockStudent,
			password: 'secret'
		});

		expect(user.getEmail()).toBe(mockStudent.email);
		// Data manager saves user and session to the database collections
		expect(dataManager.save).toHaveBeenCalledTimes(2);
		expect(dataManager.save).toHaveBeenLastCalledWith(
			expect.objectContaining({ collection: 'sessions', id: session.tokenHash })
		);
	});

	// No two users can have the same email, and authmanager throws on this
	it('signUp rejects an email that is already registered', async () => {
		dataManager.load.mockResolvedValue([{ id: TEST_USER_ID }]);

		await expect(
			auth.signUp({ ...mockStudent, password: 'secret' })
		).rejects.toThrow(AuthenticationError);

		expect(dataManager.save).not.toHaveBeenCalled();
	});

	// Our sanity check for the typical login case
	it('logIn returns the user when the credentials are correct', async () => {
		const passwordHash = await auth.getPasswordHash('secret');

		dataManager.load.mockResolvedValue([
			{ id: TEST_USER_ID, ...mockStudent, passwordHash }
		]);

		const { user } = await auth.logIn({ ...mockStudent, password: 'secret' });
		expect(user.getUserId()).toBe(TEST_USER_ID);
		expect(dataManager.save).toHaveBeenCalledOnce();
	});

	// Password hashes won't match
	it('logIn rejects a wrong password', async () => {
		const passwordHash = await auth.getPasswordHash('secret');

		dataManager.load.mockResolvedValue([
			{ id: TEST_USER_ID, ...mockStudent, passwordHash }
		]);

		await expect(
			auth.logIn({ ...mockStudent, password: 'badPassword' })
		).rejects.toThrow(AuthenticationError);
	});

	// Every session must have a real user, otherwise it should be invalidated
	it('getCurrentUser returns the user of a valid session', async () => {
		const expiresAt = { toDate: () => new Date(Date.now() + 60_000) };

		dataManager.load
			.mockResolvedValueOnce({ userId: TEST_USER_ID, expiresAt })
			.mockResolvedValueOnce({ id: TEST_USER_ID, ...mockStudent });

		const user = await auth.getCurrentUser('token');
		expect(user.getUserId()).toBe(TEST_USER_ID);
	});

	// Session time limit is seven days, so anything before that works for an expired session
	it('getCurrentUser deletes an expired session and returns null', async () => {
		const expiresAt = { toDate: () => new Date(Date.now() - 60_000) };

		dataManager.load.mockResolvedValueOnce({ userId: TEST_USER_ID, expiresAt });

		expect(await auth.getCurrentUser('token')).toBeNull();
		expect(dataManager.delete).toHaveBeenCalledWith({
			collection: 'sessions',
			id: sha256('token')
		});
	});

	// Browser should also delete the session token, but we only
	// test auth manager removing it from the database collection
	it('logOut deletes the session of the hashed token', async () => {
		await auth.logOut('token');

		expect(dataManager.delete).toHaveBeenCalledWith({
			collection: 'sessions',
			id: sha256('token')
		});
	});
});
