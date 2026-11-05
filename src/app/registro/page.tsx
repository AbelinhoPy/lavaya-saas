import AuthForm from '@/components/auth-form';
import { authConfigured } from '@/lib/server';
export const metadata = { title: 'Crear cuenta', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function Page() { return <AuthForm mode="register" configured={authConfigured()}/>; }
