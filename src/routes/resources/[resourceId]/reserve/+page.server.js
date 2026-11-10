import { error, fail, redirect } from '@sveltejs/kit';

import ResourceManager from '#lib/server/ResourceManager.js';
import reservationManager, {
	ReservationError
} from '#lib/server/reservations/ReservationManager.js';

const resourceManager = new ResourceManager();

// Converts the resource to a plain object for the browser
const toResourceView = (resource) => {
	return {
		id: resource.id,
		name: resource.name,
		type: resource.type,
		building: resource.building,
		room: resource.room,
		capacity: resource.capacity,
		description: resource.description,
		imageUrl: resource.imageUrl
	};
};

// Shows the available time slots of a resource on the selected date
export async function load({ locals, params, url }) {
	if (!locals.user) {
		redirect(303, '/auth/login');
	}

	if (!reservationManager.canReserve(locals.user)) {
		error(403, 'Only students and faculty members can make reservations.');
	}

	const resource = await resourceManager.getResource(params.resourceId);
	if (!resource) {
		error(404, 'Resource not found.');
	}

	// The selected date comes from the url query params
	const bookingWindow = reservationManager.getBookingWindow();
	let date = url.searchParams.get('date');
	if (!reservationManager.isWithinBookingWindow(date)) {
		date = bookingWindow.firstDate;
	}

	const slots = await reservationManager.getAvailableSlots(resource, date);

	return {
		resource: toResourceView(resource),
		bookingWindow,
		date,
		slots
	};
}

export const actions = {
	default: async ({ locals, params, request }) => {
		// Only logged in users can make reservations
		if (!locals.user) {
			redirect(303, '/auth/login');
		}

		const form = await request.formData();
		const date = form.get('date');
		const startHour = Number(form.get('startHour'));

		try {
			// Makes and returns the created reservation
			const reservation = await reservationManager.makeReservation(
				locals.user,
				params.resourceId,
				date,
				startHour
			);

			return {
				reservation: {
					id: reservation.getReservationId(),
					date: reservation.getDate(),
					timeLabel: reservation.getTimeLabel()
				}
			};
		} catch (err) {
			if (err instanceof ReservationError) {
				return fail(400, { error: err.message });
			}

			console.error('Failed to make reservation: ', err);
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}
};
