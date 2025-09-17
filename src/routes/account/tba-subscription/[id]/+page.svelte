<script lang="ts">
	import { Subscription } from '$lib/model/subscription.js';

    const { data } = $props();

    const subscription = $derived(Subscription.WebhookSubscription.Generator(data.subscription));
</script>


<div class="container">
    <div class="row mb-3">
        <div class="col">
            <h2>Subscription Details</h2>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <p><strong>Type:</strong> {$subscription.type}</p>
            <p><strong>Arguments:</strong> {$subscription.args}</p>
            <p><strong>Created At:</strong> {$subscription.created?.toLocaleString() || 'Invalid Date'}</p>
            <p><strong>Updated At:</strong> {$subscription.updated?.toLocaleString() || 'Invalid Date'}</p>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <a href="?/unsubscribe" class="btn btn-secondary">Unsubscribe</a>
        </div>
    </div>
</div>