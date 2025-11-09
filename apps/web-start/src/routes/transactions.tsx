import React from 'react';
import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import Tesseract from 'tesseract.js';
import { ArrowLeft, Camera, CreditCard, Image as ImageIcon, Save } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/integrations/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Account = {
  id: string;
  accountType: string;
  currency: string;
  value: number;
};

type CreateTx = {
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  vendor: string;
};

export const Route = createFileRoute('/transactions')({
  component: NewTransactionPage,
});

function NewTransactionPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const accountsQ = useApiQuery<Array<Account>>(['accounts', 'me'], '/accounts/me');
  const createTx = useApiMutation<CreateTx, unknown>({
    path: '/transactions',
    method: 'POST',
    invalidateKeys: [['accounts', 'me']],
  });

  const [form, setForm] = React.useState<CreateTx>({
    accountId: '',
    type: 'debit',
    amount: 0,
    vendor: '',
  });
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [camOpen, setCamOpen] = React.useState(false);
  const [camError, setCamError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const onChange = (patch: Partial<CreateTx>) => setForm((f) => ({ ...f, ...patch }));

  // Ensure cleanup hook runs on every render path (before any early returns)
  React.useEffect(() => {
    return () => {
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (isLoading || accountsQ.showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" />;

  const accounts = accountsQ.data ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOcrError(null);
    try {
      if (!form.accountId) throw new Error('Please choose an account');
      if (!form.amount || Number.isNaN(form.amount)) throw new Error('Enter an amount');
      await createTx.mutateAsync({ ...form, amount: Number(form.amount) });
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setOcrError(err?.message ?? 'Failed to save');
    }
  }
  async function handleFile(file: File) {
    setOcrError(null);
    setOcrLoading(true);
    try {
      const { data } = await Tesseract.recognize(file, 'eng');
      const text = data.text || '';
      const parsed = parseReceipt(text);
      setForm((f) => ({
        ...f,
        amount: parsed.amount ?? f.amount,
        vendor: parsed.vendor ?? f.vendor,
      }));
    } catch (err: any) {
      setOcrError('Could not read receipt. Try clearer image.');
    } finally {
      setOcrLoading(false);
    }
  }

  async function openCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOpen(true);
      const v = videoRef.current;
      if (v) {
        (v as unknown as { srcObject: MediaStream }).srcObject = stream;
        await v.play();
      }
    } catch (e) {
      setCamError('Unable to access camera. Check permissions.');
    }
  }

  function closeCamera() {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamOpen(false);
  }

  async function captureFromCamera() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95),
    );
    if (blob) {
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      await handleFile(file);
    }
    closeCamera();
  }

  

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Add Transaction
          </h1>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/accounts">
              <ArrowLeft className="w-4 h-4" /> Back to Accounts
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Manual or Scan from Receipt</CardTitle>
            <CardDescription>Choose an account, then add details or scan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2 items-start">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Account</label>
                <select
                  className="w-full border rounded-md h-10 px-3"
                  value={form.accountId}
                  onChange={(e) => onChange({ accountId: e.target.value })}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountType.toUpperCase()} {a.currency} ${a.value.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select
                  className="w-full border rounded-md h-10 px-3"
                  value={form.type}
                  onChange={(e) => onChange({ type: e.target.value as 'debit' | 'credit' })}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-md h-10 px-3"
                  value={form.amount}
                  onChange={(e) => onChange({ amount: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Vendor</label>
                <input
                  type="text"
                  className="w-full border rounded-md h-10 px-3"
                  value={form.vendor}
                  onChange={(e) => onChange({ vendor: e.target.value })}
                  placeholder="e.g., Grocery Store"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-3 mt-2">
                <label className="relative inline-flex items-center justify-center h-10">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                  <span className="border rounded-md px-4 py-2 inline-flex items-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" /> {ocrLoading ? 'Scanning…€¦' : 'Scan Receipt'}
                  </span>
                </label>
                <Button type="submit" disabled={createTx.isPending} className="gap-2">
                  <Save className="w-4 h-4" /> {createTx.isPending ? 'Saving…€¦' : 'Save Transaction'}
                </Button>
              </div>

              {camError && (
                <div className="md:col-span-2 text-sm text-red-600">{camError}</div>
              )}

              <div className="md:col-span-2 space-y-3">
                <Button type="button" variant="outline" className="gap-2" onClick={camOpen ? closeCamera : openCamera}>
                  <Camera className="w-4 h-4" /> {camOpen ? 'Close Camera' : 'Use Camera'}
                </Button>
                {camOpen && (
                  <>
                    <video ref={videoRef} playsInline className="w-full max-h-80 rounded-md border" />
                    <div className="flex gap-2">
                      <Button type="button" onClick={captureFromCamera} className="gap-2">
                        <Camera className="w-4 h-4" /> Capture & Scan
                      </Button>
                      <Button type="button" variant="outline" onClick={closeCamera}>
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {(ocrError || (createTx.error as any)?.message) && (
                <div className="md:col-span-2 text-sm text-red-600">
                  {ocrError ?? (createTx.error as any)?.message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function parseReceipt(text: string): { amount?: number; vendor?: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Heuristic vendor: first non-empty line that looks like a name (letters/spaces)
  const vendor = lines.find((l) => /[A-Za-z]{3,}/.test(l));

  // Amount: prefer a line with TOTAL/BALANCE, else pick the max currency-like number
  let amount: number | undefined;
  const currencyRe = /(?:(?:USD|EUR|GBP)\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/;
  for (const l of lines) {
    if (/total|balance due|amount due/i.test(l)) {
      const m = l.match(currencyRe);
      const v = m?.[1];
      if (v) {
        amount = Number(v.replace(/,/g, ''));
        break;
      }
    }
  }
  if (amount === undefined) {
    const candidates = lines
      .map((l) => l.match(currencyRe))
      .map((m) => m?.[1])
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map((s) => Number(s.replace(/,/g, '')))
      .filter((n) => !Number.isNaN(n));
    if (candidates.length) amount = Math.max(...candidates);
  }
  return { amount, vendor };
}
