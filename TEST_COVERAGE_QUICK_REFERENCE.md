# Unit Test Coverage - Quick Reference Guide

## 🎯 Quick Summary

This repository needs unit tests for **11 major Tator-specific areas**. Current test coverage focuses on E2E tests and basic integration tests, but lacks comprehensive unit tests for core business logic.

## 📊 Priority Ranking

| # | Area | Priority | Files | Estimated Work |
|---|------|----------|-------|----------------|
| 1 | Scouting Data Models | **CRITICAL** | `src/lib/server/structs/scouting.ts`<br>`src/lib/model/scouting.ts` | 2-3 days |
| 2 | Trace Summaries (2024/2025) | **CRITICAL** | `src/lib/utils/trace/summaries/2024.ts`<br>`src/lib/utils/trace/summaries/2025.ts` | 2-3 days |
| 3 | TBA Integration | **HIGH** | `src/lib/server/utils/tba.ts`<br>`src/lib/utils/tba.ts` | 2 days |
| 4 | FIRST Data Structures | **HIGH** | `src/lib/server/structs/FIRST.ts` | 1-2 days |
| 5 | Strategy Management | **HIGH** | `src/lib/server/structs/strategy.ts` | 1-2 days |
| 6 | Action Summary | **HIGH** | `src/lib/server/utils/action-summary.ts` | 1 day |
| 7 | Scout Group Assignment | **HIGH** | Enhance `src/tests/scout-groups.test.ts` | 1 day |
| 8 | TBA Webhook Processing | **MEDIUM** | `src/lib/server/services/tba-webhooks.ts` | 1 day |
| 9 | Pit Scouting | **MEDIUM** | `src/lib/server/structs/scouting.ts` (PIT namespace) | 1-2 days |
| 10 | Match Scouting Extended | **MEDIUM** | `src/lib/model/scouting.ts` | 1 day |
| 11 | TBA Caching | **MEDIUM** | `src/lib/server/structs/TBA.ts` | 1 day |

**Total Estimated Effort**: 15-22 developer days

---

## 🔥 Top 5 Critical Functions to Test First

### 1️⃣ Trace Parsing and Validation
```typescript
// Location: src/lib/server/structs/scouting.ts
MatchScoutingExtended.from(scouting)
```
**Why**: Invalid trace parsing leads to data corruption. This is used everywhere.

### 2️⃣ Summary Generation
```typescript
// Location: src/lib/server/structs/FIRST.ts
FIRST.generateSummary(eventKey, year)
FIRST.getSummary(eventKey, year)
```
**Why**: Affects all strategic analysis and team evaluation.

### 3️⃣ Year-Specific Calculations
```typescript
// Location: src/lib/utils/trace/summaries/2025.ts
summary2025.computeAll(traces, matches)
```
**Why**: Incorrect point calculations mislead scouts and strategists.

### 4️⃣ TBA Event/Match/Team Retrieval
```typescript
// Location: src/lib/server/utils/tba.ts
Event.getEvent(eventKey, force, expires)
Match.getTeams(force, expires)
```
**Why**: Core data source for entire scouting system.

### 5️⃣ Strategy Lifecycle Hooks
```typescript
// Location: src/lib/server/structs/strategy.ts
Strategy.on('create', ...) // Auto-creates partners/opponents
Strategy.on('delete', ...) // Cascades deletion
```
**Why**: Data integrity for strategic planning.

---

## 🧪 Test File Mapping

| Test File to Create | Source File(s) | Priority |
|---------------------|----------------|----------|
| `scouting-data-models.test.ts` | `server/structs/scouting.ts` | CRITICAL |
| `trace-summaries-2025.test.ts` | `utils/trace/summaries/2025.ts` | CRITICAL |
| `trace-summaries-2024.test.ts` | `utils/trace/summaries/2024.ts` | CRITICAL |
| `tba-integration.test.ts` | `server/utils/tba.ts`, `utils/tba.ts` | HIGH |
| `first-summaries.test.ts` | `server/structs/FIRST.ts` | HIGH |
| `strategy-management.test.ts` | `server/structs/strategy.ts` | HIGH |
| `action-summary-generation.test.ts` | `server/utils/action-summary.ts` | HIGH |
| `tba-webhook-validation.test.ts` | `server/services/tba-webhooks.ts` | MEDIUM |
| `pit-scouting.test.ts` | `server/structs/scouting.ts` (PIT) | MEDIUM |
| `match-scouting-extended.test.ts` | `model/scouting.ts` | MEDIUM |
| `tba-caching.test.ts` | `server/structs/TBA.ts` | MEDIUM |

