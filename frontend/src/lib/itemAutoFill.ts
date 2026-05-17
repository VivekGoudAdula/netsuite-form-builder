import type { Field, ItemOption } from '../types';
import { itemSublistRowKey } from './sublistSubmission';

function fieldMatches(id: string, patterns: string[]): boolean {
  const lower = id.toLowerCase();
  return patterns.some(p => lower === p || lower.endsWith(`_${p}`) || lower.includes(p));
}

/** When a NetSuite item is picked, fill related columns on the same line row. */
export function buildItemRowAutoFill(
  item: ItemOption,
  rowFields: Field[],
  rowIndex: number,
): Record<string, string> {
  const updates: Record<string, string> = {};
  const rules: { value: string; patterns: string[] }[] = [
    { value: item.hsnCode, patterns: ['taxcode', 'hsncode', 'hsn_code', 'custcol_hsn'] },
    { value: item.gstRate, patterns: ['gstrate', 'gst_rate', 'taxrate1', 'taxrate'] },
    { value: item.department, patterns: ['department'] },
    { value: item.className, patterns: ['class'] },
    { value: item.location, patterns: ['location'] },
    { value: item.displayName, patterns: ['description'] },
  ];

  for (const field of rowFields) {
    if (field.id.toLowerCase() === 'item') continue;
    for (const rule of rules) {
      const v = rule.value?.trim();
      if (!v) continue;
      if (fieldMatches(field.id, rule.patterns)) {
        updates[itemSublistRowKey(rowIndex, field.id)] = v;
        break;
      }
    }
  }
  return updates;
}
