import { expect, test } from '@playwright/test';
import { TOMORROW, open, signUp, slot } from './helpers.js';

// View times and create reservation without double booking
test('System Test 3: books a slot and blocks double booking', async ({
	browser
}) => {
	const alice = await browser.newPage();
	const bob = await browser.newPage();
	await signUp(alice, 'Alice Student');
	await signUp(bob, 'Bob Student');

	// Both students open the same free slot
	const url = `/resources/room-101/reserve?date=${TOMORROW}`;
	await open(alice, url);
	await open(bob, url);
	await slot(alice, '10:00 AM').click();
	await slot(bob, '10:00 AM').click();

	// The student alice books the slot first
	await alice.getByRole('button', { name: 'Confirm reservation' }).click();
	await expect(alice.getByText('Reservation confirmed')).toBeVisible();

	// The students Bob gets their booking rejected
	await bob.getByRole('button', { name: 'Confirm reservation' }).click();
	await expect(
		bob.getByText('This time slot has already been booked.')
	).toBeVisible();
	await bob.reload();
	await expect(slot(bob, '10:00 AM')).toBeDisabled();
	await expect(slot(bob, '10:00 AM')).toContainText('Booked');

	// Alice receives a confirmation notification
	await open(alice, '/notifications');
	await expect(
		alice.getByText(/Room 101 .* has been confirmed\./)
	).toBeVisible();
});
