import { Type, type Static } from 'typebox'

export const ErrorDetailSchema = Type.Object(
  {
    field: Type.Optional(Type.String()),
    message: Type.String(),
  },
  { $id: 'ErrorDetail' },
)

export const ErrorResponseSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.String(),
      details: Type.Optional(Type.Array(ErrorDetailSchema)),
      message: Type.String(),
      requestId: Type.String(),
    }),
  },
  { $id: 'ErrorResponse' },
)

export type ErrorDetail = Static<typeof ErrorDetailSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
