import { Type, type Static } from 'typebox'

export const IdSchema = Type.String({ format: 'uuid' })
export const DateTimeSchema = Type.String({ format: 'date-time' })

export const CursorPageSchema = Type.Object({
  nextCursor: Type.Union([Type.String(), Type.Null()]),
})

export type CursorPage = Static<typeof CursorPageSchema>
