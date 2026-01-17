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
        // let rp1 = 0;
        // let rp2 = 0;
        // let rp3 = 0;
        // let totalmatches = 0;
        let climbData = 0;
        let eventExist = true;
        let alliance: 'blue' | 'red' | null = null;

        const [firstEvent] = events;
        if (!firstEvent) {
            return {
                team: team.tba.team_number,
                name: team.tba.nickname,
                data: {
                    // autoBonus: rp1,
                    // coralBonus: rp2,
                    // bargeBonus: rp3,
                    // totalmatches,
                    climb: climbData,
                }
            }
        }

        
        const newTeam = new Team(team.tba, firstEvent);
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

            const teamPos = matches.alliances[alliance].team_keys.indexOf(team.tba.key);

            console.log(matches.score_breakdown[alliance]);

            if (teamPos === 0) {
                climbData += ['DeepCage', 'ShallowCage'].includes(matches.score_breakdown[alliance].endGameRobot1) ? 1 : 0;
            } else if (teamPos === 1) {
                climbData += ['DeepCage', 'ShallowCage'].includes(matches.score_breakdown[alliance].endGameRobot2) ? 1 : 0;
            } else if (teamPos === 2) {
                climbData += ['DeepCage', 'ShallowCage'].includes(matches.score_breakdown[alliance].endGameRobot3) ? 1 : 0;
            }

            // if (matches.score_breakdown[alliance].autoBonusAchieved) rp1++;
            // if (matches.score_breakdown[alliance].coralBonusAchieved) rp2++;
            // if (matches.score_breakdown[alliance].bargeBonusAchieved) rp3++;
            alliance = null;
        }

        // for (let j=0; j<events.length; j++) {
        //     const newTeam = new Team(team.tba, events[j]);
        //     const m = await newTeam.getMatches().unwrap();
            
        //     for (let i=0; i<m.length; i++) {
        //         const res = m[i].asYear(2025); //2025 is supposed to be targetYear but asYear doesn't support other years yet
        //         if (!res.isOk()) {eventExist = false; continue;}
        //         const matches = res.value;
        //         if (!matches.score_breakdown) continue;

        //         if (matches.alliances.blue.team_keys.includes(team.tba.key)) {alliance = 'blue';} 
        //             else if (matches.alliances.red.team_keys.includes(team.tba.key)) {alliance = 'red';} 
        //             else {console.log("No alliance found");}
        //         if (!alliance) continue;

        //         if (matches.score_breakdown[alliance].autoBonusAchieved) rp1++;
        //         if (matches.score_breakdown[alliance].coralBonusAchieved) rp2++;
        //         if (matches.score_breakdown[alliance].bargeBonusAchieved) rp3++;
        //         alliance = null;
        //     }
        //     if (!eventExist) {eventExist = true; continue;}
        //     totalmatches += m.length;
        // }
        // return ["Team Number: " + String(team.tba.team_number) + " " + team.tba.nickname, "total", ["autoBonus", rp1, "coralBonus", rp2, "bargeBonus", rp3, "totalMatches", totalmatches]];
        return {
            team: team.tba.team_number,
            name: team.tba.nickname,
            data: {
                climb: climbData,
                // autoBonus: rp1,
                // coralBonus: rp2,
                // bargeBonus: rp3,
                // totalmatches,
            }
        }
    };

    const results = await Promise.all(teams.map(rankPointAvg));
    const rankedResults = await Promise.all(teams.map(rankPointCount));
    console.log("Rank Point Average:", results);
    console.log("Rank Point Count:", rankedResults.sort((a, b) => a.data.climb - b.data.climb));
};