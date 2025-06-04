"use client";

import { useSearchParams } from 'next/navigation';
import CotizacionForm from "./components/CotizacionForm";

export default function CotizacionExpress() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  
  let initialService = null;
  if (serviceParam) {
    try {
      initialService = JSON.parse(decodeURIComponent(serviceParam));
    } catch (error) {
      console.error('Error parsing service data:', error);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1">
        <CotizacionForm initialService={initialService} />
      </main>
    </div>
  );
}
