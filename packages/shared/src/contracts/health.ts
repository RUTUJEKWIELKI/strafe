import { Type, type Static } from 'typebox'

export const ServiceStatusSchema = Type.Union([
  Type.Literal('available'),
  Type.Literal('disabled'),
  Type.Literal('unavailable'),
])

export const HealthResponseSchema = Type.Object(
  {
    services: Type.Object({
      database: ServiceStatusSchema,
      redis: ServiceStatusSchema,
    }),
    status: Type.Union([Type.Literal('ok'), Type.Literal('degraded')]),
    timestamp: Type.String({ format: 'date-time' }),
  },
  { $id: 'HealthResponse' },
)

export type HealthResponse = Static<typeof HealthResponseSchema>
export type ServiceStatus = Static<typeof ServiceStatusSchema>
