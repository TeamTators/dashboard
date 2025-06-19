<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import {
		createGrid,
		ModuleRegistry,
		ClientSideRowModelModule,
		type GridOptions,
		themeQuartz,
		PaginationModule,
		type GridApi,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		RowApiModule,
		NumberEditorModule ,
		RenderApiModule ,
		ScrollApiModule 
	} from 'ag-grid-community';
	import { EventEmitter } from 'ts-utils/event-emitter';
	import type { Readable } from 'svelte/store';

	// Register AG Grid Modules
	ModuleRegistry.registerModules([
		ClientSideRowModelModule,
		PaginationModule,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		RowApiModule,
		NumberEditorModule,
		RenderApiModule ,
		ScrollApiModule 
	]);

	interface Props {
		filter?: boolean;
		opts: Omit<GridOptions<T>, 'rowData'>;
		data: Readable<T[]>;
		style?: string;
	}

	const {
		filter,
		opts,
		data,
		style,
	}: Props = $props();

	const em = new EventEmitter<{
		'filter': T[];
		'init': HTMLDivElement;
		'ready': GridApi<T>;
	}>();

	export const on = em.on.bind(em);
	export const off = em.off.bind(em);

	export const getGrid = () => grid;

	// Create a custom dark theme using Theming API
	const darkTheme = themeQuartz.withParams({
		backgroundColor: '#212529',
		browserColorScheme: 'dark',
		chromeBackgroundColor: {
			ref: 'foregroundColor',
			mix: 0.07,
			onto: 'backgroundColor'
		},
		foregroundColor: '#FFF',
		headerFontSize: 14
	});

	let gridDiv: HTMLDivElement;
	let grid: GridApi<T>;
	let filterText: string = $state('');
	let filterTimeout: ReturnType<typeof setTimeout> | null = null;

	const onDataFilter = () => {
		if (filterTimeout) {
			clearTimeout(filterTimeout);
		}
		filterTimeout = setTimeout(() => {
			grid.setGridOption('quickFilterText', filterText);
			const nodes = grid.getRenderedNodes().map(n => n.data).filter(Boolean);
			em.emit('filter', nodes);
		}, 300);
	};

	onMount(() => {
		em.emit('init', gridDiv); // Emit the init event with the grid container
		const gridOptions: GridOptions = {
			theme: darkTheme,
			...opts,
			rowData: $data,
		};
		grid = createGrid(gridDiv, gridOptions); // Create the grid with custom options
		em.emit('ready', grid); // Emit the ready event with the grid API
	
		return data.subscribe(r => {
			grid.setGridOption('rowData', r); // Set the row data from the provided store
			onDataFilter();
		});
	});
</script>

<!-- Grid Container -->
{#if filter}
	<div class="filter-container">
		<input
			type="text"
			id="filter-text-box"
			class="form-control me-2"
			placeholder="Filter..."
			oninput={onDataFilter}
			bind:value={filterText}
		/>
	</div>
{/if}

<div bind:this={gridDiv} {style}></div>
