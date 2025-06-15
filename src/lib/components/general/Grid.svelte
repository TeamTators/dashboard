<script lang="ts">
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
		NumberFilterModule
	} from 'ag-grid-community';

	// Register AG Grid Modules
	ModuleRegistry.registerModules([
		ClientSideRowModelModule,
		PaginationModule,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule
	]);

	interface Props<T extends Record<string, unknown> = Record<string, unknown>> {
		columnDefs: {
			headerName: string;
			field: keyof T;
		}[];
		rowData: T[];
		gridClasses: string;
		filterEnable: boolean;
		filterClasses: string;
		additionalOptions?: Partial<GridOptions>;
	}

	let {
		columnDefs,
		rowData,
		gridClasses,
		filterEnable,
		filterClasses,
		additionalOptions = {}
	}: Props = $props();

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
	let grid: GridApi;
	let filterText: string = $state('');

	const onFilterTextBoxChanged = () => {
		grid.setGridOption('quickFilterText', filterText);
	};

	onMount(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const gridOptions: GridOptions<any> = {
			theme: darkTheme, // Apply custom dark theme
			columnDefs,
			rowData,
			defaultColDef: {
				sortable: true,
				flex: 1,
				filter: true,
				autoHeight: true,
				wrapText: true
			},
			pagination: true,
			paginationPageSize: 10,
			paginationPageSizeSelector: [10, 20, 50],
			...additionalOptions

			// autoSizeStrategy: {
			// 	type: 'fitGridWidth'
			// }
			// paginationAutoPageSize: true
		};

		if (gridDiv) {
			grid = createGrid(gridDiv, gridOptions); // Create the grid with custom options
		}
	});
</script>

<!-- Grid Container -->
<div class="filter-container">
	<input
		type="text"
		id="filter-text-box"
		class="form-control me-2"
		placeholder="Filter..."
		oninput={onFilterTextBoxChanged}
		bind:value={filterText}
	/>
</div>
<div bind:this={gridDiv} class="w-100 h-100"></div>
