import type { CustomForm, Field } from '../types';
import { itemSublistRowKey } from './sublistSubmission';

export interface MissingFieldRef {
  fieldId: string;
  label: string;
  tabId: string;
  tabName: string;
  groupName?: string;
  section: 'body' | 'line' | 'expense';
  rowIndex?: number;
  domId: string;
}

function shouldValidateField(field: Field): boolean {
  return field.mandatory && field.visible !== false && field.displayType !== 'hidden';
}

function isValueEmpty(value: unknown, fieldType: string): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (fieldType === 'checkbox') return value !== true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function expenseRowKey(rowIndex: number, fieldId: string): string {
  return `exp_${rowIndex}_${fieldId}`;
}

export function collectMissingRequiredFields(
  form: CustomForm,
  formValues: Record<string, unknown>,
  options?: {
    itemRowIndexes?: number[];
    sortLineFields?: (fields: Field[]) => Field[];
  },
): MissingFieldRef[] {
  const missing: MissingFieldRef[] = [];
  const itemRows = options?.itemRowIndexes ?? [0];
  const sortLineFields = options?.sortLineFields ?? (fields => fields);

  for (const tab of form.tabs) {
    for (const group of tab.fieldGroups) {
      for (const field of group.fields) {
        if (!shouldValidateField(field)) continue;
        if (isValueEmpty(formValues[field.id], field.type)) {
          missing.push({
            fieldId: field.id,
            label: field.label,
            tabId: tab.id,
            tabName: tab.name,
            groupName: group.name,
            section: 'body',
            domId: `field-${field.id}`,
          });
        }
      }
    }

    const lineFields = sortLineFields(tab.itemSublist ?? []);
    for (const rowIndex of itemRows) {
      for (const field of lineFields) {
        if (!shouldValidateField(field)) continue;
        const key = itemSublistRowKey(rowIndex, field.id);
        if (isValueEmpty(formValues[key], field.type)) {
          missing.push({
            fieldId: field.id,
            label: field.label,
            tabId: tab.id,
            tabName: tab.name,
            groupName: 'Line Items',
            section: 'line',
            rowIndex,
            domId: `field-${key}`,
          });
        }
      }
    }

    for (const field of tab.expenseSublist ?? []) {
      if (!shouldValidateField(field)) continue;
      const key = expenseRowKey(0, field.id);
      if (isValueEmpty(formValues[key], field.type)) {
        missing.push({
          fieldId: field.id,
          label: field.label,
          tabId: tab.id,
          tabName: tab.name,
          groupName: 'Expenses',
          section: 'expense',
          rowIndex: 0,
          domId: `field-${key}`,
        });
      }
    }
  }

  return missing;
}

export function formatMissingFieldLabel(ref: MissingFieldRef): string {
  const location = ref.groupName ? `${ref.groupName}` : ref.tabName;
  if (ref.section === 'line' && ref.rowIndex !== undefined && ref.rowIndex > 0) {
    return `${ref.label} (Line ${ref.rowIndex + 1} · ${location})`;
  }
  if (ref.section === 'line') {
    return `${ref.label} (${location})`;
  }
  return `${ref.label} (${location})`;
}
