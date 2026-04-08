import test from "node:test";
import assert from "node:assert/strict";
import {
  formatChinaDateInput,
  getChinaTodayDateInput,
  getLiveDateFilter,
  matchesLiveDateFilter,
  toLiveDateParam,
} from "../lib/live-date-filter.ts";

test("getLiveDateFilter returns the UTC range for a China local day", () => {
  assert.deepEqual(getLiveDateFilter("20260403"), {
    dateKey: "20260403",
    startUtc: "2026-04-02T16:00:00.000Z",
    endUtc: "2026-04-03T16:00:00.000Z",
  });
});

test("getLiveDateFilter rejects invalid date params", () => {
  assert.equal(getLiveDateFilter("20260431"), null);
  assert.equal(getLiveDateFilter("2026-04-03"), null);
  assert.equal(getLiveDateFilter("abc"), null);
});

test("matchesLiveDateFilter uses inclusive start and exclusive end boundaries", () => {
  const dateFilter = getLiveDateFilter("20260403");

  assert.ok(dateFilter);
  assert.equal(matchesLiveDateFilter("2026-04-02T15:59:59.999Z", dateFilter), false);
  assert.equal(matchesLiveDateFilter("2026-04-02T16:00:00.000Z", dateFilter), true);
  assert.equal(matchesLiveDateFilter("2026-04-03T15:59:59.999Z", dateFilter), true);
  assert.equal(matchesLiveDateFilter("2026-04-03T16:00:00.000Z", dateFilter), false);
});

test("getChinaTodayDateInput formats today in China timezone", () => {
  const now = new Date("2026-04-07T20:30:00.000Z");

  assert.equal(getChinaTodayDateInput(now), "2026-04-08");
});

test("toLiveDateParam converts date input values to query params", () => {
  assert.equal(toLiveDateParam("2026-04-03"), "20260403");
  assert.equal(toLiveDateParam("2026-4-3"), null);
  assert.equal(toLiveDateParam(""), null);
});

test("formatChinaDateInput converts a date param to input format", () => {
  assert.equal(formatChinaDateInput("20260403"), "2026-04-03");
  assert.equal(formatChinaDateInput("20260431"), "");
});
