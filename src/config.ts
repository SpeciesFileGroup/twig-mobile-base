import Constants from 'expo-constants'

/**
 * What makes this app itself (the rest of the template is shared by every TaxonWorks mobile app).
 * The app's name, scheme and bundle identifiers are in app.json.
 */
export const APP_CONFIG = {
  /** `name` from app.json (the name under the app icon), shown at the bottom of Settings */
  displayName: Constants.expoConfig?.name,
  /** The TaxonWorks task whose QR code opens a session (its name in the TaxonWorks Tasks menu) */
  taskName: 'your TaxonWorks task',
  /** SQLite file of the app's local data (never change it once the app is released) */
  databaseName: 'app.db',
} as const
