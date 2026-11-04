/**
 *
 * Handles log in, log out, signup functionality and tells other subsystems who
 * the current user is with their role (student, faculty member, or administrator).
 *
 * It is implemented according to the SDD report, with concrete
 * usage of sessions and password verification. It supports the
 * contracts C1: Log In / Log Out, and C2: Check user role,
 * along with other smaller utility functions.
 *
 *
 */

// Used for hashing session tokens and passwords
import {
	randomBytes,
	randomUUID,
	scrypt,
	createHash,
	timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';

import User from '#lib/server/auth/User.js';
import dataManager from '#lib/server/DataManager.js';
import Roles from '#lib/server/auth/Roles.js';

// Scrypt uses callbacks, but we prefer async/await
const scryptAsync = promisify(scrypt);
const CONSTANTS = {
	PASSWORD_KEY_LENGTH: 64,
	SESSION_DURATION_MS: 1000 * 60 * 60 * 24 * 7,
	USERS_COLLECTION: 'users',
	SESSIONS_COLLECTION: 'sessions'
};

// Used when sign ups or log ins fail
export class AuthenticationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

class AuthenticationManager {
	/**
	 * Retrieves the current user associated with a session token.
	 *
	 * @param {string} sessionToken The session token stored on the browser client.
	 * @returns The authenticated `User` object, or null if the session is invalid.
	 */
	async getCurrentUser(sessionToken) {
		if (!sessionToken) {
			return null;
		}

		// Get the token hash to find the real session
		const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
		const session = await dataManager.load({
			collection: CONSTANTS.SESSIONS_COLLECTION,
			id: tokenHash
		});

		// Invalid sessions are rejected
		if (!session) {
			return null;
		}

		// Expired sessions have to be deleted
		const expiresAt = session.expiresAt.toDate();
		if (expiresAt <= new Date()) {
			await dataManager.delete({
				collection: CONSTANTS.SESSIONS_COLLECTION,
				id: tokenHash
			});
			return null;
		}

		const userDocument = await dataManager.load({
			collection: CONSTANTS.USERS_COLLECTION,
			id: session.userId
		});

		// User id doesn't exist
		if (!userDocument) {
			return null;
		}

		const user = new User({
			userId: userDocument.id,
			email: userDocument.email,
			name: userDocument.name,
			role: userDocument.role,
			passwordHash: userDocument.passwordHash
		});

		return user;
	}

	/**
	 * Logs the user out by deleting their session from the database.
	 * @param {string} sessionToken The session token to invalidate (comes from the browser client).
	 */
	async logOut(sessionToken) {
		if (!sessionToken) {
			return;
		}

		// Client side token is unhashed
		const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
		await dataManager.delete({
			collection: CONSTANTS.SESSIONS_COLLECTION,
			id: tokenHash
		});
	}

	/**
	 * Checks whether a user has a specific role.
	 *
	 * @param {User | null} user The user whose role is being checked.
	 * @param {string} role The role to check for (student, faculty, or admin).
	 * @returns {boolean} True if the user has the role, otherwise false.
	 */
	hasRole(user, role) {
		if (!user) {
			return false;
		}
		return user.getRole().toLowerCase() === role.toLowerCase();
	}

	/**
	 * Generates a salted password hash using `scrypt`
	 *
	 * @param {string} password The plain text password to hash.
	 * @returns {Promise<string>} The salt and password hash separated by a colon
	 */
	async getPasswordHash(password) {
		const salt = randomBytes(16).toString('hex');
		const hash = await scryptAsync(
			password,
			salt,
			CONSTANTS.PASSWORD_KEY_LENGTH
		);
		return `${salt}:${hash.toString('hex')}`;
	}

	/**
	 * Generates a new session token.
	 *
	 * The token is returned to the client,
	 * which should set the session cookie.
	 *
	 * @returns {Promise<object>} An object containing the token, tokenHash, and expiration date.
	 */
	async createSession() {
		const token = randomBytes(32).toString('base64url');
		const expiresAt = new Date(Date.now() + CONSTANTS.SESSION_DURATION_MS);
		const tokenHash = createHash('sha256').update(token).digest('hex');
		return { token, tokenHash, expiresAt };
	}

	/**
	 * Registers a new user and creates their session.
	 *
	 * Checks that the email is not already registered,
	 * and that the user role is allowed for signup (student or faculty).
	 *
	 * Passwords are stored in hashed format for safety.
	 *
	 * @param {object} userData { email, name, password, role }
	 * @returns {Promise<object>} An object containing the new `User` object and their session.
	 * @throws {AuthenticationError} If credentials are invalid
	 */
	async signUp({ email, name, password, role }) {
		// No two users can have the same email
		const existingUsers = await dataManager.load({
			collection: 'users',
			filters: [{ field: 'email', operator: '==', value: email }]
		});
		if (existingUsers.length > 0) {
			throw new AuthenticationError(
				'An account with this email already exists.'
			);
		}

		// Only student and faculty roles are valid for signups
		if (!Roles.isValidSignupRole(role)) {
			throw new AuthenticationError('Invalid role');
		}

		// Passwords are not stored in plain text
		const passwordHash = await this.getPasswordHash(password);
		const user = new User({
			userId: randomUUID(),
			email,
			name,
			role,
			passwordHash
		});

		// Save user to database
		await dataManager.save({
			collection: CONSTANTS.USERS_COLLECTION,
			id: user.getUserId(),
			documentData: {
				...user.toDocument()
			}
		});

		// Create and save session
		// Clients must set browser session cookie
		const session = await this.createSession();
		await dataManager.save({
			collection: CONSTANTS.SESSIONS_COLLECTION,
			id: session.tokenHash,
			documentData: {
				userId: user.getUserId(),
				expiresAt: session.expiresAt
			}
		});

		return { user, session };
	}

	/**
	 * Verifies a password against a previously stored salted hash.
	 *
	 * @param {string} password The password to verify.
	 * @param {string} storedPasswordHash The stored salt and hash separated by a colon.
	 * @returns {Promise<boolean>} True if the password matches, otherwise false.
	 */
	async checkPassword(password, storedPasswordHash) {
		// Salt and hash are stored separated by a colon
		const [salt, hash] = (storedPasswordHash ?? '').split(':');
		if (!salt || !hash) {
			return false;
		}

		// Compare provided password hash with stored hash
		const storedHash = Buffer.from(hash, 'hex');
		const attemptedHash = await scryptAsync(
			password,
			salt,
			CONSTANTS.PASSWORD_KEY_LENGTH
		);
		const isPasswordCorrect =
			storedHash.length === attemptedHash.length &&
			timingSafeEqual(storedHash, attemptedHash);
		return isPasswordCorrect;
	}

	/**
	 * Authenticates a user with email, password, and role.
	 *
	 * The provided role is verified to ensure that it matches
	 * the user's actual role.
	 * @param {object} credentials { email, password, role }
	 * @returns {Promise<object>} An object containing the `User` object and their session.
	 * @throws {AuthenticationError} If credentials are invalid
	 */
	async logIn({ email, password, role }) {
		const invalidCredentials = new AuthenticationError(
			'Incorrect email or password.'
		);

		// Get user from database
		const users = await dataManager.load({
			collection: CONSTANTS.USERS_COLLECTION,
			filters: [{ field: 'email', operator: '==', value: email }]
		});
		if (users.length === 0) {
			throw invalidCredentials;
		}
		const userDocument = users[0];
		const user = new User({
			userId: userDocument.id,
			email: userDocument.email,
			name: userDocument.name,
			role: userDocument.role,
			passwordHash: userDocument.passwordHash
		});

		// Check password
		const isPasswordCorrect = await this.checkPassword(
			password,
			user.getPasswordHash()
		);
		if (!isPasswordCorrect) {
			throw invalidCredentials;
		}

		// Verifies the user's claimed role
		if (user.getRole().toLowerCase() !== role.toLowerCase()) {
			throw new AuthenticationError(`Mismatched role: ${role}.`);
		}

		// Create and save session
		const session = await this.createSession();
		await dataManager.save({
			collection: CONSTANTS.SESSIONS_COLLECTION,
			id: session.tokenHash,
			documentData: {
				userId: user.getUserId(),
				expiresAt: session.expiresAt
			}
		});

		return { user, session };
	}
}

// The manager is shared/cached across imports
const authenticatonManager = new AuthenticationManager();
export default authenticatonManager;
