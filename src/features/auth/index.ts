/**
 * Connection to TaxonWorks: a Task (APP_CONFIG.taskName) shows a QR code that the app scans and
 * swaps for a short-lived session token.
 */
export { SessionSection } from './components/SessionSection'
export { ConnectScreen } from './screens/ConnectScreen'
export { endSession, getSession, useSession } from './store'
export type { Session } from './types'
export type { TaskQr } from './utils/taskQr'
