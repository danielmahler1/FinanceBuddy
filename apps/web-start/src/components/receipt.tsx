import React from 'react';
import { AlertCircle, CheckCircle, Edit2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ParsedReceiptData {
  vendor: string | null;
  date: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  items: Array<{ name: string; price: number }> | null;
  paymentMethod: string | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ReceiptReviewProps {
  parsedData: ParsedReceiptData;
  onAccept: (data: ParsedReceiptData) => void;
  onReject: () => void;
  onEdit: (field: keyof ParsedReceiptData, value: any) => void;
}

export function ReceiptReview({ parsedData, onAccept, onReject, onEdit }: ReceiptReviewProps) {
  const [editingField, setEditingField] = React.useState<keyof ParsedReceiptData | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');
  const [localData, setLocalData] = React.useState(parsedData);

  const confidenceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  };

  const confidenceIcons = {
    high: <CheckCircle className="w-4 h-4" />,
    medium: <AlertCircle className="w-4 h-4" />,
    low: <XCircle className="w-4 h-4" />,
  };

  const startEdit = (field: keyof ParsedReceiptData, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || '');
  };

  const saveEdit = () => {
    if (!editingField) return;

    let parsedValue: any = editValue;

    // Parse based on field type
    if (['total', 'subtotal', 'tax', 'tip'].includes(editingField)) {
      parsedValue = editValue ? parseFloat(editValue) : null;
    }

    const updated = { ...localData, [editingField]: parsedValue };
    setLocalData(updated);
    onEdit(editingField, parsedValue);
    setEditingField(null);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderField = (
    label: string,
    field: keyof ParsedReceiptData,
    value: any,
    formatter: (v: any) => string = (v) => v?.toString() || '-',
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="font-medium text-gray-700">{label}:</span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-32"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') setEditingField(null);
              }}
            />
            <Button size="sm" variant="outline" onClick={saveEdit}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{formatter(value)}</span>
            <button
              onClick={() => startEdit(field, value)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Review Scanned Receipt
              <Badge className={confidenceColors[localData.confidence]}>
                {confidenceIcons[localData.confidence]}
                <span className="ml-1 capitalize">{localData.confidence} Confidence</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Please review the extracted information and make corrections if needed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Receipt Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Receipt Details</h3>
            <div className="space-y-1">
              {renderField('Vendor', 'vendor', localData.vendor)}
              {renderField('Date', 'date', localData.date, formatDate)}
              {renderField('Total', 'total', localData.total, formatCurrency)}
            </div>
          </div>

          {/* Optional Fields */}
          {(localData.subtotal !== null ||
            localData.tax !== null ||
            localData.tip !== null ||
            localData.paymentMethod !== null) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
              <div className="space-y-1">
                {localData.subtotal !== null &&
                  renderField('Subtotal', 'subtotal', localData.subtotal, formatCurrency)}
                {localData.tax !== null &&
                  renderField('Tax', 'tax', localData.tax, formatCurrency)}
                {localData.tip !== null &&
                  renderField('Tip', 'tip', localData.tip, formatCurrency)}
                {localData.paymentMethod !== null &&
                  renderField('Payment Method', 'paymentMethod', localData.paymentMethod)}
              </div>
            </div>
          )}

          {/* Line Items */}
          {localData.items && localData.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
              <div className="space-y-1">
                {localData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-900">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => onAccept(localData)} className="flex-1 gap-2">
              <CheckCircle className="w-4 h-4" />
              Accept & Fill Form
            </Button>
            <Button onClick={onReject} variant="outline" className="flex-1 gap-2">
              <XCircle className="w-4 h-4" />
              Reject & Re-scan
            </Button>
          </div>

          {localData.confidence === 'low' && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded">
              <strong>Low confidence:</strong> The scan quality was poor. Please verify all fields
              carefully or consider re-scanning the receipt.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
