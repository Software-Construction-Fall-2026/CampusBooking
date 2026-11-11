import { error, redirect, fail } from '@sveltejs/kit';

import reservationManager, {
	ReservationError
} from '#lib/server/reservations/ReservationManager.js';

export const actions = {
	// handles cancellation request from the frontend for a given user and reservation id
	cancel: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(303, '/auth/login');
		}

		const form = await request.formData();
		const reservationId = form.get('reservationId');

		try {
			await reservationManager.cancelReservation(locals.user, reservationId);
			return { cancelled: reservationId };
		} catch (err) {
			if (err instanceof ReservationError) {
				return fail(400, { error: err.message, reservationId });
			}
			console.error('Failed to cancel reservation: ', err);
			return fail(500, { error: 'Something went wrong, please try again.' });
		}
	}
};

// Shows all the reservations of the logged in student or faculty member
export async function load({ locals }) {
	if (!locals.user) {
		redirect(303, '/auth/login');
	}

	if (!reservationManager.canReserve(locals.user)) {
		error(403, 'Only students and faculty members can view reservations.');
	}

	// C13: Return my reservations
	const { upcoming, past } = await reservationManager.getMyReservations(
		locals.user
	);

	return { upcoming, past };
}
