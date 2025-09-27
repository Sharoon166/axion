import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password',
  description: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
