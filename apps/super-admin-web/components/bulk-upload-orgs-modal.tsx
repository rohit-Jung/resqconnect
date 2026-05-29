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
  IBulkProvisionResult,
  IBulkProvisionRow,
  useBulkProvisionOrgs,
} from '@/services/super-admin/organizations.api';

const EXPECTED_COLUMNS = [
  'name',
  'email',
  'serviceCategory',
  'generalNumber',
  'password',
  'sector',
  'siloBaseUrl',
] as const;

const SAMPLE_DATA: IBulkProvisionRow[] = [
  {
    name: 'Nepal Red Cross',
    email: 'redcross@example.com',
    serviceCategory: 'ambulance',
    generalNumber: 9800000001,
    password: 'SecurePass@123',
    sector: 'hospital',
    siloBaseUrl: 'http://localhost:4000',
  },
  {
    name: 'Kathmandu Police',
    email: 'ktmpolice@example.com',
    serviceCategory: 'police',
    generalNumber: 9800000002,
    password: 'SecurePass@456',
    sector: 'police',
    siloBaseUrl: 'http://localhost:4000',
  },
];

function downloadSampleXlsx() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_DATA);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Organizations');
  // Add a notes sheet
  const notesData = [
    {
      Field: 'serviceCategory',
      AllowedValues: 'ambulance | police | rescue_team | fire_truck',
    },
    { Field: 'sector', AllowedValues: 'hospital | police | fire' },
    { Field: 'generalNumber', AllowedValues: 'Integer phone number' },
    {
      Field: 'siloBaseUrl',
      AllowedValues: 'Base URL of the silo backend (no trailing slash)',
    },
  ];
  const wsNotes = XLSX.utils.json_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Field Notes');
  XLSX.writeFile(wb, 'organizations_template.xlsx');
}

interface Props {
  onClose: () => void;
}

export function BulkUploadOrgsModal({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<IBulkProvisionRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [results, setResults] = useState<IBulkProvisionResult[] | null>(null);
  const bulkMutation = useBulkProvisionOrgs();

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
        const parsed: IBulkProvisionRow[] = json.map((r, i) => {
          for (const col of EXPECTED_COLUMNS) {
            if (!(col in r))
              throw new Error(`Row ${i + 1}: missing column "${col}"`);
          }
          return {
            name: String(r.name),
            email: String(r.email),
            serviceCategory: String(
              r.serviceCategory
            ) as IBulkProvisionRow['serviceCategory'],
            generalNumber: Number(r.generalNumber),
            password: String(r.password),
            sector: String(r.sector) as IBulkProvisionRow['sector'],
            siloBaseUrl: String(r.siloBaseUrl),
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
      setResults(res.data.results);
      const { created, failed } = res.data;
      if (failed === 0) toast.success(`All ${created} organizations created`);
      else toast.warning(`${created} created, ${failed} failed`);
    } catch {
      toast.error('Bulk upload failed');
    }
  };

  const created = results?.filter(r => r.status === 'created').length ?? 0;
  const failed = results?.filter(r => r.status === 'failed').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Bulk Upload Organizations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload an Excel file to provision multiple organizations at once
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
          {/* Step 1: Download template */}
          <div>
            <p className="text-sm font-medium mb-2">1. Download the template</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={downloadSampleXlsx}
            >
              <Download className="h-4 w-4" />
              organizations_template.xlsx
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Fill in your data following the format. Do not rename columns.
            </p>
          </div>

          {/* Step 2: Upload file */}
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

          {/* Preview */}
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
                        <td className="px-3 py-2">{r.serviceCategory}</td>
                        <td className="px-3 py-2">{r.generalNumber}</td>
                        <td className="px-3 py-2">{'•'.repeat(8)}</td>
                        <td className="px-3 py-2">{r.sector}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate">
                          {r.siloBaseUrl}
                        </td>
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

          {/* Results */}
          {results && (
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> {created} created
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

        {/* Footer */}
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
                `Upload ${rows.length} Organizations`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
