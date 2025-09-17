export type Entitlement =
	| 'view-roles'
	| 'view-potatoes'
	| 'edit-potato-level'
	| 'view-strategy'
	| 'create-custom-tba-responses'
	| 'manage-tba'
	| 'view-checklist'
	| 'view-tba-info'
	| 'upload-pictures'
	| 'manage-pit-scouting'
	| 'manage-scouting'
	| 'view-scouting'
	| 'manage-roles'
	| 'view-pit-scouting';
export type Group = 'Roles' | 'Potatoes' | 'Strategy' | 'TBA' | 'Checklists' | 'FIRST' | 'Scouting';
export type Features = string;
