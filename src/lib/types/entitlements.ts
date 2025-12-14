export type Entitlement =
	| 'view-roles'
	| 'view-tba-info'
	| 'view-scouting'
	| 'manage-pit-scouting'
	| 'view-potatoes'
	| 'upload-pictures'
	| 'view-pit-scouting'
	| 'edit-potato-level'
	| 'manage-scouting'
	| 'create-custom-tba-responses'
	| 'manage-tba'
	| 'view-strategy'
	| 'view-checklist'
	| 'manage-roles'
	| 'manage-members'
	| 'test-permission-view'
	| 'test-permission-manage';
export type Group =
	| 'Roles'
	| 'FIRST'
	| 'Scouting'
	| 'Potatoes'
	| 'TBA'
	| 'Strategy'
	| 'Checklists'
	| 'Testing';
export type Features = 'manage-potatoes' | 'manage-roles';
