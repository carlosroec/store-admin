import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
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
        </Card>
      </div>
    </div>
  );
}
