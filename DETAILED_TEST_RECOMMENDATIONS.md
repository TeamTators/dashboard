# Detailed Test Recommendations - Implementation Guide

This document provides detailed recommendations and examples for implementing unit tests for Tator-specific functionality.

## Table of Contents

1. [Scouting Data Models](#1-scouting-data-models)
2. [Pit Scouting System](#2-pit-scouting-system)
3. [Trace Summary Calculations](#3-trace-summary-calculations)
4. [TBA Integration Edge Cases](#4-tba-integration-edge-cases)
5. [Strategy Lifecycle Hooks](#5-strategy-lifecycle-hooks)

---

## 1. Scouting Data Models

### File: `src/tests/scouting-data-models.test.ts`

**Functions to Test** (from `src/lib/server/structs/scouting.ts`):

#### 1.1 `MatchScoutingExtended.from()`

```typescript
// Test cases needed:
describe('MatchScoutingExtended.from()', () => {
	test('should parse valid scouting data with trace', () => {
		// Valid trace JSON in scouting.data.trace
		// Should return MatchScoutingExtended instance
	});

	test('should fail with invalid trace JSON', () => {
		// Invalid JSON in scouting.data.trace
		// Should return error Result
	});

	test('should fail with missing trace data', () => {
		// Empty or undefined trace
		// Should return error Result
	});

	test('should fail with malformed trace structure', () => {
		// Valid JSON but incorrect Trace schema
		// Should return error Result
	});
});
```

#### 1.2 `getMatchScouting()`

```typescript
describe('getMatchScouting()', () => {
	test('should retrieve match scouting by match identifiers', () => {
		// Given: eventKey, match, team, compLevel
		// Should return matching scouting record
	});

	test('should return undefined for non-existent match', () => {
		// Given: non-existent match parameters
		// Should return undefined
	});

	test('should exclude archived records', () => {
		// Given: archived scouting record exists
		// Should return undefined or non-archived version
	});

	test('should handle multiple scouts for same match/team', () => {
		// Edge case: duplicate scouting records
		// Should return first or most recent
	});
});
```

#### 1.3 `getTeamScouting()`

```typescript
describe('getTeamScouting()', () => {
	test('should retrieve all scouting for team at event', () => {
		// Given: team number and event key
		// Should return array of all matches scouted
	});

	test('should exclude archived records', () => {
		// Should only return non-archived records
	});

	test('should handle team with no scouting data', () => {
		// Should return empty array
	});

	test('should handle prescouting vs actual matches', () => {
		// Should include both prescouting and actual
	});
});
```

#### 1.4 `getTeamPrescouting()`

```typescript
describe('getTeamPrescouting()', () => {
	test('should retrieve prescouting for team/year', () => {
		// Should return only prescouting records
	});

	test('should include archived prescouting', () => {
		// Unlike other functions, this includes archived
	});

	test('should filter by year correctly', () => {
		// Multiple years exist, should filter correctly
	});
});
```

#### 1.5 MatchScoutingExtended Computed Properties

```typescript
describe('MatchScoutingExtended computed properties', () => {
	test('team getter should return number', () => {
		// Should parse and return team as number
	});

	test('getChecks() should parse checks JSON', () => {
		// Should parse checks string array
	});

	test('getChecks() should handle empty/invalid checks', () => {
		// Should handle '[]', '', null, invalid JSON
	});

	test('getSliders() should parse sliders object', () => {
		// Should parse slider data with value, text, color
	});

	test('getSliders() should handle empty/invalid sliders', () => {
		// Should handle '{}', '', null, invalid JSON
	});

	test('averageVelocity should calculate from trace', () => {
		// Should delegate to trace.averageVelocity()
	});

	test('secondsNotMoving should calculate from trace', () => {
		// Should delegate to trace.secondsNotMoving()
	});
});
```

#### 1.6 Lifecycle Hooks

```typescript
describe('MatchScouting lifecycle hooks', () => {
	test('on archive: should archive related team comments', () => {
		// When match scouting archived
		// Related team comments should be archived
	});

	test('on restore: should restore related team comments', () => {
		// When match scouting restored
		// Related team comments should be restored
	});

	test('on create/update/delete: should trigger summary generation', () => {
		// Should call FIRST.generateSummary after debounce
		// Test debouncing behavior
	});

	test('summary generation should only trigger for 2024/2025', () => {
		// Years outside 2024-2025 should not trigger
	});
});
```

---

## 2. Pit Scouting System

### File: `src/tests/pit-scouting-system.test.ts`

**Functions to Test** (from `src/lib/server/structs/scouting.ts` PIT namespace):

#### 2.1 `generateBoilerplate()`

```typescript
describe('PIT.generateBoilerplate()', () => {
	test('should create default sections for event', () => {
		// Should create standard sections (Robot, Drivetrain, etc.)
	});

	test('should create default groups in each section', () => {
		// Each section should have default groups
	});

	test('should create default questions in each group', () => {
		// Each group should have default questions
	});

	test('should handle event with existing template', () => {
		// Should not duplicate if template exists
	});

	test('should set correct order for sections/groups/questions', () => {
		// Should maintain proper ordering
	});
});
```

#### 2.2 `copyFromEvent()`

```typescript
describe('PIT.copyFromEvent()', () => {
	test('should copy all sections from source event', () => {
		// Should replicate section structure
	});

	test('should copy all groups from source event', () => {
		// Should replicate group structure
	});

	test('should copy all questions from source event', () => {
		// Should replicate question structure
	});

	test('should preserve order from source event', () => {
		// Order values should be maintained
	});

	test('should fail if source event has no template', () => {
		// Should return error
	});

	test('should not copy answers', () => {
		// Only template, not team-specific answers
	});
});
```

#### 2.3 `getScoutingInfo()`

```typescript
describe('PIT.getScoutingInfo()', () => {
	test('should retrieve pit scouting for team at event', () => {
		// Should return structured pit data
	});

	test('should organize by sections and groups', () => {
		// Should group questions appropriately
	});

	test('should include question and answer data', () => {
		// Should include full Q&A information
	});

	test('should handle team with no pit scouting', () => {
		// Should return empty or template structure
	});

	test('should handle incomplete pit scouting', () => {
		// Some questions answered, some not
	});
});
```

#### 2.4 `getAnswersFromGroup()`

```typescript
describe('PIT.getAnswersFromGroup()', () => {
	test('should retrieve all answers for a group', () => {
		// Should return answers from all teams
	});

	test('should include unanswered questions', () => {
		// Should show which questions lack answers
	});

	test('should handle group with no answers', () => {
		// Should return empty array
	});
});
```

#### 2.5 Lifecycle Hooks

```typescript
describe('PIT lifecycle hooks', () => {
	test('Section delete: should cascade to groups', () => {
		// Deleting section should delete all groups
	});

	test('Group delete: should cascade to questions', () => {
		// Deleting group should delete all questions
	});

	test('Question delete: should cascade to answers', () => {
		// Deleting question should delete all answers
	});

	test('Archive/restore should cascade properly', () => {
		// Archive/restore should cascade through hierarchy
	});
});
```

---

## 3. Trace Summary Calculations

### File: `src/tests/trace-summary-2025.test.ts`

**Functions to Test** (from `src/lib/utils/trace/summaries/2025.ts`):

#### 3.1 Average Auto Points

```typescript
describe('2025 Summary: Average Auto Points', () => {
	test('Mobility: should calculate mobility points correctly', () => {
		// 3 points if robot left starting zone
		// 0 points if not
	});

	test('Mobility: should handle missing score breakdown', () => {
		// Should return 0 or handle gracefully
	});

	test('Coral: should sum all coral levels in auto', () => {
		// cl1 + cl2 + cl3 + cl4
	});

	test('Algae: should sum barge and processor in auto', () => {
		// brg + prc
	});

	test('Total: should match auto.total', () => {
		// Should use trace.auto.total
	});

	test('should handle empty traces array', () => {
		// Should return 0 or NaN appropriately
	});
});
```

#### 3.2 Average Teleop Points

```typescript
describe('2025 Summary: Average Teleop Points', () => {
	test('Coral: should sum all coral levels in teleop', () => {
		// cl1 + cl2 + cl3 + cl4
	});

	test('Algae: should sum barge and processor in teleop', () => {
		// brg + prc
	});

	test('Total: should match teleop.total', () => {
		// Should use trace.teleop.total
	});
});
```

#### 3.3 Average Endgame Points

```typescript
describe('2025 Summary: Average Endgame Points', () => {
	test('Park: should give 2 points for Parked', () => {
		// endGameRobot1/2/3 === 'Parked'
	});

	test('Shallow: should give 6 points for ShallowCage', () => {
		// endGameRobot1/2/3 === 'ShallowCage'
	});

	test('Deep: should calculate deep climb points', () => {
		// Should calculate points for deep climb
	});

	test('should match correct robot position', () => {
		// Red position 0-2, Blue position 0-2
	});

	test('should handle tie/unknown alliances', () => {
		// Should return 0 for unknown alliance
	});
});
```

#### 3.4 Aggregator Functions

```typescript
describe('Aggregators', () => {
	test('average: should calculate mean', () => {
		// [1, 2, 3, 4, 5] => 3
	});

	test('average: should handle empty array', () => {
		// [] => 0 or NaN
	});

	test('max: should return maximum value', () => {
		// [1, 5, 3] => 5
	});

	test('min: should return minimum value', () => {
		// [1, 5, 3] => 1
	});

	test('sum: should return total', () => {
		// [1, 2, 3] => 6
	});
});
```

#### 3.5 Serialization

```typescript
describe('2025 Summary serialization', () => {
	test('serialize: should convert to JSON string', () => {
		// Should produce valid JSON
	});

	test('deserialize: should parse JSON string', () => {
		// Should recreate summary object
	});

	test('roundtrip: serialize then deserialize should preserve data', () => {
		// data === deserialize(serialize(data))
	});

	test('deserialize: should handle invalid JSON', () => {
		// Should return error Result
	});
});
```

---

## 4. TBA Integration Edge Cases

### File: `src/tests/tba-integration-edge-cases.test.ts`

#### 4.1 Cache Management

```typescript
describe('TBA cache management', () => {
	test('should use cached data within updateThreshold', () => {
		// Recent cache hit should not call API
	});

	test('should refetch when cache expired', () => {
		// Old cache should trigger API call
	});

	test('should delete duplicate cache entries', () => {
		// On cache miss, should remove old entry
	});

	test('force=true should bypass cache', () => {
		// Should always call API when forced
	});

	test('should not cache when updateThreshold=0', () => {
		// Should skip caching
	});
});
```

#### 4.2 Error Handling

```typescript
describe('TBA error handling', () => {
	test('should timeout after configured duration', () => {
		// Should reject after timeout
	});

	test('should handle TBA API errors', () => {
		// json.Error should be rejected
	});

	test('should handle network errors', () => {
		// fetch failure should be caught
	});

	test('should handle invalid API key', () => {
		// 401 response should be handled
	});

	test('should handle rate limiting', () => {
		// 429 response should be handled
	});
});
```

#### 4.3 Custom Event CRUD

```typescript
describe('Custom TBA events', () => {
	test('delete event: should cascade to teams', () => {
		// Deleting event should delete all teams
	});

	test('delete event: should cascade to matches', () => {
		// Deleting event should delete all matches
	});

	test('create event: should validate event data', () => {
		// Should validate against EventSchema
	});

	test('should handle concurrent deletions', () => {
		// Multiple deletions should not conflict
	});
});
```

---

## 5. Strategy Lifecycle Hooks

### File: `src/tests/strategy-lifecycle.test.ts`

#### 5.1 Strategy Creation

```typescript
describe('Strategy creation hooks', () => {
	test('should auto-create 3 partners', () => {
		// positions 1, 2, 3
	});

	test('should auto-create 3 opponents', () => {
		// positions 1, 2, 3
	});

	test('should initialize partners with empty fields', () => {
		// startingPosition, auto, postAuto, role, endgame, notes = ''
	});

	test('should initialize opponents with empty fields', () => {
		// postAuto, role, notes = ''
	});

	test('should link partners to strategy via strategyId', () => {
		// partner.strategyId === strategy.id
	});
});
```

#### 5.2 Strategy Deletion

```typescript
describe('Strategy deletion hooks', () => {
	test('should delete all partners', () => {
		// All 3 partners should be deleted
	});

	test('should delete all opponents', () => {
		// All 3 opponents should be deleted
	});

	test('should handle strategy with missing partners/opponents', () => {
		// Should not fail if data is incomplete
	});
});
```

#### 5.3 Strategy Archive/Restore

```typescript
describe('Strategy archive/restore hooks', () => {
	test('archive: should archive all partners', () => {
		// All partners.archived = true
	});

	test('archive: should archive all opponents', () => {
		// All opponents.archived = true
	});

	test('restore: should restore all partners', () => {
		// All partners.archived = false
	});

	test('restore: should restore all opponents', () => {
		// All opponents.archived = false
	});
});
```

#### 5.4 Strategy Validation

```typescript
describe('Strategy validation', () => {
	test('alliance must be red, blue, or unknown', () => {
		// Invalid alliance should be rejected
	});

	test('should validate matchNumber for match-type strategies', () => {
		// type='match' should have valid matchNumber
	});

	test('should allow matchNumber=-1 for non-match strategies', () => {
		// type!='match' can have matchNumber=-1
	});

	test('should validate compLevel for match-type strategies', () => {
		// type='match' should have valid compLevel
	});
});
```

#### 5.5 getMatchStrategy and getStrategy

```typescript
describe('Strategy retrieval', () => {
	test('getMatchStrategy: should find strategies by match', () => {
		// Should match on matchNumber, compLevel, eventKey
	});

	test('getStrategy: should include partners and opponents', () => {
		// Should return strategy with 3 partners and 3 opponents
	});

	test('getStrategy: should sort partners by position', () => {
		// Partners should be ordered [1, 2, 3]
	});

	test('getStrategy: should sort opponents by position', () => {
		// Opponents should be ordered [1, 2, 3]
	});

	test('getStrategy: should fail if partner count != 3', () => {
		// Should throw error
	});

	test('getStrategy: should fail if opponent count != 3', () => {
		// Should throw error
	});
});
```

---

## Testing Best Practices

### 1. Use Fixtures

Create reusable test data:

```typescript
// fixtures/tba-events.ts
export const mockEvent2024 = {
	key: '2024idbo',
	name: 'Idaho Regional',
	event_code: 'idbo',
	year: 2024
	// ... full event data
};

export const mockMatch2025 = {
	key: '2025idbo_qm1',
	comp_level: 'qm',
	match_number: 1,
	alliances: {
		red: {
			team_keys: ['frc254', 'frc1114', 'frc2056'],
			score_breakdown: {
				autoLineRobot1: 'Yes'
				// ...
			}
		}
		// ...
	}
};
```

### 2. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// Mock TBA API
vi.mock('$lib/server/utils/tba', () => ({
	Event: {
		getEvent: vi.fn().mockResolvedValue(mockEvent)
	}
}));

// Mock Database
vi.mock('$lib/server/db', () => ({
	DB: {
		select: vi.fn()
	}
}));
```

### 3. Test Edge Cases

- Empty arrays
- Null/undefined values
- Invalid JSON
- Missing required fields
- Duplicate data
- Archived vs non-archived
- Year transitions (2024 → 2025)

### 4. Test Error Paths

```typescript
test('should handle database errors gracefully', async () => {
	DB.select.mockRejectedValue(new Error('Database unavailable'));
	const result = await getTeamScouting(254, '2025idbo');
	expect(result.isErr()).toBe(true);
});
```

### 5. Test Async Operations

```typescript
test('should handle concurrent requests', async () => {
	const promises = [
		getTeamScouting(254, '2025idbo'),
		getTeamScouting(1114, '2025idbo'),
		getTeamScouting(2056, '2025idbo')
	];
	const results = await Promise.all(promises);
	expect(results).toHaveLength(3);
	results.forEach((r) => expect(r.isOk()).toBe(true));
});
```

---

## Implementation Priority

1. **Week 1**: Scouting Data Models (most critical)
2. **Week 2**: Trace Summary Calculations (affects all analysis)
3. **Week 3**: TBA Integration Edge Cases (data source reliability)
4. **Week 4**: Pit Scouting System (less critical but widely used)
5. **Week 5**: Strategy Lifecycle Hooks (important for competitions)

---

## Running Tests

```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm test:unit src/tests/scouting-data-models.test.ts

# Run in watch mode
pnpm test:unit -- --watch

# Run with coverage
pnpm test:unit -- --coverage
```

---

## Coverage Goals

- **Critical functions**: 100% coverage (all paths tested)
- **High-priority functions**: 90%+ coverage
- **Medium-priority functions**: 80%+ coverage
- **Overall codebase**: 70%+ coverage for Tator-specific code

---

## Conclusion

This detailed guide provides a roadmap for implementing comprehensive unit tests for Tator-specific functionality. Following these recommendations will significantly improve code quality, reduce bugs, and make the codebase more maintainable.
