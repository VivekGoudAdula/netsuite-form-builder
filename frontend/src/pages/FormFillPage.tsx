import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button, Label } from '../components/ui/Base';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/HorizontalTabs';
import { FieldControl } from '../components/ui/FieldControl';
import { CustomForm } from '../types';
import {
  FileCheck,
  ArrowLeft,
  Send,
  Save,
  Info,
  ShieldCheck,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { sortItemReceiptSublistFields, sortItemSublistFields } from '../lib/netsuiteMasterData';
import { buildItemRowAutoFill } from '../lib/itemAutoFill';
import { buildVendorBodyAutoFill } from '../lib/vendorAutoFill';
import { buildCustomerBodyAutoFill } from '../lib/customerAutoFill';
import type { CustomerOption, ItemOption, VendorOption } from '../types';
import {
  buildSubmissionValues,
  findLineItemsMissingHsnWhenTaxSet,
  itemSublistRowKey,
} from '../lib/sublistSubmission';
import {
  collectMissingRequiredFields,
  collectVendorBillSyncIssues,
  formatMissingFieldLabel,
  type MissingFieldRef,
} from '../lib/formValidation';
import { transactionTypeToSlug, TRANSACTION_REGISTRY } from '../lib/transactionRegistry';
import { exchangeRateForCurrency } from '../lib/currencyExchange';
import { resolveSubsidiaryInternalId } from '../lib/subsidiaryResolve';
import api from '../api/client';

export default function FormFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchMyFormDetails, submitForm, isLoading, currencies, fetchCurrencies } = useStore();

  const [form, setForm] = React.useState<CustomForm | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [missingFields, setMissingFields] = React.useState<MissingFieldRef[]>([]);
  const [highlightedFieldId, setHighlightedFieldId] = React.useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = React.useState<any | null>(null);
  const [itemRows, setItemRows] = React.useState<number[]>([0]);

  const sortLineFields = React.useCallback(
    (fields: CustomForm['tabs'][0]['itemSublist']) =>
      form?.transactionType === 'item_receipt' || form?.transactionType === 'vendor_bill'
        ? sortItemReceiptSublistFields(fields ?? [])
        : sortItemSublistFields(fields ?? []),
    [form?.transactionType],
  );

  React.useEffect(() => {
    if (id) {
      fetchMyFormDetails(id).then(data => {
        if (data) setForm(data);
      });
    }
  }, [id, fetchMyFormDetails]);

  React.useEffect(() => {
    if (form && form.tabs.length > 0) {
      setActiveTab(form.tabs[0].id);

      // Initialize default checkbox values
      const initialValues: Record<string, any> = {};
      form.tabs.forEach(tab => {
        tab.fieldGroups.forEach(group => {
          group.fields.forEach(field => {
            if (field.checkBoxDefault === 'checked') initialValues[field.id] = true;
          });
        });
      });
      setFormValues(initialValues);
    }
  }, [form]);

  React.useEffect(() => {
    if (form?.transactionType === 'item_receipt' || form?.transactionType === 'vendor_bill') {
      setItemRows([0]);
    }
  }, [form?.transactionType]);

  React.useEffect(() => {
    if (form?.transactionType === 'vendor_bill') {
      void fetchCurrencies();
    }
  }, [form?.transactionType, fetchCurrencies]);

  const focusMissingField = React.useCallback((ref: MissingFieldRef) => {
    setActiveTab(ref.tabId);
    setHighlightedFieldId(ref.domId);
    window.setTimeout(() => {
      const el = document.getElementById(ref.domId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = el?.querySelector<HTMLElement>(
        'input, select, textarea, button[role="combobox"]',
      );
      focusable?.focus();
    }, 120);
  }, []);

  if (!form && isLoading) return (
    <CustomerLayout>
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-ns-blue/30 border-t-ns-blue rounded-full animate-spin" />
      </div>
    </CustomerLayout>
  );

  if (!form) return <div>Form not found or access denied.</div>;

  if (submissionResult) {
    const status = submissionResult.status;
    const currentLevel = submissionResult.currentLevel || 1;
    const transType = transactionTypeToSlug(form.transactionType);
    const transactionLabel = TRANSACTION_REGISTRY[form.transactionType]?.name || transType;
    const isDirectSync = submissionResult.directSync === true;
    const syncSucceeded = status === 'submitted' || status === 'SYNCED_TO_NETSUITE';
    const syncFailed = status === 'failed' || status === 'NETSUITE_SYNC_FAILED';

    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl",
            syncFailed ? "bg-status-rejected-bg text-status-rejected" : "bg-status-approved-bg text-status-approved",
          )}>
            {syncFailed ? <AlertCircle size={40} /> : <ShieldCheck size={40} />}
          </div>
          <h2 className="text-3xl font-bold text-ns-navy tracking-tight">
            {isDirectSync
              ? syncFailed
                ? 'Submission Saved — NetSuite Sync Failed'
                : 'Submitted to NetSuite'
              : 'Submitted'}
          </h2>
          <div className="mt-6 p-8 bg-white border border-ns-border rounded-ns-md shadow-sm max-w-sm w-full">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-ns-border">
              <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">Submission status</span>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-ns-md border",
                syncFailed
                  ? "text-status-rejected bg-status-rejected-bg border-red-200"
                  : "text-ns-blue bg-ns-blue/5 border-ns-blue/10",
              )}>
                {isDirectSync
                  ? syncSucceeded
                    ? 'Synced to NetSuite'
                    : 'Sync Failed'
                  : `${status} Approval`}
              </span>
            </div>
            {isDirectSync ? (
              <>
                {submissionResult.poId && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">NetSuite PO ID</span>
                    <span className="text-xs font-bold text-ns-navy uppercase tracking-wider">{submissionResult.poId}</span>
                  </div>
                )}
                {submissionResult.billId && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">NetSuite Bill ID</span>
                    <span className="text-xs font-bold text-ns-navy uppercase tracking-wider">{submissionResult.billId}</span>
                  </div>
                )}
                {submissionResult.documentNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">Document #</span>
                    <span className="text-xs font-bold text-ns-navy uppercase tracking-wider">{submissionResult.documentNumber}</span>
                  </div>
                )}
                {submissionResult.netsuiteSyncError && (
                  <p className="text-[11px] text-status-rejected font-semibold mt-4 text-left">{submissionResult.netsuiteSyncError}</p>
                )}
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">Approval step</span>
                <span className="text-xs font-bold text-ns-navy uppercase tracking-wider">Level {currentLevel}</span>
              </div>
            )}
          </div>
          <p className="text-ns-text-muted mt-8 max-w-md text-sm font-medium">
            {isDirectSync
              ? syncFailed
                ? <>Your submission for <span className="text-ns-navy font-bold">'{form.name}'</span> was saved, but posting to NetSuite failed. Contact your administrator or retry from the submissions list.</>
                : <>Your submission for <span className="text-ns-navy font-bold">'{form.name}'</span> was sent directly to NetSuite — no approval workflow is configured for this company.</>
              : <>Your submission for <span className="text-ns-navy font-bold">'{form.name}'</span> has been sent for approval.</>}
          </p>
          <div className="flex gap-4 mt-10">
            <Button onClick={() => navigate(`/user/${transType}`)} className="gap-2 h-11 px-8 font-bold text-xs uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to {transactionLabel}
            </Button>
            <Button variant="secondary" onClick={() => {
              setSubmissionResult(null);
              setFormValues({});
            }} className="gap-2 h-11 px-8 font-bold text-xs uppercase tracking-widest">
              <PlusCircle size={16} /> Fill Another
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const handleInputChange = (
    fieldId: string,
    value: any,
    party?: VendorOption | CustomerOption,
  ) => {
    if (
      form?.transactionType === 'item_receipt' &&
      fieldId.toLowerCase() === 'createdfrom' &&
      value
    ) {
      void (async () => {
        try {
          const response = await api.get(`purchase-orders/${value}`);
          const po = response.data || {};
          const body = po.bodyFields || {};
          const lines = Array.isArray(po.lineItems) ? po.lineItems : [];
          setFormValues(prev => {
            const next: Record<string, any> = {
              ...prev,
              [fieldId]: value,
              entity: body.entity || prev.entity,
              subsidiary: body.subsidiary || prev.subsidiary,
              currency: body.currency || prev.currency,
              custbody_rg_po_number: body.custbody_rg_po_number || prev.custbody_rg_po_number,
              custbody_podate: body.custbody_podate || prev.custbody_podate,
            };
            lines.forEach((line: Record<string, any>, index: number) => {
              next[itemSublistRowKey(index, 'receive')] = true;
              next[itemSublistRowKey(index, 'item')] = line.item;
              next[itemSublistRowKey(index, 'quantity')] = line.quantity;
              next[itemSublistRowKey(index, 'rate')] = line.rate;
              next[itemSublistRowKey(index, 'amount')] = line.amount;
              next[itemSublistRowKey(index, 'location')] = line.location;
              next[itemSublistRowKey(index, 'department')] = line.department;
              next[itemSublistRowKey(index, 'class')] = line.class;
              next[itemSublistRowKey(index, 'description')] = line.description;
              next[itemSublistRowKey(index, 'poLineItem')] = line.poLineItem ?? `${index + 1}`;
            });
            return next;
          });
          setItemRows(lines.length > 0 ? lines.map((_: any, idx: number) => idx) : [0]);
        } catch {
          setFormValues(prev => ({ ...prev, [fieldId]: value }));
        }
      })();
      return;
    }
    if (fieldId.toLowerCase() === 'entity' && party && form) {
      void (async () => {
        const bodyFields = form.tabs.flatMap(t =>
          t.fieldGroups.flatMap(g => g.fields),
        );
        const isVendor = 'vendorCode' in party;
        const updates = isVendor
          ? buildVendorBodyAutoFill(party as VendorOption, bodyFields)
          : buildCustomerBodyAutoFill(party as CustomerOption, bodyFields);

        if (isVendor) {
          const vendor = party as VendorOption;
          const currentSub = updates.subsidiary;
          const needsResolve =
            !currentSub ||
            !/^\d+$/.test(currentSub) ||
            (!currentSub && Boolean(vendor.subsidiary || vendor.subsidiaryId));
          if (needsResolve && (vendor.subsidiary || vendor.subsidiaryId)) {
            try {
              const response = await api.get('subsidiaries/');
              const rows = Array.isArray(response.data) ? response.data : [];
              const resolved = resolveSubsidiaryInternalId(
                vendor.subsidiaryId || vendor.subsidiary || currentSub || '',
                rows,
              );
              if (resolved) {
                updates.subsidiary = resolved;
              } else {
                delete updates.subsidiary;
              }
            } catch {
              delete updates.subsidiary;
            }
          }
        }

        setFormValues(prev => {
          const next = { ...prev, [fieldId]: value, ...updates };
          if (isVendor && updates.currency && form.transactionType === 'vendor_bill') {
            next.exchangerate = exchangeRateForCurrency(updates.currency, currencies);
          }
          return next;
        });
      })();
      return;
    }
    if (fieldId.toLowerCase() === 'currency' && form?.transactionType === 'vendor_bill') {
      const rate = exchangeRateForCurrency(String(value ?? ''), currencies);
      setFormValues(prev => ({ ...prev, [fieldId]: value, exchangerate: rate }));
      return;
    }
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    setMissingFields(prev => prev.filter(f => f.domId !== `field-${fieldId}`));
    if (highlightedFieldId === `field-${fieldId}`) setHighlightedFieldId(null);
  };

  const handleItemSublistChange = (
    tabItemSublist: typeof form.tabs[0]['itemSublist'],
    rowIndex: number,
    fieldId: string,
    value: any,
    item?: ItemOption,
  ) => {
    const key = itemSublistRowKey(rowIndex, fieldId);
    if (fieldId.toLowerCase() === 'item' && item) {
      setFormValues(prev => {
        const next = { ...prev, [key]: value };
        const updates = buildItemRowAutoFill(item, tabItemSublist || [], rowIndex);
        return { ...next, ...updates };
      });
      return;
    }
    if (
      form?.transactionType === 'vendor_bill' &&
      (fieldId.toLowerCase() === 'quantity' || fieldId.toLowerCase() === 'rate')
    ) {
      setFormValues(prev => {
        const next = { ...prev, [key]: value };
        const qty = Number.parseFloat(String(next[itemSublistRowKey(rowIndex, 'quantity')] ?? ''));
        const rate = Number.parseFloat(String(next[itemSublistRowKey(rowIndex, 'rate')] ?? ''));
        if (Number.isFinite(qty) && Number.isFinite(rate)) {
          next[itemSublistRowKey(rowIndex, 'amount')] = String(
            Math.round(qty * rate * 100) / 100,
          );
        }
        return next;
      });
      return;
    }
    handleInputChange(key, value);
    setMissingFields(prev => prev.filter(f => f.domId !== `field-${key}`));
    if (highlightedFieldId === `field-${key}`) setHighlightedFieldId(null);
  };

  const handleSubmit = async () => {
    const missing = collectMissingRequiredFields(form, formValues, {
      itemRowIndexes: itemRows,
      sortLineFields,
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      setSubmitError(null);
      focusMissingField(missing[0]);
      return;
    }

    if (form.transactionType === 'vendor_bill') {
      const syncIssues = collectVendorBillSyncIssues(form, formValues, {
        itemRowIndexes: itemRows,
      });
      if (syncIssues.length > 0) {
        setMissingFields(syncIssues);
        setSubmitError(null);
        focusMissingField(syncIssues[0]);
        return;
      }
    }

    setMissingFields([]);
    setHighlightedFieldId(null);

    const hsnWarnings = findLineItemsMissingHsnWhenTaxSet(form, formValues);
    if (hsnWarnings.length > 0) {
      const ok = window.confirm(
        'A Tax Code is set on a line item without an HSN Code. HSN is recommended for GST compliance. Submit anyway?',
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildSubmissionValues(form, formValues);
      const result = await submitForm(form.id, payload);
      setSubmissionResult(result);
      setIsSubmitting(false);
      // Wait a moment to show success or just stay on page if result is set
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <button
              onClick={() => {
                navigate(`/user/${transactionTypeToSlug(form.transactionType)}`);
              }}
              className="flex items-center gap-2 text-[10px] font-bold text-ns-text-muted hover:text-ns-blue transition-colors uppercase tracking-widest mb-4"
            >
              <ArrowLeft size={14} /> Back to {TRANSACTION_REGISTRY[form.transactionType]?.name || 'transactions'}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ns-blue/10 rounded-ns-md flex items-center justify-center text-ns-blue">
                <FileCheck size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ns-navy">{form.name}</h1>
                <p className="text-xs text-ns-text-muted font-medium mt-0.5 uppercase tracking-wider">
                  Reference: {form.id.substring(0, 8)} • Created from: {form.source === 'template' ? 'template' : 'blank'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2 h-10 px-6 font-bold text-xs uppercase tracking-widest">
              <Save size={16} /> Save Progress
            </Button>
            <Button
              onClick={handleSubmit}
              className="gap-2 h-10 px-8 font-bold text-xs uppercase tracking-widest bg-ns-blue border-b-4 border-b-ns-blue-dark hover:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-ns-blue/20"
              disabled={isSubmitting}
            >
              <Send size={16} /> {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </div>

        {missingFields.length > 0 && (
          <div className="bg-status-rejected-bg p-4 rounded-ns-md border border-red-200 flex gap-4 items-start">
            <AlertCircle className="text-status-rejected shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-900 font-bold">
                Please complete {missingFields.length} required field{missingFields.length === 1 ? '' : 's'} before submitting:
              </p>
              <ul className="mt-2 space-y-1">
                {missingFields.map(ref => (
                  <li key={ref.domId}>
                    <button
                      type="button"
                      onClick={() => focusMissingField(ref)}
                      className="text-xs text-red-800 font-semibold underline underline-offset-2 hover:text-red-950 text-left"
                    >
                      {formatMissingFieldLabel(ref)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {submitError && (
          <div className="bg-status-rejected-bg p-4 rounded-ns-md border border-red-200 flex gap-4 items-center">
            <AlertCircle className="text-status-rejected shrink-0" size={20} />
            <p className="text-xs text-red-900 font-bold">{submitError}</p>
          </div>
        )}

        {/* Security banner */}
        <div className="bg-ns-blue-soft p-4 rounded-ns-card border border-ns-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-ns-blue" />
            <div>
              <p className="text-xs font-semibold text-ns-text">Form entry</p>
              <p className="text-xs text-ns-text-muted mt-0.5">Your entries are recorded for compliance. Ensure all data matches official records.</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-white border border-ns-border rounded-ns-md text-[10px] font-mono text-ns-text-muted">
            SSL: AES-256
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-ns-md border border-ns-border ns-panel-shadow min-h-[500px] flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-8 bg-ns-gray-bg border-b">
              <TabsList className="bg-transparent border-none py-4">
                {form.tabs.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent rounded-ns-md font-bold text-xs uppercase tracking-wider px-6 h-10 transition-all"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 p-8 overflow-auto custom-scrollbar">
              {form.tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-12">

                  {/* Body field groups */}
                  {tab.fieldGroups.map(group => (
                    <div key={group.id} className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-ns-blue rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">{group.name}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.fields.map(field => (
                          <div
                            key={field.id}
                            id={`field-${field.id}`}
                            className={cn(
                              "space-y-1.5 rounded-ns-md transition-shadow",
                              (field.type === 'textarea' || field.type === 'address' || field.type === 'summary')
                              && "md:col-span-2 lg:col-span-3",
                              missingFields.some(f => f.domId === `field-${field.id}`) &&
                                "ring-2 ring-red-400 ring-offset-2 bg-status-rejected-bg/40 p-2 -m-2",
                              highlightedFieldId === `field-${field.id}` &&
                                "ring-2 ring-red-500 ring-offset-2 bg-status-rejected-bg/60 p-2 -m-2",
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <Label mandatory={field.mandatory} className="text-[11px] font-bold uppercase tracking-wide text-ns-navy/70">
                                {field.label}
                              </Label>
                              {field.helpText && (
                                <Info size={12} className="text-ns-text-muted opacity-40 hover:opacity-100 cursor-help" title={field.helpText} />
                              )}
                            </div>
                            <FieldControl
                              fieldId={field.id}
                              fieldType={field.type}
                              value={formValues[field.id]}
                              onChange={val => handleInputChange(field.id, val)}
                              onVendorMasterSelect={
                                field.id.toLowerCase() === 'entity' &&
                                field.label.trim().toLowerCase() === 'vendor'
                                  ? vendor =>
                                      handleInputChange(field.id, vendor.internalId, vendor)
                                  : undefined
                              }
                              onCustomerMasterSelect={
                                field.id.toLowerCase() === 'entity' &&
                                field.label.trim().toLowerCase() === 'customer'
                                  ? customer =>
                                      handleInputChange(field.id, customer.internalId, customer)
                                  : undefined
                              }
                              disabled={field.displayType === 'disabled'}
                              defaultValue={field.defaultValue}
                              checkBoxDefault={field.checkBoxDefault}
                              label={field.label}
                              dataSource={field.dataSource}
                              preview={false}
                            />
                          </div>
                        ))}
                        {group.fields.length === 0 && (
                          <div className="col-span-full py-8 text-center bg-ns-page-bg border border-dashed rounded-ns-md border-ns-border">
                            <p className="text-xs text-ns-text-muted italic">No fields configured for this section.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Line Items sublist */}
                  {tab.itemSublist && tab.itemSublist.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-purple-500 rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">Line Items</h3>
                      </div>
                      <div className="overflow-x-auto border border-ns-border rounded-ns-md">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-ns-gray-bg border-b border-ns-border">
                              {(form.transactionType === 'item_receipt' || form.transactionType === 'vendor_bill') && (
                                <th className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider whitespace-nowrap">
                                  Receive
                                </th>
                              )}
                              {sortLineFields(tab.itemSublist).map(field => (
                                <th key={field.id} className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider whitespace-nowrap">
                                  {field.label}{field.mandatory && <span className="text-red-500 ml-1">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-ns-border">
                              {(form.transactionType === 'item_receipt' || form.transactionType === 'vendor_bill') && (
                                <td className="px-2 py-2 align-top min-w-[80px]">
                                  <FieldControl
                                    fieldId="receive"
                                    fieldType="checkbox"
                                    value={formValues[itemSublistRowKey(0, 'receive')]}
                                    onChange={val =>
                                      handleItemSublistChange(tab.itemSublist, 0, 'receive', val)
                                    }
                                    label="Receive"
                                    preview={false}
                                  />
                                </td>
                              )}
                              {sortLineFields(tab.itemSublist).map(field => {
                                const lineDomId = `field-${itemSublistRowKey(0, field.id)}`;
                                return (
                                <td
                                  key={field.id}
                                  id={lineDomId}
                                  className={cn(
                                    'px-2 py-2 align-top transition-shadow',
                                    field.dataSource?.type === 'netsuite_hsn' ||
                                    field.dataSource?.type === 'netsuite_item_live'
                                      ? 'min-w-[280px]'
                                      : 'min-w-[120px]',
                                    missingFields.some(f => f.domId === lineDomId) && 'bg-status-rejected-bg ring-2 ring-inset ring-red-300',
                                    highlightedFieldId === lineDomId && 'bg-status-rejected-bg ring-2 ring-inset ring-red-500',
                                  )}
                                >
                                  <FieldControl
                                    fieldId={field.id}
                                    fieldType={field.type}
                                    value={formValues[itemSublistRowKey(0, field.id)]}
                                    onChange={val =>
                                      handleItemSublistChange(
                                        tab.itemSublist,
                                        0,
                                        field.id,
                                        val,
                                      )
                                    }
                                    onItemMasterSelect={
                                      field.id.toLowerCase() === 'item'
                                        ? item =>
                                            handleItemSublistChange(
                                              tab.itemSublist,
                                              0,
                                              field.id,
                                              item.internalId,
                                              item,
                                            )
                                        : undefined
                                    }
                                    label={field.label}
                                    dataSource={field.dataSource}
                                    preview={false}
                                  />
                                </td>
                              );
                              })}
                            </tr>
                            {(form.transactionType === 'item_receipt' ||
                              form.transactionType === 'vendor_bill') &&
                              itemRows.slice(1).map((rowIndex) => (
                              <tr key={`row_${rowIndex}`} className="border-b border-ns-border">
                                <td className="px-2 py-2 align-top min-w-[80px]">
                                  <FieldControl
                                    fieldId="receive"
                                    fieldType="checkbox"
                                    value={formValues[itemSublistRowKey(rowIndex, 'receive')]}
                                    onChange={val =>
                                      handleItemSublistChange(tab.itemSublist, rowIndex, 'receive', val)
                                    }
                                    label="Receive"
                                    preview={false}
                                  />
                                </td>
                                {sortLineFields(tab.itemSublist).map(field => {
                                  const lineDomId = `field-${itemSublistRowKey(rowIndex, field.id)}`;
                                  return (
                                  <td
                                    key={`${rowIndex}_${field.id}`}
                                    id={lineDomId}
                                    className={cn(
                                      'px-2 py-2 align-top min-w-[120px] transition-shadow',
                                      missingFields.some(f => f.domId === lineDomId) && 'bg-status-rejected-bg ring-2 ring-inset ring-red-300',
                                      highlightedFieldId === lineDomId && 'bg-status-rejected-bg ring-2 ring-inset ring-red-500',
                                    )}
                                  >
                                    <FieldControl
                                      fieldId={field.id}
                                      fieldType={field.type}
                                      value={formValues[itemSublistRowKey(rowIndex, field.id)]}
                                      onChange={val => handleItemSublistChange(tab.itemSublist, rowIndex, field.id, val)}
                                      onItemMasterSelect={
                                        field.id.toLowerCase() === 'item'
                                          ? item =>
                                              handleItemSublistChange(
                                                tab.itemSublist,
                                                rowIndex,
                                                field.id,
                                                item.internalId,
                                                item,
                                              )
                                          : undefined
                                      }
                                      label={field.label}
                                      dataSource={field.dataSource}
                                      preview={false}
                                    />
                                  </td>
                                );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(form.transactionType === 'item_receipt' ||
                        form.transactionType === 'vendor_bill') && (
                        <div className="flex justify-end">
                          <Button
                            variant="secondary"
                            className="mt-3"
                            onClick={() =>
                              setItemRows(prev => [...prev, (prev[prev.length - 1] ?? -1) + 1])
                            }
                          >
                            Add Line
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expenses sublist */}
                  {tab.expenseSublist && tab.expenseSublist.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-ns-border pb-3">
                        <div className="w-1 h-3 bg-status-pending-bg0 rounded-full" />
                        <h3 className="text-sm font-bold text-ns-navy uppercase tracking-[0.2em]">Expenses</h3>
                      </div>
                      <div className="overflow-x-auto border border-ns-border rounded-ns-md">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-ns-gray-bg border-b border-ns-border">
                              {tab.expenseSublist.map(field => (
                                <th key={field.id} className="px-3 py-2 text-[10px] font-bold text-ns-text-muted uppercase tracking-wider whitespace-nowrap">
                                  {field.label}{field.mandatory && <span className="text-red-500 ml-1">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-ns-border">
                              {tab.expenseSublist.map(field => {
                                const expenseDomId = `field-exp_0_${field.id}`;
                                return (
                                <td
                                  key={field.id}
                                  id={expenseDomId}
                                  className={cn(
                                    'px-2 py-2 align-top transition-shadow',
                                    field.id.toLowerCase() === 'customer_expense' ||
                                    field.dataSource?.type === 'netsuite_customer_live'
                                      ? 'min-w-[280px]'
                                      : 'min-w-[120px]',
                                    missingFields.some(f => f.domId === expenseDomId) && 'bg-status-rejected-bg ring-2 ring-inset ring-red-300',
                                    highlightedFieldId === expenseDomId && 'bg-status-rejected-bg ring-2 ring-inset ring-red-500',
                                  )}
                                >
                                  <FieldControl
                                    fieldId={field.id}
                                    fieldType={field.type}
                                    value={formValues[`exp_0_${field.id}`]}
                                    onChange={val => handleInputChange(`exp_0_${field.id}`, val)}
                                    onCustomerMasterSelect={
                                      field.id.toLowerCase() === 'customer_expense' ||
                                      field.dataSource?.type === 'netsuite_customer_live'
                                        ? customer =>
                                            handleInputChange(
                                              `exp_0_${field.id}`,
                                              customer.internalId,
                                              customer,
                                            )
                                        : undefined
                                    }
                                    label={field.label}
                                    dataSource={field.dataSource}
                                    preview={false}
                                  />
                                </td>
                              );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        {/* Compliance footer */}
        <div className="p-4 bg-status-pending-bg border border-amber-200 rounded-ns-md flex gap-4 items-center">
          <AlertCircle className="text-status-pending shrink-0" size={20} />
          <p className="text-[11px] text-amber-900 leading-relaxed font-semibold italic">
            After you submit, changes may require approval from your administrator.
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
