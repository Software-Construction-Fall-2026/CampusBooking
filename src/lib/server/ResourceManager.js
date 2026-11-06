import dataManager from './DataManager.js';

// These are the times we can book campus resources
// It is in 24 hour time for simplicity
const BOOKING_HOURS = Object.freeze({
	OPEN: 8,
	CLOSE: 18
});

class ResourceManager {
	constructor(data = dataManager) {
		this.dataManager = data;
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
}

export default ResourceManager;
