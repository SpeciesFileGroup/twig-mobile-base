import { getSettings } from '@/features/settings'
import { HttpError, NetworkError, TaskTokenRejectedError, TaskTokenClient } from '@/shared/api'
import { messageOf } from '@/shared/utils/errors'

import { startSession } from '../store'
import type { Session } from '../types'
import { taskEndpointUrl, type TaskQr } from '../utils/taskQr'

export class ConnectError extends Error {
  readonly name = 'ConnectError'
}

const hostOf = (url: string) => url.replace(/^https?:\/\//i, '')

export async function connectWithQr(qr: TaskQr, fetchImpl?: typeof fetch): Promise<Session> {
  const { serverUrl } = getSettings()
  if (!serverUrl) throw new ConnectError('Set your TaxonWorks server in Settings first.')
  const endpointUrl = taskEndpointUrl(serverUrl, qr.endpoint)
  if (!endpointUrl) throw new ConnectError('This QR code is not a TaxonWorks mobile session.')

  const ids = {
    userId: qr.userId,
    projectId: qr.projectId,
    compositionId: qr.compositionId,
  }

  const client = new TaskTokenClient({ endpointUrl, ids, fetchImpl })

  let activated

  try {
    activated = await client.activate(qr.pendingToken)
  } catch (e) {
    throw new ConnectError(connectErrorMessage(e, serverUrl))
  }

  const session: Session = {
    token: activated.token,
    serverUrl,
    endpointUrl,
    ...ids,
    expiresAt: activated.expiresAt,
  }

  startSession(session)

  return session
}

function connectErrorMessage(e: unknown, serverUrl: string): string {
  if (e instanceof TaskTokenRejectedError)
    return `${hostOf(serverUrl)} did not accept this QR code: it expired, was already used, or is from another server. Show a new QR code in TaxonWorks.`
  if (e instanceof NetworkError) return `${hostOf(serverUrl)} is not reachable. Check your connection.`
  if (e instanceof HttpError && e.status === 404)
    return `${hostOf(serverUrl)} does not support the mobile app yet.`
  return messageOf(e, 'Could not connect.')
}
