import type { Client } from 'pg';
import { attemptAsync } from 'ts-utils/check';
import { z } from 'zod';
import { Stream } from 'ts-utils/stream';

const LIMIT = 100;

export class Table<T extends Record<string, unknown> = Record<string, unknown>> {
	public static getTables(DB: Client) {
		return attemptAsync(async () => {
			const res = await DB.query(
				"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
			);

			return z
				.array(z.object({ table_name: z.string() }))
				.parse(res.rows)
				.map((r) => r.table_name);
		});
	}

	constructor(
		public readonly name: string,
		public readonly zod: z.ZodType<T>,
		public readonly database: Client
	) {}

	public query(offset: number) {
		return attemptAsync(async () => {
			const squeal = `SELECT * FROM "${this.name}" LIMIT ${LIMIT} OFFSET ${offset};`;
			const res = await this.database.query(squeal);
			return z.array(this.zod).parse(res.rows);
		});
	}

	public count() {
		return attemptAsync(async () => {
			const res = await this.database.query(`SELECT COUNT(*) FROM ${this.name};`);

			return Number(res.rows[0].count);
		});
	}

	public async all() {
		return attemptAsync(async () => {
			const stream = new Stream<T>();

			const total = (await this.count()).unwrap();

			setTimeout(async () => {
				let offset = 0;
				let length = LIMIT;

				while (length !== 0) {
					const res = (await this.query(offset)).unwrap();
					length = res.length;
					offset += LIMIT;
					for (const row of res) {
						stream.add(row);
					}
				}

				stream.end();
			});

			return { stream, total };
		});
	}

	public test() {
		return attemptAsync(async () => {
			const res = await this.database.query(`SELECT * FROM "${this.name}" LIMIT 1;`);

			const zRes = z.array(this.zod).safeParse(res.rows);

			if (zRes.success === false) {
				console.error(`Zod TypeError on ${this.name}:`, zRes.error.message);
			}

			return zRes.success;
		});
	}

	public fromId(id: string) {
		return attemptAsync(async () => {
			const res = await this.database.query(`SELECT * FROM "${this.name}" WHERE id = '${id}';`);

			if (!res.rows[0]) return null;
			return this.zod.parse(res.rows[0]);
		});
	}

	public fromProperty<K extends keyof T>(property: K, value: T[K]) {
		return attemptAsync(async () => {
			const res = await this.database.query(
				`SELECT * FROM "${this.name}" WHERE "${String(property)}" = '${value}';`
			);
			if (!res.rows[0]) return null;

			return this.zod.parse(res.rows[0]);
		});
	}
}
