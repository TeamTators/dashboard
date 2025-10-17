export type Entitlement =
	| 'view-tba-info'
	| 'view-roles'
	| 'upload-pictures'
	| 'manage-scouting'
	| 'view-pit-scouting'
	| 'manage-pit-scouting'
	| 'view-potatoes'
	| 'view-scouting'
	| 'edit-potato-level'
	| 'create-custom-tba-responses'
	| 'view-strategy'
	| 'manage-tba'
	| 'view-checklist'
	| 'manage-roles'
	| 'manage-members'
	| 'test-permission-manage'
	| 'test-permission-view';
export type Group =
	| 'FIRST'
	| 'Roles'
	| 'Scouting'
	| 'Potatoes'
	| 'TBA'
	| 'Strategy'
	| 'Checklists'
	| 'Testing';
export type Features = 'manage-potatoes' | 'manage-roles';
