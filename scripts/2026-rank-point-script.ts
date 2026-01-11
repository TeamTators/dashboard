import { Event, Team } from '../src/lib/server/utils/tba';
import '../src/lib/server/structs/TBA';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';
import { Match2025Schema } from "tatorscout/tba";

export default async (eventKey: string, year: string) => {
    await Struct.buildAll(DB).unwrap();
    const event = await Event.getEvent(eventKey).unwrap();
    const targetYear = parseInt(year, 10) as 2024 | 2025;

    const teams = await event.getTeams().unwrap();

    const rankPointCount = async (team: Team) => {
        const events = await Event.getTeamEvents(targetYear, team.tba.team_number).unwrap();
        let rp1 = 0;
        let rp2 = 0;
        let rp3 = 0;
        let totalmatches = 0;
        const avgrank = [];
        let eventExist = true;
        let alliance: 'blue' | 'red' | null = null;
        let rankPoints: string[] = [];

        for (const e of events) {
            const newTeam = new Team(team.tba, e);
            const t = await newTeam.getStatus().unwrap();
            if (!t?.qual?.ranking.sort_orders) return;
            avgrank.push(t?.qual?.ranking.sort_orders[0]);

            const allmatches = await newTeam.getMatches().unwrap();
            
            for (const m of allmatches) {
                const res = m.asYear(targetYear); 
                if (!res.isOk()) {eventExist = false; continue;}
                const match = res.value;
                if (!match.score_breakdown) continue;

                if (match.alliances.blue.team_keys.includes(team.tba.key)) {alliance = 'blue';} 
                    else if (match.alliances.red.team_keys.includes(team.tba.key)) {alliance = 'red';} 
                    else {console.log("No alliance found");}
                if (!alliance) continue;
                
                rankPoints = Object.keys(match.score_breakdown[alliance]).filter(key => key.endsWith('BonusAchieved'));
                console.log("Bonus Keys:", rankPoints);
                try {
                    if (match.score_breakdown[alliance][rankPoints[0]]) rp1++;
                    if (match.score_breakdown[alliance][rankPoints[1]]) rp2++;
                    if (match.score_breakdown[alliance][rankPoints[2]]) rp3++;
                } catch (error) {
                    console.log(error);
                }
                
                alliance = null;
            }
            if (!eventExist) {eventExist = true; continue;}
            totalmatches += allmatches.length;
        }
        const avg = avgrank.reduce((sum, v) => sum + v, 0) / avgrank.length;
        return ["Team Number: " + String(team.tba.team_number) + " " + team.tba.nickname, "avg", avg.toFixed(3), "detailed", [rankPoints[0], rp1, rankPoints[1], rp2, rankPoints[2], rp3, "totalMatches", totalmatches]];
    };

    const rankedResults = await Promise.all(teams.map(rankPointCount));
    console.log("Rank Point Count:", rankedResults);
};