---

## 📝 Test Template

### Basic Unit Test Structure
```typescript
import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { DB } from '$lib/server/db';
import { Struct } from 'drizzle-struct';

describe('Feature Name', async () => {
  // Setup database
  beforeAll(async () => {
    await Struct.buildAll(DB).unwrap();
  });

  // Test happy path
  test('should handle valid input', async () => {
    const result = await functionUnderTest(validInput);
    expect(result.isOk()).toBe(true);
    expect(result.value).toEqual(expectedOutput);
  });

  // Test error path
  test('should handle invalid input', async () => {
    const result = await functionUnderTest(invalidInput);
    expect(result.isErr()).toBe(true);
  });

  // Test edge case
  test('should handle empty input', async () => {
    const result = await functionUnderTest(emptyInput);
    expect(result.isOk()).toBe(true);
    expect(result.value).toEqual([]);
  });
});
```

---

## 🎓 Common Test Patterns

### Testing Result<T> Returns
```typescript
import { Result } from 'ts-utils/check';

test('should return Ok result', async () => {
  const result = await functionReturningResult();
  expect(result.isOk()).toBe(true);
  expect(result.value).toBeDefined();
});

test('should return Err result on failure', async () => {
  const result = await functionReturningResult();
  expect(result.isErr()).toBe(true);
  expect(result.error).toBeInstanceOf(Error);
});
```

### Testing Struct Operations
```typescript
import { Scouting } from '$lib/server/structs/scouting';

test('should create and retrieve struct', async () => {
  // Create
  const created = await Scouting.MatchScouting.new({
    eventKey: '2025idbo',
    matchNumber: 1,
    team: 254,
    // ... other required fields
  });
  expect(created.isOk()).toBe(true);

  // Retrieve
  const retrieved = await Scouting.getMatchScouting({
    eventKey: '2025idbo',
    match: 1,
    team: 254,
    compLevel: 'qm'
  });
  expect(retrieved.isOk()).toBe(true);
  expect(retrieved.value).toBeDefined();
});
```

### Testing Trace Parsing
```typescript
import { Trace } from 'tatorscout/trace';

test('should parse valid trace JSON', () => {
  const traceJSON = JSON.stringify(validTraceObject);
  const result = Trace.parse(traceJSON);
  expect(result.isOk()).toBe(true);
  expect(result.value).toBeInstanceOf(Trace);
});

test('should fail on invalid trace JSON', () => {
  const result = Trace.parse('invalid json');
  expect(result.isErr()).toBe(true);
});
```

### Testing TBA Integration
```typescript
import * as TBA from '$lib/server/utils/tba';

test('should fetch event from TBA', async () => {
  const event = await TBA.Event.getEvent('2025idbo');
  expect(event.isOk()).toBe(true);
  expect(event.value.tba.key).toBe('2025idbo');
});

test('should cache TBA requests', async () => {
  // First call
  const result1 = await TBA.Event.getEvent('2025idbo');
  
  // Second call should use cache
  const result2 = await TBA.Event.getEvent('2025idbo');
  
  // Both should succeed and return same data
  expect(result1.isOk()).toBe(true);
  expect(result2.isOk()).toBe(true);
  expect(result1.value.tba.key).toBe(result2.value.tba.key);
});
```

---

## 🛠️ Setup & Configuration

### Running Tests
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

### Test Configuration
Tests are configured in `vite.config.ts`:
```typescript
test: {
  include: ['src/**/*.{test,spec}.{js,ts}'],
  watch: process.argv.includes('watch'),
  environment: 'jsdom'
}
```

