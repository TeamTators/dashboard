<<<<<<< Updated upstream
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
=======
export type Entitlement = 
    'view-pit-scouting'
  | 'create-custom-tba-responses'
  | 'view-roles'
  | 'test-permission-manage'
  | 'manage-tba'
  | 'view-scouting'
  | 'manage-pit-scouting'
  | 'manage-scouting'
  | 'manage-members'
  | 'test-permission-view'
  | 'manage-roles'
  | 'view-checklist'
  | 'upload-pictures'
  | 'view-potatoes'
  | 'edit-potato-level'
  | 'view-strategy'
  | 'view-tba-info';
export type Group = 
    'Scouting'
  | 'TBA'
  | 'Roles'
  | 'Testing'
  | 'Checklists'
  | 'FIRST'
  | 'Potatoes'
  | 'Strategy';
export type Features = 
	'manage-roles'
  | 'manage-potatoes';
>>>>>>> Stashed changes
