import { Event, Team } from '../src/lib/server/utils/tba';
import '../src/lib/server/structs/TBA';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';
import { Match2025Schema } from "tatorscout/tba";

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
            const newTeam = new Team(team.tba, e);
            const t = await newTeam.getStatus().unwrap();
            if (!t?.qual?.ranking.sort_orders) return;
            result.push(t?.qual?.ranking.sort_orders[0]);
        }

        const avg = result.reduce((sum, v) => sum + v, 0) / result.length;
        return [team.tba.team_number, avg.toFixed(3)];
        // identify rank points they got the most, sorted
    };

    const rankPointCount = async (team: Team) => {
        const events = await Event.getTeamEvents(targetYear, team.tba.team_number).unwrap();
        
        let rp1 = 0;
        let rp2 = 0;
        let rp3 = 0;
        let rp1t = 0;
        let rp2t = 0;
        let rp3t = 0;
        let matchest = 0;
        let eventExist = true;
        let alliance: 'blue' | 'red' | null = null;

        type RPResult = [
            eventName: string,
            "autoBonus", number,
            "coralBonus", number,
            "bargeBonus", number,
            "totalMatches", number
        ];
        const result: RPResult[] = [];

        for (let j=0; j<events.length; j++) {
            const newTeam = new Team(team.tba, events[j]);
            const m = await newTeam.getMatches().unwrap();
            
            for (let i=0; i<m.length; i++) {
                const res = m[i].asYear(2025); //2025 is supposed to be targetYear but asYear doesn't support other years yet
                if (!res.isOk()) {eventExist = false; continue;}
                const matches = res.value;
                if (!matches.score_breakdown) continue;
                if (matches.alliances.blue.team_keys.includes(team.tba.key)) {alliance = 'blue';} 
                    else if (matches.alliances.red.team_keys.includes(team.tba.key)) {alliance = 'red';} 
                    else {console.log("No alliance found");}
                if (!alliance) continue;
                if (matches.score_breakdown[alliance].autoBonusAchieved) {rp1++; rp1t++;}
                if (matches.score_breakdown[alliance].coralBonusAchieved) {rp2++; rp2t++;}
                if (matches.score_breakdown[alliance].bargeBonusAchieved) {rp3++; rp3t++;}
                alliance = null;
            }
            if (!eventExist) {eventExist = true; continue;}
            result.push([events[j].tba.name, "autoBonus", rp1, "coralBonus", rp2, "bargeBonus", rp3, "totalMatches", m.length]);
            matchest += m.length;
            rp1 = 0;
            rp2 = 0;
            rp3 = 0;    
        }
        return ["Team Number: " + String(team.tba.team_number) + " " + team.tba.nickname, "total", ["autoBonus", rp1t, "coralBonus", rp2t, "bargeBonus", rp3t, "totalMatches", matchest],result];
    };

    const results = await Promise.all(teams.map(rankPointAvg));
    const rankedResults = await Promise.all(teams.map(rankPointCount));
    //console.log("Rank Point Average:", results);
    console.log("Rank Point Count:", rankedResults);
};