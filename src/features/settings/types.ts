/**
 * Persisted preferences. `serverUrl` is the template's; the app adds its own fields below (and their
 * defaults in DEFAULT_SETTINGS). Never store secrets here: tokens stay in memory.
 */
export type Settings = {
  /** Normalized TaxonWorks server URL, e.g. https://sfg.taxonworks.org. Null until configured. */
  serverUrl: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  serverUrl: null,
}
