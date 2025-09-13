import { sql } from "drizzle-orm";
import { DB } from "../src/lib/server/db";

export default async () => {
    const result = await DB.execute(sql`
        DELETE FROM session;
    `);
};