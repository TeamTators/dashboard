/**
 * @fileoverview Defines entitlement and feature unions for permission gating.
 * @description
 * Centralized string unions used to describe user capabilities and UI groupings.
 */

/**
 * Entitlement keys used for permission checks throughout the app.
 * @example
 * const entitlement: Entitlement = 'view-scouting';
 */
export type Entitlement =
	| 'view-roles'
	| 'view-tba-info'
	| 'view-potatoes'
	| 'edit-potato-level'
	| 'upload-pictures'
	| 'view-scouting'
	| 'manage-scouting'
	| 'view-pit-scouting'
	| 'manage-pit-scouting'
	| 'manage-tba'
	| 'create-custom-tba-responses'
	| 'view-strategy'
	| 'view-checklist'
	| 'manage-roles'
	| 'manage-members'
	| 'test-permission-manage';

/**
 * Display groups used to organize entitlements in the UI.
 * @example
 * const group: Group = 'Scouting';
 */
export type Group =
	| 'Roles'
	| 'FIRST'
	| 'Potatoes'
	| 'Scouting'
	| 'TBA'
	| 'Strategy'
	| 'Checklists'
	| 'Testing';

/**
 * Feature flags surfaced in configuration or role assignments.
 * @example
 * const feature: Features = 'manage-roles';
 */
export type Features = 'manage-potatoes' | 'manage-roles';
