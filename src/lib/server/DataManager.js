// Firebase service account key is required
// to interact with Firestore from the server-side
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };

// Used to create a firestore instance with admin access
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * DataManager is the core component
 * of the data management subsystem. It is the only class
 * that accesses the database directly.
 *
 * It exposes the generic public methods
 * save(item), load(criteria), update(item), and delete(item)
 * for classes that need to interact with the database.
 *
 * It is implemented exactly according to the SDD Report,
 * specifically with Contract 15: Store and Retrieve Data.
 */
class DataManager {
	// Firestore database instance obtained from getFirestore
	#db;

	constructor(db) {
		this.#db = db;
	}

	/**
	 * Saves an item to the database collection.
	 *
	 * If id is not provided, it is generated automatically.
	 *
	 * `documentData` is an object containing the document to
	 *  be saved.
	 *
	 * @param {object} item { collection, id?, documentData }
	 * @returns id of the saved item
	 *
	 * @example
	 *
	 * await dataManager.save({
	 *    collection: "users",
	 *    id: "Dm7gN93IhVlicpAvoytr",
	 *    documentData: { name: "Johnny" }
	 * });
	 *
	 * await dataManager.save({
	 *    collection: "randomMessages",
	 *    documentData: { message: "hello!", type: "friendly" }
	 * });
	 */
	async save(item) {
		const { collection, id, documentData } = item;
		if (id) {
			await this.#db.collection(collection).doc(id).set(documentData);
			return id;
		}

		const ref = await this.#db.collection(collection).add(documentData);
		return ref.id;
	}

	/**
	 * Loads items from the database collection
	 * matching the given criteria.
	 *
	 * Supports loading a resource by id
	 * or a collection with optional filters.
	 *
	 * If provided, `filters` must be a list
	 * of objects of the form `{ field, operator, value }`.
	 *
	 * If `id` is provided, `filters` will not be used.
	 *
	 * @param {object} criteria {collection, id?, filters?}
	 *
	 * @example
	 * // Load a resource by id
	 * await dataManager.load({
	 *    collection: "resources",
	 *    id: "Dm7gN93IhVlicpAvoytr"
	 * });
	 *
	 * @example
	 * // Load an entire collection
	 * await dataManager.load({ collection: "reservations" });
	 *
	 * @example
	 * // Load a collection with filters (a query)
	 * await dataManager.load({
	 *    collection: "users",
	 *    filters: [
	 *      { field: "name", operator: "==", value: "John" }
	 *    ]
	 * });
	 */
	async load(criteria) {
		const { collection, id, filters = [] } = criteria;

		// Load resource by id
		if (id) {
			const doc = await this.#db.collection(collection).doc(id).get();
			if (!doc.exists) {
				return null;
			}
			return { id: doc.id, ...doc.data() };
		}

		// Build collection query with optional filters
		let query = this.#db.collection(collection);
		for (const filter of filters) {
			query = query.where(filter.field, filter.operator, filter.value);
		}

		// Get collection documents
		const snapshot = await query.get();
		const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		return docs;
	}

	/**
	 * Updates an item in the database collection by id.
	 *
	 * @param {object} item { collection, id, updatedFields }
	 *
	 * @example
	 * await dataManager.update({
	 *    collection: "resources",
	 *    id: "Dm7gN93IhVlicpAvoytr",
	 *    updatedFields: { name: "Laptop" }
	 * });
	 */
	async update(item) {
		const { collection, id, updatedFields } = item;
		await this.#db.collection(collection).doc(id).update(updatedFields);
	}

	/**
	 * Deletes an item from the database collection by id.
	 * @param {object} item { collection, id }
	 *
	 * @example
	 * await dataManager.delete({
	 *    collection: "resources",
	 *    id: "Dm7gN93IhVlicpAvoytr"
	 * });
	 */
	async delete(item) {
		const { collection, id } = item;
		await this.#db.collection(collection).doc(id).delete();
	}
}

/**
 * @returns The shared DataManager instance, which is reused
 * across any import of the DataManager class
 */
const initializeDataManager = () => {
	const app = initializeApp({
		credential: cert(serviceAccount)
	});
	const firestoreDatabase = getFirestore(app);
	return new DataManager(firestoreDatabase);
};

const dataManager = initializeDataManager();
export default dataManager;
