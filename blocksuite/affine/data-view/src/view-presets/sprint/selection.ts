import { z } from 'zod';

export const SprintViewTypeSchema = z.object({
  viewId: z.string(),
  type: z.literal('sprint'),
});
export const SprintCellSelectionSchema = z.object({
  selectionType: z.literal('cell'),
  groupKey: z.string(),
  cardId: z.string(),
  columnId: z.string(),
  isEditing: z.boolean(),
});

const SprintCardSelectionCardSchema = z.object({
  groupKey: z.string(),
  cardId: z.string(),
});
export const SprintCardSelectionSchema = z.object({
  selectionType: z.literal('card'),
  cards: z
    .tuple([SprintCardSelectionCardSchema])
    .rest(SprintCardSelectionCardSchema),
});

export const SprintGroupSelectionSchema = z.object({
  selectionType: z.literal('group'),
  groupKeys: z.tuple([z.string()]).rest(z.string()),
});

export const SprintViewSelectionSchema = z.union([
  SprintCellSelectionSchema,
  SprintCardSelectionSchema,
  SprintGroupSelectionSchema,
]);
export const SprintViewSelectionWithTypeSchema = z.union([
  z.intersection(SprintViewTypeSchema, SprintCellSelectionSchema),
  z.intersection(SprintViewTypeSchema, SprintCardSelectionSchema),
  z.intersection(SprintViewTypeSchema, SprintGroupSelectionSchema),
]);
export type SprintCellSelection = z.TypeOf<typeof SprintCellSelectionSchema>;
export type SprintCardSelectionCard = z.TypeOf<
  typeof SprintCardSelectionCardSchema
>;
export type SprintCardSelection = z.TypeOf<typeof SprintCardSelectionSchema>;
export type SprintGroupSelection = z.TypeOf<typeof SprintGroupSelectionSchema>;
export type SprintViewSelection = z.TypeOf<typeof SprintViewSelectionSchema>;
export type SprintViewSelectionWithType = z.TypeOf<
  typeof SprintViewSelectionWithTypeSchema
>;
