export class NetworkError extends Error {
  readonly name = 'NetworkError'
}

export class HttpError extends Error {
  readonly name: string = 'HttpError'
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export class TaskTokenRejectedError extends HttpError {
  readonly name: string = 'TaskTokenRejectedError'
}
