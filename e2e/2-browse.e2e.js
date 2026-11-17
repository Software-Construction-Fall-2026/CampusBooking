import { expect, test } from '@playwright/test';
import { open } from './helpers.js';

// Browse and filter resources
test.describe('System Test 2: Browse and filter resources', () => {
	const card = (page, name) => page.getByRole('heading', { name });
	test.beforeEach(async ({ page }) => {
		await open(page, '/resources');
	});

	test('shows only the chosen category', async ({ page }) => {
		await page.getByRole('button', { name: 'Classroom' }).click();

		await expect(card(page, 'Room 101')).toBeVisible();
		await expect(card(page, 'Room 202')).toBeVisible();
		await expect(card(page, 'Projector')).toBeHidden();
	});

	test('filters by name and building, or shows no matches', async ({
		page
	}) => {
		const search = page.getByPlaceholder('Search resources...');

		await search.fill('room 101');
		await expect(card(page, 'Room 101')).toBeVisible();
		await expect(card(page, 'Room 202')).toBeHidden();

		await search.fill('');
		await page.getByLabel('Filter by Building:').selectOption('Library');
		await expect(card(page, 'Room 202')).toBeVisible();
		await expect(card(page, 'Projector')).toBeVisible();
		await expect(card(page, 'Room 101')).toBeHidden();

		await search.fill('does not exist');
		await expect(page.getByText('No resources found.')).toBeVisible();
	});
});
