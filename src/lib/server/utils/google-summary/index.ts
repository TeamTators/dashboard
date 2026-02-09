import { attemptAsync } from 'ts-utils/check';
import { Event, Team } from '../tba';
import terminal from '../terminal';

type ColType = number | string | undefined | void;

export class Table {
    public readonly columns: Column<ColType>[] = [];

    constructor(public readonly eventKey: string) {}

    public column<T extends ColType>(name: string, fn: (team: Team) => T | Promise<T>): Column<T> {
        if (this.columns.find((c) => c.name === name))
            throw new Error(`Column ${name} already exists in table ${this.eventKey}`);
        const c = new Column<T>(this, name, this.columns.length, fn);
        this.columns.push(c);
        return c;
    }

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

class Column<T extends ColType> {
    constructor(
        public readonly table: Table,
        public readonly name: string,
        public readonly index: number,
        public readonly fn: (team: Team) => T | Promise<T>
    ) {}
}
