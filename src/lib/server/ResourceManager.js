import dataManager from './DataManager.js';
import authenticationManager from '#lib/server/auth/AuthenticationManager.js';
import Roles from '#lib/server/auth/Roles.js';

const RESOURCES_COLLECTION = 'resources';

// These are the times we can book campus resources
// It is in 24 hour time for simplicity
const BOOKING_HOURS = Object.freeze({
	OPEN: 8,
	CLOSE: 18
});

// The fields an administrator can set on a resource
// Availability is handled through a separate method
const RESOURCE_FIELDS = Object.freeze([
	'name',
	'description',
	'type',
	'building',
	'room',
	'capacity'
]);

const REQUIRED_RESOURCE_FIELDS = Object.freeze(['name', 'type', 'building']);

export class ResourceError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ResourceError';
	}
}

class ResourceManager {
	constructor(data = dataManager, auth = authenticationManager) {
		this.dataManager = data;
		this.authenticationManager = auth;
	}

	//gets all campus resources from the database
	async getResources() {
		const resources = await this.dataManager.load({
			collection: 'resources'
		});

		return resources;
	}

	//gets one campus resource by id, or null if it does not exist
	async getResource(resourceId) {
		const resource = await this.dataManager.load({
			collection: 'resources',
			id: resourceId
		});
		return resource;
	}

	/**
	 * Checks if a resource can be booked for the given period.
	 *
	 * @param {object} resource The resource to be checked for availability.
	 * @param {object} period The period in the form { date, startHour, endHour },
	 * where the hours are integers in 24 hour time (e.g., 14).
	 *
	 * @returns true if the resource is available and
	 * the period is allowed for that resource, otherwise false.
	 */
	isAvailable(resource, period) {
		// Cannot book unavailable resources
		if (resource.availability === false) {
			return false;
		}

		// The hours have to be within the bookable hours
		const { startHour, endHour } = period;
		return (
			startHour >= BOOKING_HOURS.OPEN &&
			endHour <= BOOKING_HOURS.CLOSE &&
			startHour < endHour
		);
	}

	// Only administrators can manage resources
	#requireAdministrator(user) {
		const isAdministrator = this.authenticationManager.hasRole(
			user,
			Roles.ROLES.ADMINISTRATOR
		);

		if (!isAdministrator) {
			throw new ResourceError('Only administrators can manage resources.');
		}
	}

	// Loads the resource or throws if it doesn't exist
	async #requireResource(resourceId) {
		const resource = await this.getResource(resourceId);

		if (!resource) {
			throw new ResourceError('This resource does not exist.');
		}

		return resource;
	}

	// Keep only the defined fields of the resource
	#pickResourceFields(details) {
		const fields = {};

		for (const field of RESOURCE_FIELDS) {
			if (details[field] !== undefined) {
				fields[field] = details[field];
			}
		}

		return fields;
	}

	// Checks that a resource has the required fields and a valid capacity
	#validateResource(resource) {
		for (const field of REQUIRED_RESOURCE_FIELDS) {
			const value = resource[field];
			if (typeof value !== 'string' || value.trim() === '') {
				throw new ResourceError(`The resource ${field} is required.`);
			}
		}

		// The equipment or room capacity should be at least 1
		if (resource.capacity !== undefined) {
			const isValidCapacity =
				Number.isInteger(resource.capacity) && resource.capacity > 0;
			if (!isValidCapacity) {
				throw new ResourceError('The capacity must be a positive integer.');
			}
		}
	}

	/**
	 * Allows an administrator to add a resource to the database
	 *
	 * @param {User} user The logged in user.
	 * @param {object} details  { name, type, building, description?, room?, capacity?, availability? }
	 * @returns {Promise<string>} The id of the new resource.
	 * @throws {ResourceError} If the user is not an admin or the provided resource details are invalid.
	 */
	async addResource(user, details) {
		this.#requireAdministrator(user);

		const resource = {
			...this.#pickResourceFields(details),
			availability: details.availability !== false
		};
		this.#validateResource(resource);

		const resourceId = await this.dataManager.save({
			collection: RESOURCES_COLLECTION,
			documentData: resource
		});

		return resourceId;
	}

	/**
	 * Allows the administrator to edit a resource.
	 *
	 * @param {User} user The logged in user.
	 * @param {string} resourceId The id of the resource to edit.
	 * @param {object} details The fields to change. The fields are from RESOURCE_FIELDS.
	 * @returns {Promise<object>} The updated resource.
	 * @throws {ResourceError} If the user is not an administrator, the resource doesn't exist, or the details are invalid.
	 */
	async editResource(user, resourceId, details) {
		this.#requireAdministrator(user);
		const resource = await this.#requireResource(resourceId);

		// Validate the resource after edits
		const changes = this.#pickResourceFields(details);
		const updatedResource = { ...resource, ...changes };
		this.#validateResource(updatedResource);

		await this.dataManager.update({
			collection: RESOURCES_COLLECTION,
			id: resourceId,
			updatedFields: changes
		});

		return updatedResource;
	}

	/**
	 * Allows the administrator to remove a resource, including
	 * cancelling all of its upcoming reservations.
	 *
	 * The reservationManager has to be passed because
	 * using it in ResourceManager's constructor would
	 * cause a circular import.
	 *
	 * @param {User} user The logged in user.
	 * @param {string} resourceId The id of the resource to remove.
	 * @param {ReservationManager} reservationManager Used to cancel the reservations.
	 * @throws {ResourceError} If the user is not an administrator or the resource doesn't exist.
	 */
	async removeResource(user, resourceId, reservationManager) {
		this.#requireAdministrator(user);
		const resource = await this.#requireResource(resourceId);

		// Cancel reservations before deleting the resource
		await reservationManager.cancelReservationsFor(resource);

		await this.dataManager.delete({
			collection: RESOURCES_COLLECTION,
			id: resourceId
		});
	}

	/**
	 * Allows an administrator to set the availability for
	 * a resource to true or false. If the availability is
	 * false, the resource cannot be booked.
	 *
	 * @param {User} user The logged in user.
	 * @param {string} resourceId The id of the resource.
	 * @param {boolean} availability True if the resource can be booked.
	 * @throws {ResourceError} If the user is not an administrator, the resource does not exist,
	 * or the availability is not a boolean.
	 */
	async setAvailability(user, resourceId, availability) {
		this.#requireAdministrator(user);
		await this.#requireResource(resourceId);

		if (typeof availability !== 'boolean') {
			throw new ResourceError('The availability must be true or false.');
		}

		await this.dataManager.update({
			collection: RESOURCES_COLLECTION,
			id: resourceId,
			updatedFields: { availability }
		});
	}
}

export default ResourceManager;
