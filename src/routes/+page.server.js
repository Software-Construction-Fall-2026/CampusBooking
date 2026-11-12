import { redirect } from '@sveltejs/kit';

import ResourceManager from '#lib/server/ResourceManager.js';
import reservationManager from '#lib/server/reservations/ReservationManager.js';

const resourceManager = new ResourceManager();

// How many upcoming reservations the dashboard shows
const UPCOMING_LIMIT = 3;

// Dashboard shows the buttons for each resource category
// and a few of the user's reservations
export async function load({ locals }) {
	if (!locals.user) {
		redirect(303, 'auth/login');
	}

	// Count resources of each type
	const resources = await resourceManager.getResources();
	const resourceCounts = {};
	for (const resource of resources) {
		const type = resource.type.toLowerCase();
		resourceCounts[type] = (resourceCounts[type] ?? 0) + 1;
	}

	// Administrators do not have reservations
	let upcoming = null;
	if (reservationManager.canReserve(locals.user)) {
		const reservations = await reservationManager.getMyReservations(
			locals.user
		);
		upcoming = reservations.upcoming.slice(0, UPCOMING_LIMIT);
	}

	return { resourceCounts, upcoming };
}
