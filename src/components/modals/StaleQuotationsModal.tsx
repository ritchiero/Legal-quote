'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';

interface StaleQuotation {
  id: string;
  clientName?: string;
  clienteNombre?: string;
  descripcion?: string;
  quotationName?: string;
  folio?: string;
  createdAt: any;
  precio?: string;
  formDataSnapshot?: {
    quotationName?: string;
    client?: string;
  };
}

export default function StaleQuotationsModal() {
  const { user } = useAuth();
  const [staleQuotations, setStaleQuotations] = useState<StaleQuotation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStale = async () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const cutoff = Timestamp.fromDate(fourteenDaysAgo);

      const q = query(
        collection(db, 'quotations'),
        where('userId', '==', user.uid),
        where('status', '==', 'generated'),
        where('createdAt', '<=', cutoff)
      );

      const snapshot = await getDocs(q);
      const results: StaleQuotation[] = [];
      snapshot.forEach((d) => {
        results.push({ id: d.id, ...d.data() } as StaleQuotation);
      });

      if (results.length > 0) {
        setStaleQuotations(results);
        setIsOpen(true);
      }
    };

    fetchStale();
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'quotations', id), { status: newStatus });
      setStaleQuotations((prev) => prev.filter((q) => q.id !== id));
      if (staleQuotations.length <= 1) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error updating quotation status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getName = (q: StaleQuotation) => {
    return q.descripcion || q.formDataSnapshot?.quotationName || q.folio || 'Sin título';
  };

  const getClient = (q: StaleQuotation) => {
    return q.clienteNombre || q.clientName || q.formDataSnapshot?.client || 'Sin cliente';
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const getDaysAgo = (ts: any) => {
    if (!ts) return 0;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!isOpen || staleQuotations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-bold text-gray-900">Cotizaciones pendientes</h2>
          </div>
          <p className="text-sm text-gray-500 ml-10">
            Tienes {staleQuotations.length} cotización{staleQuotations.length > 1 ? 'es' : ''} sin actualizar hace más de 2 semanas. ¿Cómo avanzaron?
          </p>
        </div>

        {/* List */}
        <div className="px-6 max-h-[340px] overflow-y-auto">
          {staleQuotations.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-xl p-4 mb-3 last:mb-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getName(q)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getClient(q)} · {formatDate(q.createdAt)} · hace {getDaysAgo(q.createdAt)} días</p>
                </div>
                {q.precio && <span className="text-sm font-bold text-gray-700">{q.precio}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(q.id, 'accepted')}
                  disabled={updating === q.id}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  ✅ Aceptada
                </button>
                <button
                  onClick={() => handleUpdateStatus(q.id, 'negotiating')}
                  disabled={updating === q.id}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  🤝 En negociación
                </button>
                <button
                  onClick={() => handleUpdateStatus(q.id, 'rejected')}
                  disabled={updating === q.id}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  ❌ Rechazada
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Recordarme después
          </button>
        </div>
      </div>
    </div>
  );
}