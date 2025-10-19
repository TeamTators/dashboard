import { expect, test } from '@playwright/test';

test('TheBlueAlliance', async ({ page }) => {
	await page.goto('/test/tba');
	page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
	page.on('pageerror', (err) => console.error('PAGE ERROR:', err));
	page.on('requestfailed', (request) => {
		console.error('Request failed:', request.url(), request.failure());
	});
	const complete = await page.locator('#complete').elementHandle();
	if (!complete) {
		throw new Error('No test list found');
	}

	const input = await page.locator('#event-key-input').elementHandle();
	if (!input) {
		throw new Error('No input found');
	}

	const button = await page.locator('#get-data').elementHandle();

	if (!button) {
		throw new Error('Button not found');
	}

	const status = await page.locator('#status').elementHandle();
	if (!status) {
		throw new Error('Status not found');
	}

	await input.fill('2024idbo');
	await button.click();

	await complete.waitForElementState('visible');
	const completeText = await complete.innerText();
	expect(completeText).toBe('Test Complete!');

	const statusText = await status.innerText();
	expect(statusText).toBe('Success');
});
