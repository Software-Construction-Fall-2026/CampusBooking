import { describe, it, expect, vi, beforeEach } from 'vitest';
import dataManager from './DataManager.js';

// Mock database
const db = vi.hoisted(() => {
	const mockDB = {
		add: vi.fn(),
		get: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	};

	// Chainable functions like Firestore
	mockDB.collection = vi.fn(() => mockDB);
	mockDB.doc = vi.fn(() => mockDB);
	mockDB.where = vi.fn(() => mockDB);
	return mockDB;
});

// Mock admin credentials and Firestore admin
vi.mock('./serviceAccountKey.json', () => ({
	default: {}
}));
vi.mock('firebase-admin/app', () => ({
	initializeApp: vi.fn(),
	cert: vi.fn(),
	getApps: () => [],
	getApp: vi.fn()
}));
vi.mock('firebase-admin/firestore', () => ({
	getFirestore: () => db
}));

beforeEach(() => {
	vi.clearAllMocks();
});

// Reusable mock user info
const TEST_USER_ID = 'test-user-id';
const TEST_USER_NAME = 'John';
const TEST_USERS_COLLECTION = "users";

// Data manager tests
describe('DataManager', () => {
	// Saves the user to the mock database collection
	it('save returns the id of the new item', async () => {
		db.add.mockResolvedValue({ id: TEST_USER_ID });
		expect(
			await dataManager.save({
				collection: TEST_USERS_COLLECTION,
				documentData: { name: TEST_USER_NAME }
			})
		).toBe(TEST_USER_ID);
		expect(db.add).toHaveBeenCalledWith({ name: TEST_USER_NAME });
	});

	// Loads the user from the collection by ID
	it('load returns the items matching the filters', async () => {
		db.get.mockResolvedValue({
			docs: [{ id: TEST_USER_ID, data: () => ({ name: TEST_USER_NAME }) }]
		});

		const result = await dataManager.load({
			collection: TEST_USERS_COLLECTION,
			filters: [{ field: 'name', operator: '==', value: TEST_USER_NAME }]
		});

		expect(db.where).toHaveBeenCalledWith('name', '==', TEST_USER_NAME);
		expect(result).toEqual([{ id: TEST_USER_ID, name: TEST_USER_NAME }]);
	});

	// Updates the user's name in the collection
	it('update changes the given fields', async () => {
		await dataManager.update({
			collection: TEST_USERS_COLLECTION,
			id: TEST_USER_ID,
			updatedFields: { name: 'Andrea' }
		});

		expect(db.doc).toHaveBeenCalledWith(TEST_USER_ID);
		expect(db.update).toHaveBeenCalledWith({ name: 'Andrea' });
	});

	// Deletes the user from the collection
	it('delete removes the item', async () => {
		await dataManager.delete({ collection: TEST_USERS_COLLECTION, id: TEST_USER_ID });
		expect(db.doc).toHaveBeenCalledWith(TEST_USER_ID);
		expect(db.delete).toHaveBeenCalled();
	});
});