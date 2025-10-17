<script lang="ts">
	import { Picklist } from "$lib/model/picklist";
	import type { TBATeam } from "$lib/utils/tba";
	import { onMount } from "svelte";
	import Grid from "../general/Grid.svelte";
	import { writable } from "svelte/store";
	import { contextmenu } from "$lib/utils/contextmenu";
	import { confirm, prompt, select } from "$lib/utils/prompts";
    import { TextEditorModule, RowDragModule } from 'ag-grid-community'; 
	import { Account } from "$lib/model/account";
    import { Stack } from "$lib/utils/stack";

    const s = new Stack('Picklist');
    Stack.use(s);

    interface Props {
        picklist: Picklist.PicklistData;
        teams: TBATeam[];
    };

    const { picklist, teams: teamList }: Props = $props();

    let teams = $state(Picklist.PicklistTeam.arr());
    let changes = $state(Picklist.PicklistChange.arr());
    let available = writable(teamList);

    onMount(() => {
        teams = Picklist.PicklistTeam.fromProperty('picklist', String(picklist.data.id), false);
        teams.sort((a, b) => Number(a.data.order) - Number(b.data.order));
        changes = Picklist.PicklistChange.fromProperty('picklist', String(picklist.data.id), false);
        const u = changes.subscribe(() => {
            teams.inform();
        });

        teams.subscribe((t) => {
            available.set(teamList.filter(team => !t.some(pt => pt.data.team === team.tba.team_number)));
        });

        return () => {
            u();
        };
    });
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <div class="col">
            <h2>{picklist.data.name}</h2>
        </div>
        <div class="col text-end">
            {#if $teams.length === 0}
                <button type="button" class="btn btn-primary" onclick={async () => {
                    const data = await prompt('Enter a newline/space separated list of team numbers to add:');
                    if (!data) return;
                    const lines = data.split(/\s+/).map(l => l.trim()).filter(l => l.length > 0);
                    let i = 0;
                    const available = teamList.map(t => t.tba.team_number);
                    for (const line of lines) {
                        const teamNum = Number(line);
                        if (isNaN(teamNum)) continue;
                        if (!available.includes(teamNum)) {
                            continue;
                        }
                        Picklist.PicklistTeam.new({
                            picklist: String(picklist.data.id),
                            team: teamNum,
                            reason: 'Added via bulk import',
                            order: i,
                            chosen: false,
                            addedBy: String(Account.getSelf().get().data.id),
                        });
                        i++;
                    }
                }}>
                    <i class="material-icons">add</i>
                    Add From List
                </button>
            {/if}
            <button type="button" class="btn btn-danger" onclick={async () => {
                if (await confirm(`Are you sure you want to delete the picklist "${picklist.data.name}"? This action cannot be undone.`, {
                    title: 'Delete Picklist',
                })) {
                    picklist.setArchive(true);
                }
            }}>
                <i class="material-icons">delete</i>
                Delete Picklist
            </button>
        </div>
    </div>
    <div class="row mb-3">
            {#key teams}
            
        <Grid 
            data={teams}
            opts={{
                rowDragMultiRow: true,
                rowSelection: {
                    mode: 'multiRow',
                },
                rowDragManaged: true,
                onRowDragEnd: (params) => {
                    const nodes = params.api.getRenderedNodes();
                    console.log(nodes.map(d => d.data?.data.order));
                    for (let i = 0; i < nodes.length; i++) {
                        const node = nodes[i];
                        node.data?.update(() => ({
                            order: i,
                        }));
                    }
                },
                columnDefs: [
                    // {
                    //     rowDrag: true,
                    //     field: 'data.order',
                    //     headerName: 'Order',
                    //     // sort: 'asc',
                    //     editable: true,
                    //     valueGetter: (params) => {
                    //         return Number(params.data?.data.order) + 1;
                    //     },
                    //     valueSetter: (params) => {
                    //         if (params.data) {
                    //             params.data.update(() => ({
                    //                 order: Math.max(0, Number(params.newValue) - 1),
                    //             }));
                    //             return true;
                    //         }
                    //         return false;
                    //     },
                    //     width: 100
                    // },
                    {
                        field: 'data.team',
                        headerName: 'Team',
                        rowDrag: true,
                    },
                    {
                        headerName: 'Name',
                        valueGetter: (params) => {
                            const team = teamList.find(t => t.tba.team_number === params.data?.data.team);
                            return team ? team.tba.nickname || 'No Name' : 'N/A';
                        },
                    },
                    {
                        field: 'data.reason',
                        headerName: 'Reason',
                        valueGetter: (params) => {
                            return params.data?.data.reason || 'N/A';
                        },
                        valueSetter: (params) => {
                            if (params.data) {
                                params.data.update(() => ({
                                    reason: params.newValue,
                                }));
                                return true;
                            }
                            return false;
                        },
                        editable: true
                    },
                    {
                        headerName: 'Up',
                        valueGetter: (params) => {
                            return $changes.filter(c => c.data.team === params.data?.data.team && c.data.direction === 'up').length;
                        },
                        width: 80
                    },
                    {
                        headerName: 'Down',
                        valueGetter: (params) => {
                            return $changes.filter(c => c.data.team === params.data?.data.team && c.data.direction === 'down').length;
                        },
                        width: 80
                    }
                ],
                onCellContextMenu: (event) => {
                    if (!event.data) return;
                    contextmenu(event.event as PointerEvent, {
                        options: [
                            'Insert',
                            {
                                name: 'Add Team Above',
                                action: async () => {
                                    const chosen = await select(`Choose a team to add above ${event.data?.data.team}`, $available, {
                                        render: (item) => `${item.tba.team_number} - ${item.tba.nickname || 'No Name'}`,
                                        title: 'Add Team',
                                    });
                                    if (!chosen) return;

                                    const why = await prompt('Why are you adding this team here?');
                                    if (!why) return;

                                    Picklist.PicklistTeam.new({
                                        picklist: String(picklist.data.id),
                                        team: chosen.tba.team_number,
                                        reason: why,
                                        order: Math.max(0, Number(event.data?.data.order)),
                                        chosen: false,
                                        addedBy: String(Account.getSelf().get().data.id),
                                    });

                                    // update all teams below
                                    const below = $teams.filter(t => Number(t.data.order) > Number(event.data?.data.order));
                                    if (event.data) below.push(event.data);
                                    for (const t of below) {
                                        t.update(() => ({
                                            order: Number(t.data.order) + 1
                                        }));
                                    }
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'arrow_upward',
                                },
                                disabled: picklist.data.frozen
                            },
                            {
                                name: 'Add Team Below',
                                action: async () => {
                                    const chosen = await select(`Choose a team to add below ${event.data?.data.team}`, $available, {
                                        render: (item) => `${item.tba.team_number} - ${item.tba.nickname || 'No Name'}`,
                                        title: 'Add Team',
                                    });
                                    if (!chosen) return;

                                    const why = await prompt('Why are you adding this team here?');
                                    if (!why) return;

                                    Picklist.PicklistTeam.new({
                                        picklist: String(picklist.data.id),
                                        team: chosen.tba.team_number,
                                        reason: why,
                                        order: Number(event.data?.data.order) + 1,
                                        chosen: false,
                            addedBy: String(Account.getSelf().get().data.id),
                                    });

                                    // update all teams below
                                    const below = $teams.filter(t => Number(t.data.order) > Number(event.data?.data.order));
                                    for (const t of below) {
                                        t.update(() => ({
                                            order: Number(t.data.order) + 1
                                        }));
                                    }
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'arrow_downward',
                                },
                                disabled: picklist.data.frozen
                            },
                            'Move',
                            {
                                name: 'Move Up',
                                action: () => {
                                    event.data?.update(() => ({
                                        order: Math.max(0, Number(event.data?.data.order) - 1)
                                    }));

                                    // move the team above down
                                    const above = $teams.find(t => Number(t.data.order) === Math.max(0, Number(event.data?.data.order) - 1));
                                    if (above) {
                                        above.update(() => ({
                                            order: Number(above.data.order) + 1
                                        }));
                                    }
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'arrow_upward',
                                },
                                disabled: (() => {
                                    const d = event.data;
                                    if (!d) return;
                                    return picklist.data.frozen || $teams.indexOf(d) === 0;
                                })(),
                            },
                            {
                                name: 'Move Down',
                                action: () => {
                                    event.data?.update(() => ({
                                        order: Number(event.data?.data.order) + 1
                                    }));

                                    // move the team below up
                                    const below = $teams.find(t => Number(t.data.order) === Number(event.data?.data.order) + 1);
                                    if (below) {
                                        below.update(() => ({
                                            order: Math.max(0, Number(below.data.order) - 1)
                                        }));
                                    }
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'arrow_downward',
                                },
                                disabled: (() => {
                                    const d = event.data;
                                    if (!d) return;
                                    return picklist.data.frozen || $teams.indexOf(d) === $teams.length - 1;
                                })(),
                            },
                            'General',
                            {
                                name: 'Remove Team',
                                action: async () => {
                                    if (await confirm(`Are you sure you want to remove team ${event.data?.data.team} from the picklist?`, {
                                        title: 'Remove Team',
                                    })) {
                                        event.data?.setArchive(true);
                                    }
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'delete',
                                },
                            },
                            {
                                name: 'View',
                                action: () => {
                                    window.open(
                                        // `https://www.thebluealliance.com/team/${event.data?.data.team}`,
                                        `/dashboard/event/${picklist.data.eventKey}/team/${event.data?.data.team}`,
                                        '_blank'
                                    );
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'visibility',
                                },
                            },
                            {
                                name: 'Make SpecTator',
                                action: async () => {
                                    const reason = await prompt(`Why are you making ${event.data?.data.team} a SpecTator?`);
                                    if (!reason) return;
                                    event.data?.delete();
                                    Picklist.SpecTator.new({
                                        eventKey: String(picklist.data.eventKey),
                                        reason,
                                        team: Number(event.data?.data.team),
                            addedBy: String(Account.getSelf().get().data.id),
                                    })
                                },
                                icon: {
                                    type: 'material-icons',
                                    name: 'delete',
                                }
                            }
                        ],
                        width: '150px',
                    });
                },
                preventDefaultOnContextMenu: true,
            }}
            height="400px"
            modules={[TextEditorModule, RowDragModule]}
            rowNumbers={true}
        />
        {/key}
    </div>
</div>