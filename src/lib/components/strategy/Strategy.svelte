<script lang="ts">
    import { Strategy } from '$lib/model/strategy';
	import type { TBAEvent } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import Select from '../forms/Select.svelte';
    import Whiteboard from './Whiteboard.svelte';

    interface Props {
        strategy: Strategy.StrategyExtended;
        event: TBAEvent;
    }

    const { strategy, event }: Props = $props();

    const notes = $derived(strategy.notes);
    const name = $derived(strategy.name);

    const startingPositions: {
        [year: number]: string[];
    } = {
        2025: [
            'Left',
            'Center',
            'Right',
            'Other',
        ],
        2026: [
            'Left',
            'Center',
            'Right',
        ],
    }

    const roles: {
        [year: number]: string[];
    } = {
        2025: [
            'Coral',
            'Algae',
            'Other (specify in notes)',
        ],
        2026: [
            'Finisher',
            'Lobber',
            'Outpost',
            'Dumper',
            'Other (specify in notes)',
        ],
    }
    let render = $state(0);
    onMount(() => {
        return strategy.subscribe(() => render++);
    });
</script>

{#snippet partner(partner: Strategy.PartnerData, color: 'red' | 'blue')}
    <div class="card">
        <div class="card-body layer-3" style="height: 650px; overflow-y: auto;">
            <h5 class="card-title mb-3">
                {partner.data.number}
            </h5>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Starting Position</label>
                <Select 
                    options={startingPositions[event.tba.year]}
                    onChange={(i) => {
                        partner.update((data) => ({
                        ...data,
                        startingPosition: startingPositions[event.tba.year][i] || (i === -1 ? 'other' : undefined),
                    }))}}
                    value={partner.data.startingPosition}
                />
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Primary Role</label>
                <Select 
                    options={roles[event.tba.year]}
                    onChange={(i) => partner.update((data) => ({
                        ...data,
                        role: roles[event.tba.year][i] || (i === -1 ? 'other' : undefined),
                    }))}
                    value={partner.data.role}
                />
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Notes</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="Notes about this partner"
                    value={partner.data.notes}
                    onchange={(e) => partner.update((data) => ({
                        ...data,
                        notes: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Auto</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this partner does in auto"
                    value={partner.data.auto}
                    onchange={(e) => partner.update((data) => ({
                        ...data,
                        auto: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Post Auto / Teleop</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this partner does after auto"
                    value={partner.data.postAuto}
                    onchange={(e) => partner.update((data) => ({
                        ...data,
                        postAuto: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Endgame</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this partner does in endgame"
                    value={partner.data.endgame}
                    onchange={(e) => partner.update((data) => ({
                        ...data,
                        endgame: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
        </div>
    </div>
{/snippet}

{#snippet opponent(opponent: Strategy.OpponentData, color: 'red' | 'blue')}
    <div class="card">
        <div class="card-body layer-3" style="height: 650px; overflow-y: auto;">
            <h5 class="card-title mb-3">
                {opponent.data.number}
            </h5>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Role</label>
                <Select 
                    options={['Primary', 'Secondary', 'Tertiary']}
                    onChange={(i) => opponent.update((data) => ({
                        ...data,
                        role: i === -1 ? 'other' : ['primary', 'secondary', 'tertiary'][i],
                    }))}
                    value={opponent.data.role}
                />
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Notes</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="Notes about this opponent"
                    value={opponent.data.notes}
                    onchange={(e) => opponent.update((data) => ({
                        ...data,
                        notes: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Auto</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this opponent does in auto"
                    value={opponent.data.auto}
                    onchange={(e) => opponent.update((data) => ({
                        ...data,
                        auto: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Post Auto / Teleop</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this opponent does after auto"
                    value={opponent.data.postAuto}
                    onchange={(e) => opponent.update((data) => ({
                        ...data,
                        postAuto: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
            <div class="mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="form-label">Endgame</label>
                <textarea 
                    class="form-control mb-2" 
                    rows={3} 
                    placeholder="What this opponent does in endgame"
                    value={opponent.data.endgame}
                    onchange={(e) => opponent.update((data) => ({
                        ...data,
                        endgame: e.currentTarget.value,
                    }))}
                ></textarea>
            </div>
        </div>
    </div>
{/snippet}

{#key render}
<div class="container-fluid layer-1">
    <div class="row mb-3">
        <div class="container">
            <div class="row mb-3">
                <div class="col-12 mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="form-label">Strategy Name</label>
                    <input type="text" class="form-control mb-2" value={$name} onchange={(e) => {
                        strategy.data.strategy.update((s) => ({
                            ...s,
                            name: e.currentTarget.value,
                        }));
                    }} />
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12 mb-3">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="form-label">Notes</label>
                    <textarea class="form-control mb-2" rows={4} placeholder="Notes" value={$notes} onchange={(e) => {
                        strategy.data.strategy.update((s) => ({
                            ...s,
                            notes: e.currentTarget.value,
                        }));
                    }}></textarea>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6 col-sm-12 mb-3">
                    <h5>Partners</h5>
                    {@render partner($strategy.partner1, 'red')}
                    {@render partner($strategy.partner2, 'red')}
                    {@render partner($strategy.partner3, 'red')}
                </div>
                <div class="col-md-6 col-sm-12 mb-3">
                    <h5>Opponents</h5>
                    {@render opponent($strategy.opponent1, 'blue')}
                    {@render opponent($strategy.opponent2, 'blue')}
                    {@render opponent($strategy.opponent3, 'blue')}
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-3">
        <Whiteboard board={strategy.board} />
    </div>
</div>
{/key}