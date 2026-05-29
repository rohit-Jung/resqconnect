'use client';

import { Button } from '@repo/ui/button';

import {
  CheckCircle2,
  Download,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import {
  IBulkProviderResult,
  IBulkProviderRow,
  useOrgBulkRegisterProviders,
} from '@/services/service-provider/auth.api';

const EXPECTED_COLUMNS = [
  'name',
  'email',
  'age',
  'phoneNumber',
  'primaryAddress',
  'serviceType',
  'password',
] as const;

const SAMPLE_DATA: IBulkProviderRow[] = [
  {
    name: 'Ram Shrestha',
    email: 'ram.shrestha@example.com',
    age: 28,
    phoneNumber: 9811111111,
    primaryAddress: 'Kathmandu, Nepal',
    serviceType: 'ambulance',
    password: 'SecurePass@123',
  },
  {
    name: 'Sita Tamang',
    email: 'sita.tamang@example.com',
    age: 32,
    phoneNumber: 9822222222,
    primaryAddress: 'Lalitpur, Nepal',
    serviceType: 'ambulance',
    password: 'SecurePass@456',
  },
];

function downloadSampleXlsx() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_DATA);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ServiceProviders');
  const notesData = [
    { Field: 'age', AllowedValues: 'Integer, minimum 18' },
    {
      Field: 'phoneNumber',
      AllowedValues: 'Integer phone number (no spaces or dashes)',
    },
    {
      Field: 'serviceType',
      AllowedValues:
        'ambulance | police | fire_truck | rescue_team (must match org category)',
    },
    {
      Field: 'password',
      AllowedValues:
        'Min 8 chars, include uppercase, lowercase, number, special char',
    },
  ];
  const wsNotes = XLSX.utils.json_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Field Notes');
  XLSX.writeFile(wb, 'service_providers_template.xlsx');
}

interface Props {
  onClose: () => void;
}

export function BulkUploadProvidersModal({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<IBulkProviderRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [results, setResults] = useState<IBulkProviderResult[] | null>(null);
  const bulkMutation = useOrgBulkRegisterProviders();

  const handleFile = (file: File) => {
    setParseError(null);
    setResults(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
        });
        const parsed: IBulkProviderRow[] = json.map((r, i) => {
          for (const col of EXPECTED_COLUMNS) {
            if (!(col in r))
              throw new Error(`Row ${i + 1}: missing column "${col}"`);
          }
          return {
            name: String(r.name),
            email: String(r.email),
            age: Number(r.age),
            phoneNumber: Number(r.phoneNumber),
            primaryAddress: String(r.primaryAddress),
            serviceType: String(
              r.serviceType
            ) as IBulkProviderRow['serviceType'],
            password: String(r.password),
          };
        });
        setRows(parsed);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : 'Failed to parse file'
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!rows.length) return;
    try {
      const res = await bulkMutation.mutateAsync({ rows });
      const r = res.data.data;
      setResults(r.results);
      if (r.failed === 0)
        toast.success(`All ${r.created} providers registered`);
      else toast.warning(`${r.created} registered, ${r.failed} failed`);
    } catch {
      toast.error('Bulk upload failed');
    }
  };

  const created = results?.filter(r => r.status === 'created').length ?? 0;
  const failed = results?.filter(r => r.status === 'failed').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Bulk Upload Service Providers
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload an Excel file to register multiple responders at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">1. Download the template</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={downloadSampleXlsx}
            >
              <Download className="h-4 w-4" />
              service_providers_template.xlsx
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              serviceType must match your organization category. Do not rename
              columns.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">2. Upload filled file</p>
            <button
              className="w-full border border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to select .xlsx or .csv file
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            {parseError && (
              <p className="text-xs text-red-600 mt-1">{parseError}</p>
            )}
          </div>

          {rows.length > 0 && !results && (
            <div>
              <p className="text-sm font-medium mb-2">
                Preview ({rows.length} rows)
              </p>
              <div className="overflow-x-auto border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {EXPECTED_COLUMNS.map(c => (
                        <th
                          key={c}
                          className="px-3 py-2 text-left font-mono font-medium text-muted-foreground"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2">{r.email}</td>
                        <td className="px-3 py-2">{r.age}</td>
                        <td className="px-3 py-2">{r.phoneNumber}</td>
                        <td className="px-3 py-2 max-w-[120px] truncate">
                          {r.primaryAddress}
                        </td>
                        <td className="px-3 py-2">{r.serviceType}</td>
                        <td className="px-3 py-2">{'•'.repeat(8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Showing 10 of {rows.length} rows
                </p>
              )}
            </div>
          )}

          {results && (
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> {created} registered
                </span>
                {failed > 0 && (
                  <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> {failed} failed
                  </span>
                )}
              </div>
              <div className="overflow-x-auto border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono font-medium text-muted-foreground">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left font-mono font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left font-mono font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-mono font-medium text-muted-foreground">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.row} className="border-t border-border">
                        <td className="px-3 py-2">{r.row}</td>
                        <td className="px-3 py-2">{r.email}</td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              r.status === 'created'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-red-600">
                          {r.error ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button
              disabled={rows.length === 0 || bulkMutation.isPending}
              onClick={handleSubmit}
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                `Register ${rows.length} Providers`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
