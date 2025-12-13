export type Entitlement =
	| 'test-permission-manage'
	| 'manage-members'
	| 'upload-pictures'
	| 'manage-scouting'
	| 'view-tba-info'
	| 'test-permission-view'
	| 'view-scouting'
	| 'view-roles'
	| 'manage-roles'
	| 'view-potatoes'
	| 'view-pit-scouting'
	| 'edit-potato-level'
	| 'manage-tba'
	| 'view-checklist'
	| 'create-custom-tba-responses'
	| 'manage-pit-scouting'
	| 'view-strategy';
export type Group =
	| 'Testing'
	| 'Roles'
	| 'FIRST'
	| 'Scouting'
	| 'Potatoes'
	| 'TBA'
	| 'Checklists'
	| 'Strategy';
export type Features = 'manage-roles' | 'manage-potatoes';
