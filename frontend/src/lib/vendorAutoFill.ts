import type { Field, VendorOption } from '../types';

function fieldMatches(id: string, patterns: string[]): boolean {
  const lower = id.toLowerCase();
  return patterns.some(
    p => lower === p || lower.endsWith(`_${p}`) || lower.includes(p),
  );
}

/** When a NetSuite vendor is picked, fill related body fields if present on the form. */
export function buildVendorBodyAutoFill(
  vendor: VendorOption,
  bodyFields: Field[],
): Record<string, string> {
  const updates: Record<string, string> = {};
  const rules: { value: string; patterns: string[] }[] = [
    {
      value:
        vendor.subsidiaryId?.trim() && /^\d+$/.test(vendor.subsidiaryId.trim())
          ? vendor.subsidiaryId.trim()
          : '',
      patterns: ['subsidiary'],
    },
    { value: vendor.currency ?? '', patterns: ['currency'] },
    { value: vendor.terms ?? '', patterns: ['terms'] },
    { value: vendor.email, patterns: ['email'] },
    { value: vendor.phone, patterns: ['billphone', 'phone', 'bill_phone'] },
    { value: vendor.address, patterns: ['billaddress', 'billingaddress', 'shipaddress'] },
  ];

  for (const field of bodyFields) {
    if (field.section === 'sublist') continue;
    if (field.id.toLowerCase() === 'entity') continue;
    for (const rule of rules) {
      const v = rule.value?.trim();
      if (!v) continue;
      if (fieldMatches(field.id, rule.patterns)) {
        updates[field.id] = v;
        break;
      }
    }
  }
  return updates;
}
