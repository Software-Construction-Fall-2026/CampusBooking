import { describe, it, expect, beforeEach } from 'vitest';
import dataManager from '#lib/server/DataManager.js';
import { clearEmulator } from '#lib/server/testing/emulator.js';

beforeEach(clearEmulator);

const SAMPLES = {
	users: { email: 'juan@campus.edu', name: 'Juan', role: 'student' },
	resources: { name: 'Study Room', type: 'classroom', availability: true },
	sessions: { userId: 'juan', tokenHash: 'abc123' }
};

const COLLECTION = 'resources';
const LAB = { name: 'Computer Lab', type: 'lab', availability: true };
const ROOM = { name: 'Study Room', type: 'classroom', availability: true };

describe('DataManager save and load', () => {
	// Save and load by by id
	it.each(Object.entries(SAMPLES))(
		'saves a document that can be loaded by id',
		async (collection, documentData) => {
			const id = await dataManager.save({ collection, documentData });
			const loaded = await dataManager.load({ collection, id });
			expect(loaded).toEqual({ id, ...documentData });
		}
	);
});

describe('DataManager filter, update, and delete', () => {
	let labId;
	beforeEach(async () => {
		labId = await dataManager.save({
			collection: COLLECTION,
			documentData: LAB
		});
		await dataManager.save({ collection: COLLECTION, documentData: ROOM });
	});

	// Filter only for the type
	it('returns only documents matching the filter', async () => {
		const labs = await dataManager.load({
			collection: COLLECTION,
			filters: [{ field: 'type', operator: '==', value: 'lab' }]
		});
		expect(labs).toEqual([
			{
				id: labId,
				...LAB
			}
		]);
	});

	// Update only one field
	it('updates only the given field', async () => {
		await dataManager.update({
			collection: COLLECTION,
			id: labId,
			updatedFields: { availability: false }
		});

		const lab = await dataManager.load({ collection: COLLECTION, id: labId });
		expect(lab).toEqual({ id: labId, ...LAB, availability: false });
	});

	// Delete a document by id
	it('removes a deleted document from firestore', async () => {
		await dataManager.delete({ collection: COLLECTION, id: labId });
		const lab = await dataManager.load({ collection: COLLECTION, id: labId });
		expect(lab).toBeNull();
	});
});
