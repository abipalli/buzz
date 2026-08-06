/**
 * Pure selection-initialization logic for CommunityCatalogDialog.
 *
 * Extracted so it can be tested deterministically without React rendering.
 * The component calls this inside a useEffect on every dependency change.
 */

export type CatalogSectionPreference = "agents" | "teams";

/**
 * Compute the next auto-initialized selection key.
 *
 * Rules (in priority order):
 * 1. If the user has already made an explicit selection, preserve it.
 * 2. While the preferred section is still loading, return null — do not
 *    commit a cross-section fallback that cannot be retracted when the
 *    preferred section settles.
 * 3. When the preferred section has settled nonempty, select its first item.
 * 4. When the preferred section has settled empty, fall back to the other
 *    section's first item (if any).
 * 5. Both sections settled and both empty → null.
 *
 * @param current            The current encoded selection key (null if none).
 * @param userHasSelected    True if the user clicked an item since the dialog
 *                           opened — automatic init must never overwrite this.
 * @param preferSection      The section requested at launch time.
 * @param personasLoading    Whether the personas query is still in-flight.
 * @param teamsLoading       Whether the teams query is still in-flight.
 * @param firstPersonaKey    Encoded key for the first persona, or null.
 * @param firstTeamKey       Encoded key for the first team, or null.
 */
export function nextCatalogSelection(
  current: string | null,
  userHasSelected: boolean,
  preferSection: CatalogSectionPreference,
  personasLoading: boolean,
  teamsLoading: boolean,
  firstPersonaKey: string | null,
  firstTeamKey: string | null,
): string | null {
  // Rule 1: never overwrite an explicit user selection.
  if (userHasSelected) return current;

  const preferredLoading =
    preferSection === "agents" ? personasLoading : teamsLoading;

  // Rule 2: preferred section still resolving — stay null.
  if (preferredLoading) return null;

  // Preferred section settled. Rules 3-4.
  if (preferSection === "agents") {
    return firstPersonaKey ?? firstTeamKey ?? null;
  }
  return firstTeamKey ?? firstPersonaKey ?? null;
}
