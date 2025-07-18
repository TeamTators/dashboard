import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TBAWebhooks } from '$lib/server/services/tba-webhooks';
import { Redis } from '$lib/server/services/redis';
import path from 'path';
import { config } from 'dotenv';
import { z } from 'zod';
import { getSampleData } from '$lib/utils/zod-sample';

describe('TBA Webhook', async () => {
	config();

	const server = await import(
		path.resolve(process.cwd(), String(process.env.LOCAL_TBA_WEBHOOK_PATH), 'src', 'index')
	);

	const serverPromise = server.main(
		process.env.LOCAL_TBA_WEBHOOK_PORT,
		process.env.LOCAL_TBA_WEBHOOK_SECRET,
		process.env.LOCAL_TBA_WEBHOOK_REDIS_NAME
	);

	let service: ReturnType<typeof TBAWebhooks.init> | undefined;

	beforeAll(async () => {
		const res = await Redis.connect(String(process.env.REDIS_NAME));
		expect(res.isOk()).toBe(true);

		service = TBAWebhooks.init(String(process.env.LOCAL_TBA_WEBHOOK_REDIS_NAME));
	});

	it('Should initialize the tba webhook', () => {
		expect(service).toBeInstanceOf(Redis.ListeningService);
	});

	const send = (data: unknown, secret: string) => {
		if (!secret) {
			throw new Error('Secret is not defined');
		}
		const payload = JSON.stringify(data);
		const hmac = server.generateWebhookHmac(payload, secret);

		return fetch(`http://localhost:${process.env.LOCAL_TBA_WEBHOOK_PORT}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-tba-hmac': hmac
			},
			body: payload
		});
	};

	it('Should handle all message types', async () => {
		const handleMessage = async (name: keyof typeof TBAWebhooks.messageSchemas) => {
			if (!service) {
				throw new Error('Service is not initialized');
			}
			const promise = new Promise<z.infer<(typeof TBAWebhooks)['messageSchemas'][typeof name]>>(
				(res, rej) => {
					service?.on(name, (data) => {
						res(data.data);
					});
					setTimeout(() => rej(new Error(`Timeout waiting for ${name} webhook event`)), 5000);
				}
			);

			const messageData = {
				message_data: getSampleData(TBAWebhooks.messageSchemas[name]),
				message_type: name
			};

			const res = await send(messageData, String(process.env.LOCAL_TBA_WEBHOOK_SECRET));

			expect(res.status).toBe(200);

			const data = await promise;
			expect(data).toEqual(messageData.message_data);
		};

		await Promise.all(
			Object.keys(TBAWebhooks.messageSchemas).map((name) => {
				return handleMessage(name as keyof typeof TBAWebhooks.messageSchemas);
			})
		);
	});

	it('Should fail the request if the secret is invalid', async () => {
		const messageData = {
			"doesn't": 'matter',
		}
		const res = await send(messageData, 'invalid_secret');
		expect(res.status).toBe(403);
	});

	it('Should send a successful request to the webhook', async () => {
		const res = await fetch(`http://localhost:${process.env.LOCAL_TBA_WEBHOOK_PORT}`);
		expect(res.status).toBe(200);
	});

	afterAll(async () => {
		Promise.resolve(serverPromise);
	});
});
