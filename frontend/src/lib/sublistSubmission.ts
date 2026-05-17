import type { CustomForm, Field } from '../types';
import { isHsnLineFieldId } from './netsuiteMasterData';

const ITEM_ROW_KEY = /^item_(\d+)_(.+)$/;
const EXP_ROW_KEY = /^exp_(\d+)_(.+)$/;

/**
 * Flat form keys (body + item_0_* / exp_0_*) → submission payload with lineItems[].
 * Prepares structure for future NetSuite line mapping without hardcoded field maps.
 */
export function buildSubmissionValues(
  form: CustomForm,
  flatValues: Record<string, unknown>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const lineItems: Record<string, unknown>[] = [];
  const expenseLines: Record<string, unknown>[] = [];
  const itemRows = new Map<number, Record<string, unknown>>();
  const expenseRows = new Map<number, Record<string, unknown>>();

  for (const [key, val] of Object.entries(flatValues)) {
    const itemMatch = key.match(ITEM_ROW_KEY);
    if (itemMatch) {
      const row = Number.parseInt(itemMatch[1], 10);
      const fieldId = itemMatch[2];
      if (!itemRows.has(row)) itemRows.set(row, {});
      itemRows.get(row)![fieldId] = val;
      continue;
    }
    const expMatch = key.match(EXP_ROW_KEY);
    if (expMatch) {
      const row = Number.parseInt(expMatch[1], 10);
      const fieldId = expMatch[2];
      if (!expenseRows.has(row)) expenseRows.set(row, {});
      expenseRows.get(row)![fieldId] = val;
      continue;
    }
    body[key] = val;
  }

  for (const row of [...itemRows.entries()].sort((a, b) => a[0] - b[0])) {
    if (Object.keys(row[1]).length > 0) lineItems.push(row[1]);
  }
  for (const row of [...expenseRows.entries()].sort((a, b) => a[0] - b[0])) {
    if (Object.keys(row[1]).length > 0) expenseLines.push(row[1]);
  }

  const out: Record<string, unknown> = { ...body };
  if (lineItems.length > 0) out.lineItems = lineItems;
  if (expenseLines.length > 0) out.expenseLines = expenseLines;
  return out;
}

/** Soft validation: tax code without HSN on a line item. */
export function findLineItemsMissingHsnWhenTaxSet(
  form: CustomForm,
  flatValues: Record<string, unknown>,
): { row: number; taxField: string }[] {
  const issues: { row: number; taxField: string }[] = [];
  const itemFields =
    form.tabs.find(t => t.name === 'Items')?.itemSublist ?? [];
  const hasHsnColumn = itemFields.some(f => isHsnLineFieldId(f.id));
  if (!hasHsnColumn) return issues;

  const rows = new Map<number, Record<string, unknown>>();
  for (const [key, val] of Object.entries(flatValues)) {
    const m = key.match(ITEM_ROW_KEY);
    if (!m) continue;
    const row = Number.parseInt(m[1], 10);
    if (!rows.has(row)) rows.set(row, {});
    rows.get(row)![m[2]] = val;
  }

  for (const [row, line] of rows) {
    const tax = line.taxcode ?? line.tax_code;
    const hsn = line.hsncode ?? line.custcol_hsn_code ?? line.hsn_code;
    if (tax && !hsn) {
      issues.push({ row, taxField: 'taxcode' });
    }
  }
  return issues;
}

export function itemSublistRowKey(rowIndex: number, fieldId: string): string {
  return `item_${rowIndex}_${fieldId}`;
}
