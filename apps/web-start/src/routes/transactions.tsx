import React from 'react';
import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, Camera, CreditCard, Image as ImageIcon, Save } from 'lucide-react';
import type { ParsedReceiptData } from '@/components/receipt';
import { useApiMutation, useApiQuery } from '@/integrations/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReceiptReview } from '@/components/receipt';


type Account = {
  id: string;
  accountType: string;
  currency: string;
  value: number;
};

type CreateTx = {
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  vendor: string;
};

type CreateTxForm = Omit<CreateTx, 'amount'> & { amount: string };

type CreateRecurringCharge = {
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  interval: string;
  dayOfMonth: number;
  monthOfYear?: number;
  startDate?: string;
  endDate?: string;
  status?: boolean;
};

// Narrow the video element type to include srcObject explicitly
type VideoEl = HTMLVideoElement & { srcObject: MediaStream | null };

export const Route = createFileRoute('/transactions')({
  component: NewTransactionPage,
});

function NewTransactionPage() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const accountsQ = useApiQuery<Array<Account>>(['accounts', 'me'], '/accounts/me');
  const createTx = useApiMutation<CreateTx, unknown>({
    path: '/transactions',
    method: 'POST',
    invalidateKeys: [['accounts', 'me'], ['transactions'], ['accounts', 'me', 'summary']],
  });

  const createRecurringCharge = useApiMutation<CreateRecurringCharge, unknown>({
    path: '/recurring-charges',
    method: 'POST',
    invalidateKeys: [['recurring-charges']],
  });

  const [form, setForm] = React.useState<CreateTxForm>({
    accountId: '',
    type: 'expense',
    amount: '',
    vendor: '',
  });
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurringInterval, setRecurringInterval] = React.useState('monthly');
  const [dayOfMonth, setDayOfMonth] = React.useState('1');
  const [monthOfYear, setMonthOfYear] = React.useState('1');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [scanMethod, setScanMethod] = React.useState<'gemini' | 'tesseract' | null>(null);
  const [parsedReceipt, setParsedReceipt] = React.useState<ParsedReceiptData | null>(null);
  const [showReview, setShowReview] = React.useState(false);
  const [camOpen, setCamOpen] = React.useState(false);
  const [camError, setCamError] = React.useState<string | null>(null);
  const videoRef = React.useRef<VideoEl | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const onChange = (patch: Partial<CreateTxForm>) => setForm((f) => ({ ...f, ...patch }));

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
      if (!form.amount || Number.isNaN(Number(form.amount))) throw new Error('Enter an amount');
      const numericAmount = Number(form.amount);

      if (isRecurring) {
        // Create recurring charge
        const roundedAmount = Math.round(numericAmount * 100) / 100; // Round to 2 decimal places
        const signed =
          form.type === 'income' ? Math.abs(roundedAmount) : -Math.abs(roundedAmount);

        const chargeData: CreateRecurringCharge = {
          accountId: form.accountId,
          type: form.type,
          amount: signed,
          vendor: form.vendor,
          interval: recurringInterval,
          dayOfMonth: parseInt(dayOfMonth),
          status: true,
        };

        // Add monthOfYear for yearly charges
        if (recurringInterval === 'yearly') {
          chargeData.monthOfYear = parseInt(monthOfYear);
        }

        // Include start date if provided (store as midnight UTC)
        if (startDate && startDate.trim() !== '') {
          chargeData.startDate = `${startDate}T00:00:00.000Z`;
        }

        // Only include end date if it has a valid value (store as midnight UTC)
        if (endDate && endDate.trim() !== '') {
          chargeData.endDate = `${endDate}T00:00:00.000Z`;
        }

        await createRecurringCharge.mutateAsync(chargeData);
      } else {
        // Create one-time transaction
        const roundedAmount = Math.round(numericAmount * 100) / 100; // Round to 2 decimal places
        const signed =
          form.type === 'income' ? Math.abs(roundedAmount) : -Math.abs(roundedAmount);
        await createTx.mutateAsync({
          accountId: form.accountId,
          type: form.type,
          vendor: form.vendor,
          amount: signed,
        });
      }
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setOcrError(err?.message ?? 'Failed to save');
    }
  }
  async function handleFileWithGemini(file: File): Promise<ParsedReceiptData | null> {
    const formData = new FormData();
    formData.append('receipt', file);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string;

    let token: string | undefined;
    try {
      token = await getAccessTokenSilently({
        authorizationParams: { audience },
      });
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Authentication failed. Please try again.');
    }

    const response = await fetch(`${backendUrl}/receipts/scan`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to scan receipt');
    }

    return response.json();
  }

  async function handleFileWithTesseract(file: File): Promise<ParsedReceiptData> {
    // Lazy load Tesseract.js only when needed to avoid SSR issues
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(file, 'eng');
    const text = data.text || '';
    const parsed = parseReceipt(text);

    return {
      vendor: parsed.vendor || null,
      date: null,
      total: parsed.amount !== undefined ? parsed.amount : null,
      subtotal: null,
      tax: null,
      tip: null,
      items: null,
      paymentMethod: null,
      confidence: parsed.amount !== undefined && parsed.vendor ? 'medium' : 'low',
    };
  }

  async function handleFile(file: File) {
    setOcrError(null);
    setOcrLoading(true);
    setScanMethod(null);

    try {
      // Try Gemini first
      try {
        setScanMethod('gemini');
        const geminiResult = await handleFileWithGemini(file);
        if (geminiResult) {
          setParsedReceipt(geminiResult);
          setShowReview(true);
          return;
        }
      } catch (geminiError: any) {
        console.warn('Gemini parsing failed, falling back to Tesseract:', geminiError.message);
      }

      // Fallback to Tesseract
      setScanMethod('tesseract');
      const tesseractResult = await handleFileWithTesseract(file);
      setParsedReceipt(tesseractResult);
      setShowReview(true);
    } catch (err: any) {
      setOcrError('Could not read receipt. Try a clearer image.');
      setScanMethod(null);
    } finally {
      setOcrLoading(false);
    }
  }

  async function openCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      streamRef.current = stream;
      setCamOpen(true);

      // Use setTimeout to ensure the video element is rendered before setting srcObject
      setTimeout(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch((err) => {
            console.error('Error playing video:', err);
            setCamError('Unable to start video stream.');
          });
        }
      }, 100);
    } catch (e) {
      console.error('Camera error:', e);
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

    // Close camera immediately and start scanning
    closeCamera();
    setOcrLoading(true);
    setOcrError(null);

    const canvas = document.createElement('canvas');
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setOcrLoading(false);
      setOcrError('Could not capture image. Please try again.');
      return;
    }
    ctx.drawImage(v, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95),
    );
    if (!blob) {
      setOcrLoading(false);
      setCamError('Could not capture image. Please try again.');
      return;
    }
    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
    await handleFile(file);
  }

  function handleReviewAccept(data: ParsedReceiptData) {
    setForm((f) => ({
      ...f,
      amount: data.total !== null ? String(data.total) : f.amount,
      vendor: data.vendor || f.vendor,
      type: data.total && data.total < 0 ? 'expense' : f.type,
    }));
    setShowReview(false);
    setParsedReceipt(null);
  }

  function handleReviewReject() {
    setShowReview(false);
    setParsedReceipt(null);
    setOcrError('Receipt rejected. Please try scanning again.');
  }

  function handleReviewEdit(field: keyof ParsedReceiptData, value: any) {
    if (parsedReceipt) {
      setParsedReceipt({ ...parsedReceipt, [field]: value });
    }
  }

  if (showReview && parsedReceipt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Review Scanned Receipt
            </h1>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <ReceiptReview
            parsedData={parsedReceipt}
            onAccept={handleReviewAccept}
            onReject={handleReviewReject}
            onEdit={handleReviewEdit}
          />
        </main>
      </div>
    );
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
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
                  onChange={(e) => onChange({ type: e.target.value as 'income' | 'expense' })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-md h-10 px-3"
                  value={form.amount}
                  onChange={(e) => onChange({ amount: e.target.value })}
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

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Make this a recurring charge</span>
                </label>
              </div>

              {isRecurring && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Recurrence Frequency</label>
                    <select
                      className="w-full border rounded-md h-10 px-3"
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  {recurringInterval === 'monthly' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Day of Month (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="w-full border rounded-md h-10 px-3"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        placeholder="7"
                      />
                    </div>
                  )}
                  {recurringInterval === 'yearly' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Month</label>
                        <select
                          className="w-full border rounded-md h-10 px-3"
                          value={monthOfYear}
                          onChange={(e) => setMonthOfYear(e.target.value)}
                        >
                          <option value="1">January</option>
                          <option value="2">February</option>
                          <option value="3">March</option>
                          <option value="4">April</option>
                          <option value="5">May</option>
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                          <option value="9">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Day of Month (1-31)</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          className="w-full border rounded-md h-10 px-3"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(e.target.value)}
                          placeholder="25"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Date (Optional - defaults to today)</label>
                    <input
                      type="date"
                      className="w-full border rounded-md h-10 px-3"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="When should charges begin?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Date (Optional)</label>
                    <input
                      type="date"
                      className="w-full border rounded-md h-10 px-3"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="When should charges stop?"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2 flex flex-wrap gap-2 mt-2">
                <label className="relative inline-flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                  <span className="border rounded-md px-4 py-2 inline-flex items-center gap-2 cursor-pointer h-10">
                    <ImageIcon className="w-4 h-4" />{' '}
                    {ocrLoading
                      ? scanMethod === 'gemini'
                        ? 'AI Scanning…'
                        : scanMethod === 'tesseract'
                          ? 'OCR Scanning…'
                          : 'Scanning…'
                      : 'Scan Receipt'}
                  </span>
                </label>
                <Button type="button" variant="outline" className="gap-2 h-10" onClick={camOpen ? closeCamera : openCamera}>
                  <Camera className="w-4 h-4" /> {camOpen ? 'Close Camera' : 'Use Camera'}
                </Button>
              </div>

              <div className="md:col-span-2 space-y-3">
                {camOpen && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-80 rounded-lg border object-cover"
                    />
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
                {ocrLoading && !camOpen && (
                  <div className="w-full max-h-80 rounded-lg border bg-linear-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900">
                        {scanMethod === 'gemini' ? 'AI Scanning Receipt...' : scanMethod === 'tesseract' ? 'OCR Scanning Receipt...' : 'Scanning Receipt...'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Please wait while we process your image</p>
                    </div>
                  </div>
                )}
              </div>

              {camError && (
                <div className="md:col-span-2 text-sm text-red-600">{camError}</div>
              )}

              <div className="md:col-span-2 flex flex-wrap gap-3 mt-2">
                <Button type="submit" disabled={createTx.isPending} className="gap-2">
                  <Save className="w-4 h-4" /> {createTx.isPending ? 'Saving…' : 'Save Transaction'}
                </Button>
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
