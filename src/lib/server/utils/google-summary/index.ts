/**
 * @fileoverview Google summary table builder and memoization helpers.
 *
 * @description
 * Provides a lightweight table abstraction for generating summary rows for an event
 * and a memoization utility for caching expensive per-team computations.
 *
 * @example
 * ```ts
 * const table = new Table('2024mike2');
 * table.column('Team', (team) => team.tba.team_number);
 * table.column('Avg Score', memoize(async (team) => computeAverage(team)));
 * const rows = await table.serialize().unwrap();
 * ```
 */
import { attemptAsync } from 'ts-utils/check';
import { Event, Team } from '../tba';
import terminal from '../terminal';

/** Supported column cell values. */
type ColType = number | string | undefined | void;

/**
 * Columnar table builder for an event summary.
 */
export class Table {
    /** Registered columns for the table. */
    public readonly columns: Column<ColType>[] = [];

    /**
     * Create a table for the specified event.
     *
     * @param eventKey - TBA event key used to load teams.
     */
    constructor(public readonly eventKey: string) {}

    /**
     * Register a new column.
     *
     * @param name - Column display name.
     * @param fn - Column value resolver for each team.
     * @returns The created column instance.
     */
    public column<T extends ColType>(name: string, fn: (team: Team) => T | Promise<T>): Column<T> {
        if (this.columns.find((c) => c.name === name))
            throw new Error(`Column ${name} already exists in table ${this.eventKey}`);
        const c = new Column<T>(this, name, this.columns.length, fn);
        this.columns.push(c);
        return c;
    }

    /**
     * Serialize the table into a 2D array of header and row values.
     *
     * @returns Result wrapper containing header and row data.
     */
    serialize() {
        // TODO: Use multi-threading instead of Promise.all
        // Note: The memoization optimizations in column functions will automatically
        // reduce redundant calls when this method processes teams in parallel
        return attemptAsync(async () => {
            const event = (await Event.getEvent(this.eventKey)).unwrap();
            const teams = (await event.getTeams()).unwrap();
            return [
                this.columns.map((c) => c.name),
                ...(await Promise.all(
                    teams.map(async (t) => {
                        return Promise.all(
                            this.columns.map(async (c) => {
                                try {
                                    const res = await c.fn(t);
                                    if (typeof res === 'number') return res.toFixed(2);
                                    if (typeof res === 'string' && !isNaN(Number(res))) return Number(res).toFixed(2);
                                    return res;
                                } catch (error) {
                                    terminal.error(
                                        'Error serializing column',
                                        JSON.stringify({ column: c.name, error })
                                    );
                                    return 'Error';
                                }
                            })
                        );
                    })
                ))
            ];
        });
    }
}

/**
 * Column definition bound to a parent table.
 */
class Column<T extends ColType> {
    /**
     * Create a column definition.
     *
     * @param table - Parent table reference.
     * @param name - Column display name.
     * @param index - Column index in the table.
     * @param fn - Column value resolver.
     */
    constructor(
        public readonly table: Table,
        public readonly name: string,
        public readonly index: number,
        public readonly fn: (team: Team) => T | Promise<T>
    ) {}
}

/**
 * Memoization utility for caching expensive function results.
 *
 * This utility enables performance optimizations by:
 * - Caching database query results (pit scouting, team scouting)
 * - Caching score calculations reused across columns
 * - Caching trace processing and analysis results
 * - Reducing redundant API calls (team status, rankings)
 *
 * The cache is maintained per function instance with key generation
 * to ensure correct cache hits while limiting memory usage.
 *
 * @param fn - Function to memoize.
 * @param keyGenerator - Optional custom key generator.
 * @returns Memoized function.
 *
 * @example
 * ```ts
 * const cached = memoize((team: Team) => team.tba.team_number);
 * cached(team);
 * ```
 */
export const memoize = <TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn => {
    const cache = new Map<string, TReturn>();

    return (...args: TArgs): TReturn => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}