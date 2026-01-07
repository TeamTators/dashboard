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
export type Group =
	| 'Roles'
	| 'FIRST'
	| 'Potatoes'
	| 'Scouting'
	| 'TBA'
	| 'Strategy'
	| 'Checklists'
	| 'Testing';
export type Features = 'manage-potatoes' | 'manage-roles';