### Required Test Setup
Most tests need database setup:
```typescript
import { DB } from '$lib/server/db';
import { Struct } from 'drizzle-struct';

beforeAll(async () => {
  // Build all structs (creates tables)
  await Struct.buildAll(DB).unwrap();
});
```

---

## 📚 Key Testing Resources

### Existing Test Examples
- `src/tests/tba.test.ts` - TBA integration
- `src/tests/scout-groups.test.ts` - Scout group generation
- `src/tests/action-summary.test.ts` - Action summary
- `e2e/permissions.test.ts` - Permissions testing

### Libraries Used
- **Vitest**: Test runner and assertion library
- **ts-utils/check**: Result type for error handling
- **drizzle-struct**: Database ORM
- **zod**: Schema validation
- **tatorscout**: Tator-specific utilities (trace, summaries, etc.)

### Documentation
- See `UNIT_TEST_COVERAGE_ANALYSIS.md` for complete analysis
- See `DETAILED_TEST_RECOMMENDATIONS.md` for detailed test cases
- See existing tests for patterns and examples

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't forget to build structs** before testing
   ```typescript
   await Struct.buildAll(DB).unwrap();
   ```

2. **Handle Result types properly**
   ```typescript
   const result = await func();
   expect(result.isOk()).toBe(true); // Check before accessing .value
   ```

3. **Mock external dependencies** (TBA API, Redis, etc.)
   ```typescript
   vi.mock('$lib/server/utils/tba');
   ```

4. **Test both sync and async functions** appropriately
   ```typescript
   test('async test', async () => {
     await expect(asyncFunc()).resolves.toBe(expected);
   });
   ```

5. **Clean up test data** after tests
   ```typescript
   afterAll(async () => {
     // Clean up database, close connections, etc.
   });
   ```

---

## 🚀 Getting Started

### Week 1: Critical Tests
1. Create `src/tests/scouting-data-models.test.ts`
   - Focus on `MatchScoutingExtended.from()`
   - Test trace parsing edge cases

2. Create `src/tests/trace-summaries-2025.test.ts`
   - Test all summary calculations
   - Verify point calculations match game manual

### Week 2: High Priority Tests  
3. Create `src/tests/first-summaries.test.ts`
   - Test `generateSummary()` for both years
   - Test caching logic

4. Create `src/tests/tba-integration.test.ts`
   - Test event/match/team retrieval
   - Test cache expiration

### Week 3+: Remaining Tests
5. Continue with medium-priority tests
6. Enhance existing tests where needed
7. Add integration tests for complex workflows

---

## 📈 Coverage Goals

- **Critical functions**: 100% line/branch coverage
- **High priority**: 90%+ coverage
- **Medium priority**: 80%+ coverage
- **Overall Tator code**: 75%+ coverage target

---

## 💡 Tips for Success

1. **Start small**: Begin with one function, write comprehensive tests
2. **Use fixtures**: Create reusable test data in `fixtures/` directory
3. **Test edge cases**: Empty arrays, null values, invalid JSON
4. **Document tests**: Add comments explaining what's being tested
5. **Run tests frequently**: Use watch mode during development
6. **Review existing tests**: Learn patterns from current test suite
7. **Ask for help**: Consult team when stuck

---

## 📞 Need Help?

- Review `UNIT_TEST_COVERAGE_ANALYSIS.md` for full context
- Review `DETAILED_TEST_RECOMMENDATIONS.md` for specific test cases
- Check existing tests in `src/tests/` for examples
- Ask team members familiar with specific features

---

## ✅ Checklist for New Tests

- [ ] Test file created in `src/tests/`
- [ ] Database setup in `beforeAll` if needed
- [ ] Happy path tested
- [ ] Error paths tested
- [ ] Edge cases tested (empty, null, invalid)
- [ ] Result types handled correctly
- [ ] Async operations tested properly
- [ ] Cleanup in `afterAll` if needed
- [ ] Test runs successfully with `pnpm test:unit`
- [ ] Documentation updated if needed

---

**Last Updated**: 2026-02-07  
**Version**: 1.0  
**Maintainer**: Development Team
