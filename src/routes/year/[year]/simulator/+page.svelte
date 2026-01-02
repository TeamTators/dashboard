<script lang="ts">
	import { page } from "$app/state";
    import { Simulator } from "$lib/services/simulator";
	import { onMount } from "svelte";

    const app = new Simulator({
        maxVelocity: 17,
        acceleration: 10,
        year: Number(page.params.year),
        width: (120 / 4) / 12,
        height: (120 / 4) / 12,
        spinSpeed: 720,
        spinAcceleration: 1440,
        rotationSensitivity: 4,
        deceleration: 20
    })

    let target: HTMLDivElement;

    onMount(() => {
        app.init(target);

        return app.start();
    });
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <div class="col-lg-6 col-md-12">
            <label for="max-velocity" class="form-label">Max Velocity ({$app.maxVelocity} ft/s)</label>
            <input type="range" class="form-range" id="max-velocity" min="5" max="20" step="1" oninput={(e) => app.setConfig({ maxVelocity: Number(e.currentTarget.value) })} />
        </div>
        <div class="col-lg-6 col-md-12">
            <label for="acceleration" class="form-label">Acceleration ({$app.acceleration} ft/s²)</label>
            <input type="range" class="form-range" id="acceleration" min="5" max="15" step="1" oninput={(e) => app.setConfig({ acceleration: Number(e.currentTarget.value) })} />
        </div>
        <div class="col-lg-6 col-md-12">
            <label for="max-spin-speed" class="form-label">Max Spin Speed ({$app.spinSpeed} deg/s)</label>
            <input type="range" class="form-range" id="max-spin-speed" min="90" max="720" step="1" oninput={(e) => app.setConfig({ spinSpeed: Number(e.currentTarget.value) })} />
        </div>
        <div class="col-lg-6 col-md-12">
            <label for="spin-acceleration" class="form-label">Spin Acceleration ({$app.spinAcceleration} deg/s²)</label>
            <input type="range" class="form-range" id="spin-acceleration" min="1000" max="2000" step="1" oninput={(e) => app.setConfig({ spinAcceleration: Number(e.currentTarget.value) })} />
        </div>
    </div>
    <div class="row mb-3">
        <div bind:this={target}></div>
    </div>
</div>
