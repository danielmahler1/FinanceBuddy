import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Target, PiggyBank, LineChart, Shield, Zap } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge className="mx-auto w-fit" variant="secondary">
            Your Personal Finance Companion
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Take Control of Your
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Financial Future</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            FinanceBuddy helps you track expenses, set goals, and make smarter financial decisions. Start your journey to financial freedom today.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                $2.5M+
              </CardTitle>
              <CardDescription>Money Saved by Users</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                50K+
              </CardTitle>
              <CardDescription>Goals Achieved</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-purple-600" />
                100K+
              </CardTitle>
              <CardDescription>Active Users</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-white">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold text-gray-900">
            Everything You Need to Manage Your Money
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you understand and optimize your finances
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Smart Tracking</CardTitle>
              <CardDescription>
                Automatically categorize and track all your transactions in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Goal Setting</CardTitle>
              <CardDescription>
                Set financial goals and track your progress with visual insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Your financial data is encrypted and protected with industry-leading security
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Spending Insights</CardTitle>
              <CardDescription>
                Get personalized insights and recommendations to improve your financial health
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>Savings Plans</CardTitle>
              <CardDescription>
                Create customized savings plans and automate your path to financial goals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Instant Notifications</CardTitle>
              <CardDescription>
                Stay updated with real-time alerts for unusual spending and bill reminders
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-linear-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center space-y-4 py-12">
            <CardTitle className="text-3xl md:text-4xl text-white">
              Ready to Transform Your Finances?
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Join thousands of users who have taken control of their financial future
            </CardDescription>
            <div className="pt-4">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Your Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
