import React from 'react';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Calendar,
  CreditCard,
  DollarSign,
  LogOut,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiMutation, useApiQuery, useCurrentUser } from '@/integrations/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransactionActions } from '@/components/TransactionActions';
import { GoalActions } from '@/components/GoalActions';
import { ExpensePieChart } from '@/components/ExpensePieChart';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Transaction = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  createdAt: string;
  updatedAt: string;
};

type RecurringCharge = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  interval: string;
  startDate: string;
  endDate?: string;
  lastProcessedDate?: string;
  status: boolean;
  account: {
    accountType: string;
    currency: string;
  };
};

type AccountSummary = { totals: Array<{ currency: string; total: number }> };

function Dashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const { data: dbUser, showLoading: userLoading, error: userError } = useCurrentUser();

  // Fetch account summary
  const summaryQ = useApiQuery<AccountSummary>(
    ['accounts', 'me', 'summary'],
    '/accounts/me/summary',
  );
  const totals = summaryQ.data?.totals ?? [];
  const totalsLabel = totals.length
    ? totals
        .map((t) =>
          new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: t.currency,
            maximumFractionDigits: 2,
          }).format(t.total),
        )
        .join(' · ')
    : '$0.00';

  // Fetch goals
  const goalsQ = useApiQuery<Array<Goal>>(['goals'], '/goals');
  const goals = goalsQ.data ?? [];

  // Fetch transactions
  const transactionsQ = useApiQuery<Array<Transaction>>(['transactions'], '/transactions');
  const allTransactions = transactionsQ.data ?? [];

  // Automatically process due charges when dashboard loads
  const processDueMutation = useApiMutation<Record<string, never>, { processed: number }>({
    path: '/recurring-charges/process-due',
    method: 'POST',
    invalidateKeys: [['recurring-charges'], ['transactions'], ['accounts', 'me'], ['accounts', 'me', 'summary']],
  });

  const hasProcessedRef = React.useRef(false);

  React.useEffect(() => {
    if (isAuthenticated && !isLoading && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      processDueMutation.mutateAsync({}).catch(() => {
        hasProcessedRef.current = false; // Reset on error
      });
    }
  }, [isAuthenticated, isLoading]);

  // Year and Month filter state
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    return new Date().getFullYear();
  });

  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    return new Date().getMonth() + 1; // 1-12
  });

  const [showAllTransactions, setShowAllTransactions] = React.useState(false);

  const selectedMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Generate year options (last 5 years and next year)
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options: Array<number> = [];
    for (let i = 5; i >= -1; i--) {
      options.push(currentYear - i);
    }
    return options;
  }, []);

  // Generate month options (1-12)
  const monthOptions = React.useMemo(() => {
    const options: Array<{ value: number; label: string }> = [];
    for (let m = 1; m <= 12; m++) {
      const date = new Date(selectedYear, m - 1, 1);
      const label = date.toLocaleString(undefined, { month: 'long' });
      options.push({ value: m, label });
    }
    return options;
  }, [selectedYear]);

  const selectedMonthLabel = React.useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth]);

  // Transactions for selected month
  const monthlyTransactions = allTransactions.filter((t) => {
    const d = new Date(t.createdAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    return key === selectedMonthKey;
  });

  // Get recent transactions (last 5) for selected month
  const recentTransactions = [...monthlyTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = Math.abs(
    monthlyTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  // Calculate total savings from goals
  const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savingsPercentage = totalGoalTarget > 0
    ? Math.round((totalSavings / totalGoalTarget) * 100)
    : 0;

  // Format relative date
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Show error if API call failed
  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading user data</p>
          <p className="text-gray-600 mt-2">{userError.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {user?.name || 'User'}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {dbUser?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your financial health
            </p>
          </div>

          {/* Year and Month Selector */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Overview by month
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Year</span>
                <select
                  className="border rounded-md h-9 px-3 text-sm bg-white"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Month</span>
                <select
                  className="border rounded-md h-9 px-3 text-sm bg-white"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryQ.showLoading ? 'Loading…' : totalsLabel}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 font-medium">+2.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Income
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactionsQ.showLoading
                    ? 'Loading…'
                    : `$${monthlyIncome.toFixed(2)}`}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedMonthLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactionsQ.showLoading
                    ? 'Loading…'
                    : `$${monthlyExpenses.toFixed(2)}`}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedMonthLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Savings
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {goalsQ.showLoading
                    ? 'Loading…'
                    : `$${totalSavings.toFixed(2)}`}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {savingsPercentage > 0 && (
                    <>
                      <span className="text-green-600 font-medium">{savingsPercentage}%</span> of goal
                    </>
                  )}
                  {savingsPercentage === 0 && 'Set a goal to track progress'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsQ.showLoading ? (
                  <div className="text-center text-gray-500">Loading transactions...</div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center text-gray-500">No transactions yet</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-start justify-between border-b pb-3 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {transaction.vendor}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatRelativeDate(transaction.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`font-semibold ${
                                transaction.amount > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {transaction.amount > 0 ? '+' : '-'}$
                              {Math.abs(transaction.amount).toFixed(2)}
                            </div>
                            <TransactionActions transaction={transaction} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {monthlyTransactions.length > 5 && (
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAllTransactions(true)}
                        >
                          View All ({monthlyTransactions.length} transactions)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <ExpensePieChart
              transactions={allTransactions}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              isLoading={transactionsQ.showLoading}
            />

            {/* Financial Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Financial Goals
                </CardTitle>
                <CardDescription>Track your savings progress</CardDescription>
              </CardHeader>
              <CardContent>
                {goalsQ.showLoading ? (
                  <div className="text-center text-gray-500">Loading goals...</div>
                ) : goals.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <p className="mb-4">No goals yet</p>
                    <Link to="/goals">
                      <Button size="sm" className="gap-2">
                        <Target className="w-4 h-4" />
                        Create Your First Goal
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {goals.map((goal, i) => {
                        const percentage = Math.round(
                          (goal.currentAmount / goal.targetAmount) * 100
                        );
                        const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-600', 'bg-pink-600'];
                        const color = colors[i % colors.length];
                        return (
                          <div
                            key={goal.id}
                            className="flex items-start justify-between border-b pb-3 last:border-0"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">
                                  {goal.name}
                                </p>
                                <Badge variant="secondary">{percentage}%</Badge>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className={`${color} h-2 rounded-full transition-all`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-500">
                                ${goal.currentAmount.toLocaleString()} / $
                                {goal.targetAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <GoalActions goal={goal} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Link to="/goals">
                      <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                        <Target className="w-4 h-4" />
                        View All Goals
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                  <Link to="/transactions">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">Add Transaction</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                  <Link to="/goals">
                    <Target className="w-5 h-5" />
                    <span className="text-sm">Set Goal</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                  <Link to="/accounts">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">View Accounts</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col gap-2">
                  <Link to="/recurring-charges">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Recurring Charges</span>
                  </Link>
                </Button>
                <Link to="/profile">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 w-full"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm">Profile Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View All Transactions Modal */}
      {showAllTransactions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                All Transactions - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h2>
              <button onClick={() => setShowAllTransactions(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {monthlyTransactions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {transaction.vendor}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatRelativeDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`font-semibold ${
                            transaction.amount > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : '-'}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        <TransactionActions transaction={transaction} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
