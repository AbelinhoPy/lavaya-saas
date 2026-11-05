import AuthForm from '@/components/auth-form';
import { authConfigured } from '@/lib/server';
export const metadata = { title: 'Nueva contraseña', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function Page() { return <AuthForm mode="reset" configured={authConfigured()}/>; }
