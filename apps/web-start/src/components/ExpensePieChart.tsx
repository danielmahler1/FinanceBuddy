import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

type Transaction = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  createdAt: string;
  updatedAt: string;
};

interface ExpensePieChartProps {
  transactions: Transaction[];
  selectedYear: number;
  selectedMonth: number;
  isLoading?: boolean;
}

const CHART_COLORS = [
  '#2563eb',
  '#9333ea',
  '#16a34a',
  '#ea580c',
  '#db2777',
  '#0891b2',
  '#ca8a04',
  '#dc2626',
];

function normalizeVendorName(vendor: string): string {
  return vendor.toLowerCase().replace(/\s+/g, '').trim() || 'unknown';
}

export function ExpensePieChart({
  transactions,
  selectedYear,
  selectedMonth,
  isLoading,
}: ExpensePieChartProps) {
  const selectedMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const monthlyExpenses = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    return key === selectedMonthKey && t.amount < 0;
  });

  const vendorGroups = monthlyExpenses.reduce((acc, transaction) => {
    const vendor = transaction.vendor || 'Unknown';
    const normalized = normalizeVendorName(vendor);
    
    if (!acc[normalized]) {
      acc[normalized] = {
        normalizedName: normalized,
        displayName: vendor,
        total: 0,
        transactions: [],
      };
    }
    
    acc[normalized].total += Math.abs(transaction.amount);
    acc[normalized].transactions.push({
      ...transaction,
      originalVendor: vendor,
    });
    
    return acc;
  }, {} as Record<string, {
    normalizedName: string;
    displayName: string;
    total: number;
    transactions: Array<Transaction & { originalVendor: string }>;
  }>);

  const sortedGroups = Object.values(vendorGroups)
    .sort((a, b) => b.total - a.total);

  const topGroups = sortedGroups.slice(0, 8);
  const otherGroups = sortedGroups.slice(8);
  
  const otherTransactions = otherGroups.flatMap(group => group.transactions);
  const otherTotal = otherGroups.reduce((sum, group) => sum + group.total, 0);

  const chartData = topGroups.map(group => ({
    name: group.displayName,
    normalizedName: group.normalizedName,
    value: group.total,
    transactions: group.transactions,
  }));

  if (otherTotal > 0) {
    chartData.push({
      name: 'Other',
      normalizedName: 'other',
      value: otherTotal,
      transactions: otherTransactions,
    });
  }

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  const dataWithPercentage = chartData.map((item) => ({
    ...item,
    percentage: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0,
  }));

  const selectedMonthLabel = React.useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth]);

  const formatDate = React.useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const CustomTooltip = React.useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0]?.payload;
    if (!data) {
      return null;
    }

    const transactions = data.transactions || [];
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
        <p className="font-semibold text-gray-900 mb-2">{data.name || 'Unknown'}</p>
        <p className="text-sm text-gray-600 mb-3">
          ${(data.value || 0).toFixed(2)} ({(data.percentage || 0).toFixed(1)}%)
        </p>
        {transactions.length > 0 && (
          <div className="border-t pt-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Transactions:</p>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {[...transactions]
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction: any, index: number) => (
                  <li key={transaction.id || `txn-${index}`} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span className="flex-1">
                      <span className="font-medium">{transaction.originalVendor || transaction.vendor || 'Unknown'}</span>
                      <span className="text-gray-500 ml-2">
                        ${Math.abs(transaction.amount || 0).toFixed(2)}
                      </span>
                      <span className="text-gray-400 ml-2">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }, [formatDate]);

  const CustomLegend = React.useCallback(({ payload }: any) => {
    if (!payload || !payload.length) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value}: ${(entry.payload?.value || 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Expense Breakdown
          </CardTitle>
          <CardDescription>Expenses by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  if (monthlyExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Expense Breakdown
          </CardTitle>
          <CardDescription>Expenses by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            No expenses for {selectedMonthLabel}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Expense Breakdown
        </CardTitle>
        <CardDescription>Expenses by vendor for {selectedMonthLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
            <Legend content={CustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

