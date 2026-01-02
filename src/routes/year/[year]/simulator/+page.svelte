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
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h4>Robot Simulator</h4>
                <button class="btn btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#configPanel" aria-expanded="false" aria-controls="configPanel">
                    <i class="material-icons">settings</i> Config
                </button>
            </div>
            
            <div class="collapse mb-3" id="configPanel">
                <div class="card card-body">
                    <div class="row">
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
                </div>
            </div>
            
            <div class="alert alert-info">
                <h6><strong>How to Control the Robot:</strong></h6>
                <div class="row">
                    <div class="col-md-6">
                        <ul class="mb-0">
                            <li><strong>Movement:</strong> Tap/click to set target position</li>
                            <li><strong>Rotation:</strong> Arrow keys ← → or second finger tap</li>
                            <li><strong>Auto-rotate:</strong> Hold Shift while moving to face direction</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <ul class="mb-0">
                            <li><strong>Field Centric:</strong> Place second finger where robot should face</li>
                            <li><strong>Smooth Motion:</strong> Trapezoidal acceleration/deceleration</li>
                            <li><strong>Visual:</strong> Yellow arrow shows robot orientation</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-3">
        <div bind:this={target}></div>
    </div>
</div>
