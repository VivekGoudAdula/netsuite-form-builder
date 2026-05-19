/** Stable vault key for a form field (netsuite_datasources.key). */
export function fieldToDatasourceKey(fieldId: string): string {
  const k = fieldId
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return k.slice(0, 64) || 'field';
}
