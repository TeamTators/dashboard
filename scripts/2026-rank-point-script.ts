import { Event, Team } from '../src/lib/server/utils/tba';
import '../src/lib/server/structs/TBA';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';

export default async (eventKey: string, year: string) => {
    await Struct.buildAll(DB).unwrap();
    const event = await Event.getEvent(eventKey).unwrap();
    const targetYear = parseInt(year, 10);

    const teams = await event.getTeams().unwrap();
    //console.log(teams[0]);
    //console.log(teams[0].event.tba);

    const rankPointAvg = async (team: Team) => {
        const events = await Event.getTeamEvents(targetYear, team.tba.team_number).unwrap();
        
        const result = [];
        for (const e of events) {
            team.event = e;
            const t = await team.getStatus().unwrap();
            if (!t?.qual?.ranking.sort_orders) return;
            result.push(t?.qual?.ranking.sort_orders[0]);
        }

        const avg = result.reduce((sum, v) => sum + v, 0) / result.length;
        return [team.tba.team_number, avg.toFixed(3)];
        // identify rank points they got the most, sorted
    };

    const rankPointCount = async (team: Team) => {
        const events = await Event.getTeamEvents(targetYear, team.tba.team_number).unwrap();
    };

    const results = await Promise.all(teams.map(rankPointAvg));
    console.log("Rank Point Average:", results);
};