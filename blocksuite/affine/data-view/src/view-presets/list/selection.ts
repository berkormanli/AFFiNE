import { z } from 'zod';

export const ListViewTypeSchema = z.object({
  viewId: z.string(),
  type: z.literal('list'),
});

export const ListCellSelectionSchema = z.object({
  selectionType: z.literal('cell'),
  rowId: z.string(),
  columnId: z.string(),
  isEditing: z.boolean(),
});

const ListRowSelectionRowSchema = z.object({
  rowId: z.string(),
});

export const ListRowSelectionSchema = z.object({
  selectionType: z.literal('row'),
  rows: z.tuple([ListRowSelectionRowSchema]).rest(ListRowSelectionRowSchema),
});

export const ListViewSelectionSchema = z.union([
  ListCellSelectionSchema,
  ListRowSelectionSchema,
]);

export const ListViewSelectionWithTypeSchema = z.union([
  z.intersection(ListViewTypeSchema, ListCellSelectionSchema),
  z.intersection(ListViewTypeSchema, ListRowSelectionSchema),
]);

export type ListCellSelection = z.TypeOf<typeof ListCellSelectionSchema>;
export type ListRowSelectionRow = z.TypeOf<typeof ListRowSelectionRowSchema>;
export type ListRowSelection = z.TypeOf<typeof ListRowSelectionSchema>;
export type ListViewSelection = z.TypeOf<typeof ListViewSelectionSchema>;
export type ListViewSelectionWithType = z.TypeOf<
  typeof ListViewSelectionWithTypeSchema
>;
