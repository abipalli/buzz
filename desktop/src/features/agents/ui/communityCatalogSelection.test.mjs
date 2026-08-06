import assert from "node:assert/strict";
import test from "node:test";

import { nextCatalogSelection } from "./communityCatalogSelection.ts";

// ── Stubs ─────────────────────────────────────────────────────────────────────

const PERSONA_KEY = "p:persona-abc";
const TEAM_KEY = "t:alice-pubkey:release";

// ── Rule 1: user-made selection is never overwritten ─────────────────────────

test("user selection is preserved while preferred section is loading", () => {
  // User clicked a team while agents were still loading.
  assert.equal(
    nextCatalogSelection(
      TEAM_KEY,
      /*userHasSelected*/ true,
      "agents",
      /*personasLoading*/ true,
      /*teamsLoading*/ false,
      PERSONA_KEY,
      TEAM_KEY,
    ),
    TEAM_KEY,
  );
});

test("user selection is preserved after all sections have settled", () => {
  assert.equal(
    nextCatalogSelection(
      TEAM_KEY,
      /*userHasSelected*/ true,
      "agents",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      PERSONA_KEY,
      TEAM_KEY,
    ),
    TEAM_KEY,
  );
});

// ── Rule 2: no auto-commit while preferred section is loading ─────────────────

test("agents launch: no selection while agents are loading, even when teams are ready", () => {
  // Thufir's race scenario — teams settle first.
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "agents",
      /*personasLoading*/ true,
      /*teamsLoading*/ false,
      null, // firstPersonaKey not yet available
      TEAM_KEY,
    ),
    null,
  );
});

test("teams launch: no selection while teams are loading, even when agents are ready", () => {
  // Symmetric race — agents settle first.
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "teams",
      /*personasLoading*/ false,
      /*teamsLoading*/ true,
      PERSONA_KEY,
      null, // firstTeamKey not yet available
    ),
    null,
  );
});

// ── Rule 3: preferred section settled nonempty → select its first item ────────

test("agents launch: selects first agent once agents settle", () => {
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "agents",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      PERSONA_KEY,
      TEAM_KEY,
    ),
    PERSONA_KEY,
  );
});

test("teams launch: selects first team once teams settle", () => {
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "teams",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      PERSONA_KEY,
      TEAM_KEY,
    ),
    TEAM_KEY,
  );
});

// ── Rule 4: preferred section settled empty → fall back to other section ──────

test("agents launch: falls back to first team when agents section is empty", () => {
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "agents",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      null, // no personas
      TEAM_KEY,
    ),
    TEAM_KEY,
  );
});

test("teams launch: falls back to first agent when teams section is empty", () => {
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "teams",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      PERSONA_KEY,
      null, // no teams
    ),
    PERSONA_KEY,
  );
});

// ── Rule 5: both settled and empty → null ────────────────────────────────────

test("both sections settled and empty yields null", () => {
  assert.equal(
    nextCatalogSelection(
      null,
      /*userHasSelected*/ false,
      "agents",
      /*personasLoading*/ false,
      /*teamsLoading*/ false,
      null,
      null,
    ),
    null,
  );
});

// ── Staggered-settlement regressions (Thufir's required scenarios) ────────────

test("agents launch staggered: teams settle first then agents settle — selects agent not team", () => {
  // Step 1: teams settle while agents still loading → auto-init stays null.
  const afterTeamsSettle = nextCatalogSelection(
    null,
    false,
    "agents",
    /*personasLoading*/ true,
    /*teamsLoading*/ false,
    null, // agents not ready
    TEAM_KEY,
  );
  assert.equal(afterTeamsSettle, null);

  // Step 2: agents now settle → selects first agent, not the team.
  const afterAgentsSettle = nextCatalogSelection(
    afterTeamsSettle,
    false,
    "agents",
    /*personasLoading*/ false,
    /*teamsLoading*/ false,
    PERSONA_KEY,
    TEAM_KEY,
  );
  assert.equal(afterAgentsSettle, PERSONA_KEY);
});

test("teams launch staggered: agents settle first then teams settle — selects team not agent", () => {
  // Step 1: agents settle while teams still loading → auto-init stays null.
  const afterAgentsSettle = nextCatalogSelection(
    null,
    false,
    "teams",
    /*personasLoading*/ false,
    /*teamsLoading*/ true,
    PERSONA_KEY,
    null, // teams not ready
  );
  assert.equal(afterAgentsSettle, null);

  // Step 2: teams now settle → selects first team, not the agent.
  const afterTeamsSettle = nextCatalogSelection(
    afterAgentsSettle,
    false,
    "teams",
    /*personasLoading*/ false,
    /*teamsLoading*/ false,
    PERSONA_KEY,
    TEAM_KEY,
  );
  assert.equal(afterTeamsSettle, TEAM_KEY);
});

test("user selects from ready section while preferred section is loading — preserved after preferred settles", () => {
  // Teams are ready; agents are loading. User clicks a team while waiting.
  // (userHasSelected = true because the user clicked)
  const afterUserClick = nextCatalogSelection(
    TEAM_KEY,
    /*userHasSelected*/ true,
    "agents",
    /*personasLoading*/ true,
    /*teamsLoading*/ false,
    null, // agents not ready yet
    TEAM_KEY,
  );
  assert.equal(afterUserClick, TEAM_KEY);

  // Agents now settle — user's team selection must survive.
  const afterAgentsSettle = nextCatalogSelection(
    TEAM_KEY,
    /*userHasSelected*/ true, // still true — user clicked
    "agents",
    /*personasLoading*/ false,
    /*teamsLoading*/ false,
    PERSONA_KEY,
    TEAM_KEY,
  );
  assert.equal(afterAgentsSettle, TEAM_KEY);
});
