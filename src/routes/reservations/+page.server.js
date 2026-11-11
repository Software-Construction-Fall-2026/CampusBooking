import { error, redirect } from '@sveltejs/kit';

import reservationManager from '#lib/server/reservations/ReservationManager.js';

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
