import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TBAWebhooks } from '$lib/server/services/tba-webhooks';
import path from 'path';
import { z } from 'zod';
import { getSampleData } from '$lib/utils/zod-sample';
import redis from '$lib/server/services/redis';
import { config, str } from '$lib/server/utils/env';
import { sleep } from 'ts-utils/sleep';

describe('TBA Webhook', async () => {
	const server = await import(path.resolve(process.cwd(), config.tba_webhook.path, 'src', 'index'));

	const serverPromise = server.main(
		config.tba_webhook.port,
		str('TBA_WEBHOOK_SECRET', true),
		config.tba_webhook.redis_name
	);

	let service: ReturnType<typeof TBAWebhooks.init> | undefined;

	beforeAll(async () => {
		const res = await redis.init();
		expect(res.isOk()).toBe(true);
		await sleep(1000); // Wait for the server to start

		service = TBAWebhooks.init(config.tba_webhook.redis_name);
	});

	const send = (data: unknown, secret: string) => {
		if (!secret) {
			throw new Error('Secret is not defined');
		}
		const payload = JSON.stringify(data);
		const hmac = server.generateWebhookHmac(payload, secret);

		return fetch(`http://localhost:${config.tba_webhook.port}`, {
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

			const res = await send(messageData, str('TBA_WEBHOOK_SECRET', true));

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
		const res = await fetch(`http://localhost:${config.tba_webhook.port}`);
		expect(res.status).toBe(200);
	});

	afterAll(async () => {
		Promise.resolve(serverPromise);
	});
});
