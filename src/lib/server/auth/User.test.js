import { describe, it, expect } from 'vitest';
import User from './User.js';
import Roles from './Roles.js';

// Sample user, not User object
// Hash doesn't need to be a real
// hash for testing purposes
const mockUserData = {
	userId: 'test-user-id',
	email: 'john@miners.utep.edu',
	name: 'John',
	role: Roles.ROLES.STUDENT,
	passwordHash: 'hash123'
};

describe('User', () => {
	// Getter tests
	it('getters return the values given to the constructor', () => {
		const user = new User(mockUserData);
		expect(user.getUserId()).toBe(mockUserData.userId);
		expect(user.getEmail()).toBe(mockUserData.email);
		expect(user.getName()).toBe(mockUserData.name);
		expect(user.getRole()).toBe(mockUserData.role);
		expect(user.getPasswordHash()).toBe(mockUserData.passwordHash);
	});

	// toDocument helps when converting Users to plain objects for Firestore
	it('toDocument returns a plain object with user id instead of user object', () => {
		const { userId, ...rest } = mockUserData;
		expect(new User(mockUserData).toDocument()).toEqual({
			id: userId,
			...rest
		});
	});
});
