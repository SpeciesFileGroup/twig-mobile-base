export const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback
