<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.min.css';
	import '$lib/styles/flatpickr.css';
	import type { FormEventHandler } from 'svelte/elements';

	interface Props {
		value?: string | null;
		id: string | null;
		placeholder: string;
		oninput?: FormEventHandler<HTMLInputElement>;
	}

	let { value = $bindable(), id, placeholder, oninput }: Props = $props();

	let dateFormat = $state('Y-m-d');

	let inputEl: HTMLInputElement;
	let picker: flatpickr.Instance;

	let initialValue: string | null = null;
	let cancel = false;

	function updateValue() {
		const selectedDate = picker.selectedDates[0];
		// console.log('Selected date:', selectedDate);
		value = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
		// console.log('Updated value:', value);
	}

	onMount(() => {
		if (!browser) return;

		initialValue = value ?? null;

		picker = flatpickr(inputEl, {
			// enableTime,
			dateFormat,
			defaultDate: value || undefined,
			// onReady: () => {
			// 	inputEl.focus();
			// },
			onClose: () => {
				if (!cancel) updateValue();
			}
		});

		picker.calendarContainer.classList.add('flatpickr-custom-theme');

		inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				cancel = true;
				value = initialValue;
				picker.close();
			}
			if (e.key === 'Enter') {
				cancel = false;
				picker.close();
			}
		});
	});

	onDestroy(() => {
		if (!browser) return;
		picker?.destroy();
	});
</script>

<input
	bind:this={inputEl}
	bind:value
	type="date"
	class="form-control"
	style="width: 100%;"
	{oninput}
	{id}
	{placeholder}
/>
