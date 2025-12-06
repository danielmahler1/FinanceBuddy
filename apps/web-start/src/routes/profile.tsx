import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle,
  DollarSign,
  Download,
  Mail,
  Phone,
  Save,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiMutation, useApiQuery } from '@/integrations/api';

type Account = {
  id: string;
  userId: string;
  accountType: string;
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

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

export const Route = createFileRoute('/profile')({
  component: ProfileSettings,
});

type UserProfile = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  currency?: string;
};

function ProfileSettings() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  // Fetch user's data from database
  const userProfileQ = useApiQuery<UserProfile>(['users', 'me'], '/users/me');
  const accountsQ = useApiQuery<Array<Account>>(['accounts', 'me'], '/accounts/me');
  const goalsQ = useApiQuery<Array<Goal>>(['goals'], '/goals');
  const transactionsQ = useApiQuery<Array<Transaction>>(['transactions'], '/transactions');

  // Mutation for updating user profile
  type UpdateUserPayload = {
    name?: string;
    phone?: string;
    dateOfBirth?: string;
    currency?: string;
  };
  const updateUserMutation = useApiMutation<UpdateUserPayload, unknown>({
    path: '/users/me',
    method: 'PUT',
    invalidateKeys: [['users', 'me']],
  });

  // Local state for form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    currency: 'USD',
  });

  // Populate form data when user profile loads
  useEffect(() => {
    if (userProfileQ.data) {
      const profile = userProfileQ.data;
      setFormData({
        firstName: profile.firstName || user?.given_name || '',
        lastName: profile.lastName || user?.family_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        currency: profile.currency || 'USD',
      });
    } else if (user && !userProfileQ.showLoading) {
      // Fallback to Auth0 data if no profile data yet
      setFormData({
        firstName: user.given_name || '',
        lastName: user.family_name || '',
        email: user.email || '',
        phone: '',
        dateOfBirth: '',
        currency: 'USD',
      });
    }
  }, [userProfileQ.data, user, userProfileQ.showLoading]);

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Show loading state while Auth0 is checking authentication
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

  // Redirect to home if not authenticated (only after loading is complete)
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      await updateUserMutation.mutateAsync({
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        currency: formData.currency,
      });

      setNotification({
        type: 'success',
        message: 'Profile updated successfully!',
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to update profile. Please try again.',
      });

      // Auto-hide error message after 7 seconds
      setTimeout(() => {
        setNotification(null);
      }, 7000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const accounts = accountsQ.data ?? [];
    const goals = goalsQ.data ?? [];
    const transactions = transactionsQ.data ?? [];

    const exportData = {
      user: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
      },
      accounts: accounts.map(acc => ({
        id: acc.id,
        type: acc.accountType,
        balance: acc.value,
        currency: acc.currency,
        createdAt: acc.createdAt,
      })),
      goals: goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        status: goal.status,
        createdAt: goal.createdAt,
      })),
      transactions: transactions.map(txn => ({
        id: txn.id,
        accountId: txn.accountId,
        type: txn.type,
        amount: txn.amount,
        vendor: txn.vendor,
        createdAt: txn.createdAt,
      })),
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financebuddy-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-8 shadow-2xl border-2 border-gray-200 pointer-events-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-lg font-semibold text-gray-900">Saving Changes...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          <div
            className={`rounded-lg shadow-lg p-4 ${
              notification.type === 'success'
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      notification.type === 'success'
                        ? 'text-green-900'
                        : 'text-red-900'
                    }`}
                  >
                    {notification.type === 'success' ? 'Success!' : 'Error'}
                  </p>
                  <p
                    className={`text-sm ${
                      notification.type === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotification(null)}
                className={`${
                  notification.type === 'success'
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                Update your profile photo (visible to other users)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200">
                      {user?.name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Recommended: Square image, at least 400x400px
                  </p>
                  <Button variant="outline" size="sm">
                    Upload New Photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange('firstName', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange('lastName', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {user && user.email_verified ? (
                      <Badge variant="secondary" className="text-green-600">
                        ✓ Verified
                      </Badge>
                    ) : null}
                    <p className="text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange('dateOfBirth', e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your financial settings and display options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                    <option value="CAD">CAD - Canadian Dollar ($)</option>
                    <option value="AUD">AUD - Australian Dollar ($)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    This currency will be used for all financial calculations and
                    displays
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export your financial data for backup or analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Export Your Data
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Download all your financial data including accounts,
                        transactions, goals, and income records in JSON format.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> The exported file will contain all your
                    personal and financial information. Please store it securely and
                    do not share it with unauthorized parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.updated_at
                      ? new Date(user.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <Badge variant="secondary" className="text-green-600">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

