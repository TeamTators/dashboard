import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TBAWebhooks } from '$lib/server/services/tba-webhooks';
import path from 'path';
import { config } from 'dotenv';
import { z } from 'zod';
import { getSampleData } from '$lib/utils/zod-sample';
import redis from '$lib/server/services/redis';
import { str, num } from '$lib/server/utils/env';

describe('TBA Webhook', async () => {
	config();
	const LOCAL_TBA_WEBHOOK_PATH = str('LOCAL_TBA_WEBHOOK_PATH', false);

	const server = await import(
		path.resolve(
			process.cwd(),
			LOCAL_TBA_WEBHOOK_PATH || '../tba-webhooks',
			'src',
			'index'
		)
	);

	const LOCAL_TBA_WEBHOOK_PORT = num('LOCAL_TBA_WEBHOOK_PORT', true);
	const LOCAL_TBA_WEBHOOK_SECRET = str('LOCAL_TBA_WEBHOOK_SECRET', true);
	const LOCAL_TBA_WEBHOOK_REDIS_NAME = str('LOCAL_TBA_WEBHOOK_REDIS_NAME', true);

	const serverPromise = server.main(
		LOCAL_TBA_WEBHOOK_PORT,
		LOCAL_TBA_WEBHOOK_SECRET,
		LOCAL_TBA_WEBHOOK_REDIS_NAME
	);

	let service: ReturnType<typeof TBAWebhooks.init> | undefined;

	beforeAll(async () => {
		const res = await redis.init();
		expect(res.isOk()).toBe(true);

		service = TBAWebhooks.init(str('LOCAL_TBA_WEBHOOK_REDIS_NAME', true));
	});

	const send = (data: unknown, secret: string) => {
		if (!secret) {
			throw new Error('Secret is not defined');
		}
		const payload = JSON.stringify(data);
		const hmac = server.generateWebhookHmac(payload, secret);

		return fetch(`http://localhost:${LOCAL_TBA_WEBHOOK_PORT}`, {
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
			const s = service;
			const promise = new Promise<z.infer<(typeof TBAWebhooks)['messageSchemas'][typeof name]>>(
				(res, rej) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					s.on(name, (data: any) => {
						res(data.data);
					});
					setTimeout(() => rej(new Error(`Timeout waiting for ${name} webhook event`)), 5000);
				}
			);

			const messageData = {
				message_data: getSampleData(TBAWebhooks.messageSchemas[name]),
				message_type: name
			};

			const res = await send(messageData, str('LOCAL_TBA_WEBHOOK_SECRET', true));

			expect(res.status).toBe(200);

			const data = await promise;
			expect(data).toEqual(messageData.message_data);
		};

		await Promise.all(
			Object.keys(TBAWebhooks.messageSchemas).map((name) => {
				return handleMessage(name as keyof typeof TBAWebhooks.messageSchemas);
			})
		);
	}, 30000);

	it('Should fail the request if the secret is invalid', async () => {
		const messageData = {
			"doesn't": 'matter'
		};
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
