import { expect, test } from '@playwright/test';
import { logIn, ADMIN, ADMIN_RESOURCE, open } from './helpers.js';

// Administrator
test('System Test 5: Manage Resources and Reservations as Administrator', async ({
	browser
}) => {
	const admin = await browser.newPage();
	await logIn(admin, ADMIN.email, 'Admin');
	await expect(admin).toHaveURL('/');

	// Go to the administrator page and create a resource
	await open(admin, '/administrator');
	await admin.getByLabel('Resource Name *').fill(ADMIN_RESOURCE.name);
	await admin.getByLabel('Resource Type *').fill(ADMIN_RESOURCE.type);
	await admin.getByLabel('Building *').fill(ADMIN_RESOURCE.building);
	await admin.getByLabel('Room').fill(ADMIN_RESOURCE.room);
	await admin.getByLabel('Capacity').fill(ADMIN_RESOURCE.capacity);
	await admin
		.getByLabel('Availability')
		.selectOption(ADMIN_RESOURCE.availability);
	await admin.getByLabel('Description').fill(ADMIN_RESOURCE.description);

	await admin.getByRole('button', { name: /Add Resource/i }).click();
	await expect(admin.getByText('Resource added successfully!')).toBeVisible();
});
