<script lang="ts">
	import { page } from '$app/state';
	import { SimulatorController } from '$lib/services/simulator/controller';
	import { Simulator, type RobotConfig } from '$lib/services/simulator/new-sim.ts';
	import { onMount } from 'svelte';

	let target: HTMLDivElement;
	let robotConfig: RobotConfig = $state({
			maxVelocity: 17,
			maxAngularVelocity: 360,
			acceleration: 10,
			angularAcceleration: 1080, 
			deceleration: 10,
			angularDeceleration: 1080, 
			width: (120 / 4) / 12,
			length: (120 / 4) / 12,
		});

	let sim: Simulator | undefined = $state(undefined);
    let controller: SimulatorController | undefined = $state(undefined);

    const stop = () => {
        sim?.stop();
        controller?.init(target);
    }

	onMount(() => {
		sim = new Simulator(Number(page.params.year), target, robotConfig);
		sim.init();
		sim.robot.subscribe(config => robotConfig = config);
        controller = new SimulatorController(sim, {
            states: [],
            state: 'tracing',
        });
		return sim.start(true);
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-2">
				<h4>Robot Simulator</h4>
				<button
					class="btn btn-outline-secondary"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#configPanel"
					aria-expanded="false"
					aria-controls="configPanel"
				>
					<i class="material-icons">settings</i> Config
				</button>
                <button type="button" class="btn btn-primary" onclick={stop}>
                    Controller
                </button>
			</div>

			<div class="collapse mb-3" id="configPanel">
				<div class="card card-body">
					<div class="row">
						<div class="col-lg-6 col-md-12">
							<label for="max-velocity" class="form-label"
								>Max Velocity ({robotConfig.maxVelocity} ft/s)</label
							>
							<input
								type="range"
								class="form-range"
								id="max-velocity"
								min="5"
								max="20"
								step="1"
								oninput={(e) => sim?.setConfig({ maxVelocity: Number(e.currentTarget.value) })}
							/>
						</div>
						<div class="col-lg-6 col-md-12">
							<label for="acceleration" class="form-label"
								>Acceleration ({robotConfig.acceleration} ft/s²)</label
							>
							<input
								type="range"
								class="form-range"
								id="acceleration"
								min="5"
								max="15"
								step="1"
								oninput={(e) => sim?.setConfig({ acceleration: Number(e.currentTarget.value) })}
							/>
						</div>
						<div class="col-lg-6 col-md-12">
							<label for="max-spin-speed" class="form-label"
								>Max Spin Speed ({robotConfig.maxAngularVelocity} deg/s)</label
							>
							<input
								type="range"
								class="form-range"
								id="max-spin-speed"
								min="90"
								max="720"
								step="1"
								oninput={(e) => sim?.setConfig({ maxAngularVelocity: Number(e.currentTarget.value) })}
							/>
						</div>
						<div class="col-lg-6 col-md-12">
							<label for="spin-acceleration" class="form-label"
								>Spin Acceleration ({robotConfig.angularAcceleration} deg/s²)</label
							>
							<input
								type="range"
								class="form-range"
								id="spin-acceleration"
								min="1000"
								max="2000"
								step="1"
								oninput={(e) => sim?.setConfig({ angularAcceleration: Number(e.currentTarget.value) })}
							/>
						</div>
						<div class="col-lg-6 col-md-12">
							<label for="robot-width" class="form-label"
								>Robot Width ({(robotConfig.width * 12).toFixed(1)} in)</label
							>
							<input
								type="range"
								class="form-range"
								id="robot-width"
								min="26"
								max="34"
								step="0.1"
								oninput={(e) => sim?.setConfig({ width: Number(e.currentTarget.value) / 12 })}
							/>
						</div>
						<div class="col-lg-6 col-md-12">
							<label for="robot-length" class="form-label"
								>Robot Length ({(robotConfig.length * 12).toFixed(1)} in)</label
							>
							<input
								type="range"
								class="form-range"
								id="robot-length"
								min="26"
								max="34"
								step="0.1"
								oninput={(e) => sim?.setConfig({ length: Number(e.currentTarget.value) / 12 })}
							/>
						</div>
						<div class="col-12">
							<small class="text-muted"
								>Adjust the robot parameters to see how they affect movement and control.</small
							>
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
		<!-- <button type="button" class="btn btn-primary position-absolute" onclick={() => {
			app?.faceTarget.set(!app?.faceTarget);
		}}>Face Target</button> -->
	</div>
</div>
