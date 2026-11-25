export type Session = {
  token: string
  serverUrl: string
  endpointUrl: string
  userId: number
  projectId: number
  compositionId?: number
  expiresAt: number
}
