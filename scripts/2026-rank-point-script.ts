import { Event, Team } from '../src/lib/server/utils/tba';
import '../src/lib/server/structs/TBA';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';

export default async (eventKey: string, year: string) => {
    await Struct.buildAll(DB).unwrap();
    const event = await Event.getEvent(eventKey).unwrap();
    const targetYear = parseInt(year, 10);

    const teams = await event.getTeams().unwrap();

    const myFn = async (team: Team) => {
        // get all events from the year "year"
        // identify rank point average
        // identify rank points they got the most, sorted
    };

    const results = await Promise.all(teams.map(myFn));
    console.log(results);
};