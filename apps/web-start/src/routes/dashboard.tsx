import { Navigate, createFileRoute, Link } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import {
  CreditCard,
  DollarSign,
  LogOut,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();

  // Show loading state
  if (isLoading) {
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
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your financial health
            </p>
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
                <div className="text-2xl font-bold">$12,234.56</div>
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
                <div className="text-2xl font-bold">$5,420.00</div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
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
                <div className="text-2xl font-bold">$3,128.45</div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
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
                <div className="text-2xl font-bold">$8,450.00</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 font-medium">85%</span> of goal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
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
                <div className="space-y-4">
                  {[
                    { name: 'Grocery Store', amount: -125.5, date: 'Today' },
                    { name: 'Salary Deposit', amount: 5420.0, date: 'Yesterday' },
                    { name: 'Electric Bill', amount: -89.99, date: '2 days ago' },
                    { name: 'Coffee Shop', amount: -12.5, date: '3 days ago' },
                  ].map((transaction, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.name}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                      <div
                        className={`font-semibold ${
                          transaction.amount > 0
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                <div className="space-y-4">
                  {[
                    {
                      name: 'Emergency Fund',
                      current: 8450,
                      target: 10000,
                      color: 'bg-blue-600',
                    },
                    {
                      name: 'Vacation',
                      current: 2300,
                      target: 5000,
                      color: 'bg-purple-600',
                    },
                    {
                      name: 'New Car',
                      current: 12000,
                      target: 25000,
                      color: 'bg-green-600',
                    },
                  ].map((goal, i) => {
                    const percentage = Math.round(
                      (goal.current / goal.target) * 100
                    );
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {goal.name}
                            </p>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            ${goal.current.toLocaleString()} / $
                            {goal.target.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${goal.color} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
              <div className="grid md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm">Add Transaction</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm">Set Goal</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm">View Accounts</span>
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
    </div>
  );
}
