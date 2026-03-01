'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';

interface Quotation {
  id: string;
  clienteNombre?: string;
  clientName?: string;
  createdAt: any;
  status: string;
  descripcion?: string;
  precio?: string;
  formDataSnapshot?: {
    quotationName?: string;
    client?: string;
  };
}

const COLUMNS = [
  { id: 'draft', label: 'Borrador', color: '#7C86A4', bg: 'rgba(124,134,164,0.06)' },
  { id: 'generated', label: 'Generada', color: '#3C65E2', bg: 'rgba(60,101,226,0.06)' },
  { id: 'sent', label: 'Enviada', color: '#E96104', bg: 'rgba(233,97,4,0.06)' },
  { id: 'accepted', label: 'Aceptada', color: '#16A34A', bg: 'rgba(34,197,94,0.06)' },
  { id: 'rejected', label: 'Rechazada', color: '#DC2626', bg: 'rgba(220,38,38,0.06)' },
];

const getClient = (q: Quotation) => q.clienteNombre || q.clientName || q.formDataSnapshot?.client || '';
const getService = (q: Quotation) => q.descripcion || q.formDataSnapshot?.quotationName || 'Sin descripcion';
const fmtDate = (ts: any) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export default function PipelinePage() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'quotations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setQuotations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quotation)));
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const moveCard = async (quotationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'quotations', quotationId), { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(colId);
  };

  const onDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragId) moveCard(dragId, colId);
    setDragId(null);
    setDragOver(null);
  };

  const onDragEnd = () => {
    setDragId(null);
    setDragOver(null);
  };

  const grouped = COLUMNS.map(col => ({
    ...col,
    items: quotations.filter(q => q.status === col.id),
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
  
  return (
    <div className="h-screen flex flex-col pt-6 px-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-text-secondary mt-0.5">{quotations.length} cotizaciones en total</p>
        </div>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {grouped.map(col => (
          <div
            key={col.id}
            className="flex-shrink-0 w-[260px] flex flex-col"
            onDragOver={(e) => onDragOver(e, col.id)}
            onDrop={(e) => onDrop(e, col.id)}
            onDragLeave={() => setDragOver(null)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
              <span className="text-[13px] font-semibold">{col.label}</span>
              <span className="text-[11px] text-text-secondary font-medium bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                {col.items.length}
              </span>
            </div>
            
            <div
              className="flex-1 rounded-xl p-2 space-y-2 transition-colors min-h-[200px]"
              style={{
                background: dragOver === col.id ? `${col.color}12` : col.bg,
                border: dragOver === col.id ? `2px dashed ${col.color}40` : '2px solid transparent',
              }}
            >
              {col.items.length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-text-secondary opacity-60">
                  Arrastra aqui
                </div>
              )}
              {col.items.map(q => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, q.id)}
                  onDragEnd={onDragEnd}
                  className="bg-white rounded-xl p-3.5 border border-border cursor-grab active:cursor-grabbing hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] transition-all"
                  style={{ opacity: dragId === q.id ? 0.4 : 1 }}
                >
                  <div className="text-[13px] font-semibold leading-snug mb-1.5">{getService(q)}</div>
                  {getClient(q) && (
                    <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {getClient(q)}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold">{q.precio || ''}</span>
                    <span className="text-[10px] text-text-secondary">{fmtDate(q.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}