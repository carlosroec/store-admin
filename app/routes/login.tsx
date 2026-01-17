import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { api } from "~/lib/api.server";
import { createUserSession, getUserToken } from "~/lib/auth.server";

// Loader: Redirect if already logged in
export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  
  if (token) {
    return redirect('/products');
  }
  
  return json({});
}

// Action: Handle login form submission
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // Validation
  const errors: Record<string, string> = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }
  
  // Attempt login
  try {
    const response = await api.login({ email, password });
    
    // Create session and redirect
    return createUserSession(response.token, '/products');
  } catch (error) {
    return json(
      { 
        errors: { 
          general: error instanceof Error ? error.message : 'Login failed' 
        } 
      },
      { status: 401 }
    );
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your dashboard
          </p>
        </div>
        
        {/* Login Form */}
        <Card>
          <Form method="post" className="space-y-6">
            {/* General Error */}
            {actionData?.errors?.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{actionData.errors.general}</p>
              </div>
            )}
            
            {/* Email Input */}
            <Input
              type="email"
              name="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              error={actionData?.errors?.email}
              required
            />
            
            {/* Password Input */}
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={actionData?.errors?.password}
              required
            />
            
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              Sign in
            </Button>
          </Form>
          
          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Contact admin
              </Link>
            </p>
          </div>
        </Card>
        
        {/* Demo Credentials */}
        <div className="mt-4 text-center">
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Demo credentials
            </summary>
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded">
              <p>Email: demo@example.com</p>
              <p>Password: demo123</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
