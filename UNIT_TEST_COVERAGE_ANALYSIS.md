# Unit Test Coverage Analysis - Tator-Specific Code

This document identifies areas in the TeamTators/dashboard repository that require unit tests, focusing specifically on Tator-specific functionality (as opposed to the generic SvelteKit template code from https://github.com/tsaxking/sveltekit-template).

## Executive Summary

The repository has some existing unit tests (19 test files found), but there are significant gaps in coverage for critical Tator-specific functionality. This analysis identifies **10 major areas** requiring comprehensive unit testing.

## Existing Test Coverage

Currently, the following test files exist:

### E2E Tests (in `e2e/`)
- permissions.test.ts
- accounts.test.ts
- tba.test.ts
- file-upload.test.ts
- session-manager.test.ts
- struct-connect.test.ts
- struct-data.test.ts

### Unit Tests (in `src/tests/`)
- scout-groups.test.ts
- writeable.test.ts
- downloads.test.ts
- action-summary.test.ts
- tba-webhook.test.ts
- features.test.ts
- tba.test.ts
- run-task.test.ts
- struct.test.ts
- fullscreen.test.ts
- components.test.ts
- contextmenu.test.ts
- prompts.test.ts

## Areas Requiring Unit Tests (Tator-Specific)

### 1. **TBA (The Blue Alliance) Integration** - HIGH PRIORITY

**Location**: `src/lib/server/utils/tba.ts`

**Missing Tests**:
- `Event.getEvent()` - Fetch and cache events with proper error handling
- `Event.getEvents()` - Fetch multiple events for a season
- `Event.createEvent()` - Create custom events
- `Match.getTeams()` - Resolve match teams correctly
- `Match.asYear()` - Parse year-specific match data
- `Team.getMatches()` - Filter team matches correctly
- `Team.getMedia()` - Fetch team media
- `Team.getStatus()` - Get team event status
- Cache expiration logic
- Error handling when TBA API is unavailable
- Fallback to cached data on network errors

**Rationale**: TBA integration is core to the scouting system. Failures here affect event data, match schedules, and team information.

**Test File**: `src/tests/tba-integration.test.ts` (enhance existing or create comprehensive)

---

### 2. **Scouting Data Models and Trace Parsing** - CRITICAL

**Location**: `src/lib/server/structs/scouting.ts` and `src/lib/model/scouting.ts`

**Missing Tests**:
- `MatchScoutingExtended.from()` - Parse and validate trace data
- `MatchScoutingExtended` computed properties (team, matchNumber, compLevel, etc.)
- `getTeamScouting()` - Retrieve scouting data for a team at an event
- `getMatchScouting()` - Retrieve scouting data for a specific match
- Trace parsing with invalid JSON
- Trace parsing with missing required fields
- Scout group assignment logic
- Prescouting vs. actual match handling
- Remote vs. local upload handling
- Version history tracking

**Rationale**: Scouting data is the primary data collected by the app. Incorrect parsing or storage could lead to data loss or corruption.

**Test File**: `src/tests/scouting-data.test.ts` (NEW)

---

### 3. **FIRST Data Structures** - HIGH PRIORITY

**Location**: `src/lib/server/structs/FIRST.ts`

**Missing Tests**:
- `generateSummary()` - Generate event summaries for 2024 and 2025
- `getSummary()` - Retrieve or generate cached summaries
- Summary caching logic
- Year-specific summary generation (2024 vs 2025)
- Team picture management
- Custom match creation and validation
- Match validation (ensure 4 teams per alliance for 2025)

**Rationale**: Event summaries aggregate match data and are used for strategy and analysis. Incorrect summaries could lead to poor strategic decisions.

**Test File**: `src/tests/first-summaries.test.ts` (NEW)

---

### 4. **Year-Specific Trace Summaries** - CRITICAL

**Location**: `src/lib/utils/trace/summaries/2024.ts` and `src/lib/utils/trace/summaries/2025.ts`

**Missing Tests**:
- **2025 Summary**:
  - Average Auto Points (Mobility, Coral, Algae, Total)
  - Average Teleop Points (Coral, Algae, Total)
  - Average Endgame Points (Park, Shallow, Deep, Total)
  - Aggregator functions (average, max, min, sum)
  - Serialization/deserialization
  - Edge cases (no data, partial data, invalid data)
  
- **2024 Summary**:
  - All year-specific calculations
  - Compatibility with 2024 game rules
  - Migration/comparison with 2025 data

**Rationale**: Summary calculations directly impact team performance analysis and strategic planning. Errors in calculations could mislead scouts and strategists.

**Test File**: `src/tests/trace-summaries-2025.test.ts` and `src/tests/trace-summaries-2024.test.ts` (NEW)

---

### 5. **Strategy Management** - HIGH PRIORITY

**Location**: `src/lib/server/structs/strategy.ts`

**Missing Tests**:
- `getMatchStrategy()` - Retrieve strategies for a specific match
- `getStrategy()` - Fetch strategy with partners and opponents
- Strategy lifecycle hooks (create, delete, archive, restore)
- Partner/Opponent auto-generation on strategy creation
- Partner/Opponent cascading delete
- Partner/Opponent cascading archive/restore
- Whiteboard creation and management
- Alliance management
- Strategy validation (alliance must be 'red', 'blue', or 'unknown')

**Rationale**: Strategy management is crucial for match preparation. Bugs could lead to incorrect partner/opponent assignments or lost strategic data.

**Test File**: `src/tests/strategy-management.test.ts` (NEW)

---

### 6. **Action Summary Generation** - HIGH PRIORITY

**Location**: `src/lib/server/utils/action-summary.ts`

**Missing Tests**:
- `actionSummary()` - Generate action count tables
- Action counting logic for specific actions
- Match filtering (only completed matches)
- Team-match cross-referencing
- Trace point analysis (sections, actions)
- Caching logic for team traces
- Edge cases (missing traces, incomplete matches)

**Rationale**: Action summaries provide insights into robot performance. Incorrect counts could lead to inaccurate performance assessments.

**Test File**: `src/tests/action-summary-generation.test.ts` (enhance existing)

---

### 7. **TBA Webhook Processing** - MEDIUM PRIORITY

**Location**: `src/lib/server/services/tba-webhooks.ts`

**Missing Tests**:
- Schema validation for all webhook types:
  - `upcoming_match`
  - `match_score`
  - `starting_comp_level`
  - `alliance_selection`
  - `schedule_updated`
  - `ping`
  - `broadcast`
  - `verification`
  - `match_video`
- Event emitter registration and triggering
- Redis listener initialization
- Webhook payload parsing
- Error handling for malformed payloads

**Rationale**: Webhooks provide real-time updates during events. Failures could mean missing critical updates like match scores or schedule changes.

**Test File**: `src/tests/tba-webhook-validation.test.ts` (enhance existing)

---

### 8. **Pit Scouting Features** - MEDIUM PRIORITY

**Location**: `src/lib/server/structs/scouting.ts` (PIT namespace)

**Missing Tests**:
- Pit scouting group management
- Question/Answer validation
- Template generation (`generateBoilerplate()`)
- Answer filtering by question IDs
- Group-based answer retrieval
- Answer data serialization

**Rationale**: Pit scouting collects pre-match intelligence on teams. Bugs could lead to incomplete or incorrect team assessments.

**Test File**: `src/tests/pit-scouting.test.ts` (NEW)

---

### 9. **Scout Group Assignment** - HIGH PRIORITY

**Location**: Referenced in `src/tests/scout-groups.test.ts` (uses tatorscout package)

**Missing Tests**:
- Scout group generation algorithm validation
- Assignment conflict detection
- Coverage verification (all matches covered)
- Team assignment fairness
- Edge cases (odd number of teams, playoff matches)
- Assignment for different event types

**Rationale**: Scout groups determine which scouts cover which matches. Poor assignments could lead to missed data or scout burnout.

**Test File**: Enhance `src/tests/scout-groups.test.ts`

---

### 10. **Match Scouting Extended Features** - MEDIUM PRIORITY

**Location**: `src/lib/model/scouting.ts` - MatchScoutingExtended class

**Missing Tests**:
- Team number extraction
- Match identification
- Trace data parsing
- Scoring calculations
- Alliance color determination
- Slider data handling
- Check data handling
- Comparison methods (sorting, filtering)

**Rationale**: Extended features provide enhanced views of scouting data. Bugs could lead to incorrect filtering or display of match data.

**Test File**: `src/tests/match-scouting-extended.test.ts` (NEW)

---

### 11. **TBA Caching and Request Management** - MEDIUM PRIORITY

**Location**: `src/lib/server/structs/TBA.ts`

**Missing Tests**:
- Request caching logic
- Cache invalidation based on updateThreshold
- Force refresh functionality
- Custom event CRUD operations
- Custom team CRUD operations
- Custom match CRUD operations
- Cascading deletes (event -> teams/matches)
- Error handling when TBA API key is invalid
- Timeout handling

**Rationale**: Proper caching reduces API calls and improves performance. Cache bugs could lead to stale data or excessive API usage.

**Test File**: `src/tests/tba-caching.test.ts` (NEW)

---

## Priority Matrix

| Priority | Area | Impact | Complexity |
|----------|------|--------|------------|
| CRITICAL | Scouting Data Models | Very High | Medium |
| CRITICAL | Year-Specific Summaries | Very High | High |
| HIGH | TBA Integration | High | Medium |
| HIGH | FIRST Data Structures | High | Medium |
| HIGH | Strategy Management | High | Low |
| HIGH | Action Summary | High | Medium |
| HIGH | Scout Group Assignment | High | Low |
| MEDIUM | TBA Webhook Processing | Medium | Low |
| MEDIUM | Pit Scouting | Medium | Low |
| MEDIUM | Match Scouting Extended | Medium | Low |
| MEDIUM | TBA Caching | Medium | Medium |

---

## Recommended Testing Approach

### Phase 1: Critical Infrastructure (Week 1-2)
1. Scouting Data Models
2. Year-Specific Trace Summaries
3. TBA Integration

### Phase 2: Core Features (Week 3-4)
4. FIRST Data Structures
5. Strategy Management
6. Action Summary Generation

### Phase 3: Supporting Features (Week 5-6)
7. Scout Group Assignment (enhance existing)
8. TBA Caching
9. TBA Webhook Processing

### Phase 4: Additional Features (Week 7)
10. Pit Scouting
11. Match Scouting Extended

---

## Testing Best Practices

1. **Use Real Data Samples**: Create fixtures based on actual TBA responses and scouting data
2. **Test Edge Cases**: Empty data, malformed JSON, missing fields, invalid values
3. **Test Year Transitions**: Ensure 2024/2025 year-specific code works correctly
4. **Mock External Services**: Mock TBA API, Redis, Database for unit tests
5. **Test Caching Logic**: Verify cache hits, misses, and invalidation
6. **Test Lifecycle Hooks**: Ensure Struct lifecycle events (create, delete, archive) work correctly
7. **Validate Schemas**: Use Zod schemas to validate test data
8. **Test Error Paths**: Ensure proper error handling and logging

---

## Conclusion

This repository has a solid foundation with existing E2E and unit tests, but there are significant gaps in coverage for Tator-specific features. The 11 areas identified above represent critical functionality that should be thoroughly tested to ensure data integrity, correct calculations, and reliable operation during scouting events.

Implementing comprehensive unit tests for these areas will:
- Reduce bugs in production
- Enable confident refactoring
- Improve code documentation
- Facilitate onboarding of new developers
- Ensure consistent behavior across year transitions
