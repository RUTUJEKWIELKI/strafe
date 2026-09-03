export type GatewayFrame = {
  op: string
  d: Record<string, unknown>
}

export function parseGatewayFrame(
  raw: unknown,
  maximumBytes: number,
): GatewayFrame {
  const serialized = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw))
  if (serialized.byteLength > maximumBytes) throw new Error('frame too large')
  let value: unknown
  try {
    value = JSON.parse(serialized.toString())
  } catch {
    throw new Error('frame is not valid JSON')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('frame must be an object')
  }
  const frame = value as Record<string, unknown>
  if (
    typeof frame.op !== 'string' ||
    frame.op.length === 0 ||
    frame.op.length > 64
  ) {
    throw new Error('frame must contain an op')
  }
  const data = frame.d
  return {
    op: frame.op,
    d:
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {},
  }
}

export class SlidingWindowLimiter {
  readonly #timestamps: number[] = []

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  allow(now: number): boolean {
    while (
      this.#timestamps.length &&
      this.#timestamps[0]! <= now - this.windowMs
    ) {
      this.#timestamps.shift()
    }
    if (this.#timestamps.length >= this.limit) return false
    this.#timestamps.push(now)
    return true
  }
}
