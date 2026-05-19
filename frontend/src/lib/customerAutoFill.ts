import type { CustomerOption, Field } from '../types';

function fieldMatches(id: string, patterns: string[]): boolean {
  const lower = id.toLowerCase();
  return patterns.some(
    p => lower === p || lower.endsWith(`_${p}`) || lower.includes(p),
  );
}

/** When a NetSuite customer is picked, fill related body fields if present on the form. */
export function buildCustomerBodyAutoFill(
  customer: CustomerOption,
  bodyFields: Field[],
): Record<string, string> {
  const updates: Record<string, string> = {};
  const rules: { value: string; patterns: string[] }[] = [
    { value: customer.subsidiary, patterns: ['subsidiary'] },
    { value: customer.email, patterns: ['email'] },
    { value: customer.phone, patterns: ['phone', 'billphone', 'shipphone'] },
    { value: customer.address, patterns: ['billaddress', 'billingaddress'] },
    { value: customer.address, patterns: ['shipaddress', 'shippingaddress'] },
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
