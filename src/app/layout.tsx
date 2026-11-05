import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'LavaYA! — Tu negocio, bajo control.', template: '%s | LavaYA!' },
  description: 'Organizá vehículos, servicios y cobros desde un solo lugar. Conocé LavaYA! y explorá la demo interactiva.'
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
