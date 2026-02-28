'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import Link from 'next/link';

interface Quotation {
  id: string;
  clienteNombre?: string;
  clientName?: string;
  folio?: string;
  createdAt: any;
  status: string;
  tipoCotizacion?: string;
  quotationType?: string;
  descripcion?: string;
  precio?: string;
  formDataSnapshot?: {
    quotationName?: string;
    client?: string;
  };
}

const statusCfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: 'Borrador', bg: 'rgba(124,134,164,0.08)', text: '#7C86A4', dot: '#C0C3CF' },
  generated: { label: 'Generada', bg: 'rgba(60,101,226,0.08)', text: '#3C65E2', dot: '#3C65E2' },
  sent: { label: 'Enviada', bg: 'rgba(233,97,4,0.07)', text: '#E96104', dot: '#E96104' },
  accepted: { label: 'Aceptada', bg: 'rgba(34,197,94,0.08)', text: '#16A34A', dot: '#22C55E' },
};

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

const I = {
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  clip: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  send: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  open: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  clock: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  user: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  trend: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="#E96104" stroke="#E96104" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const Badge = ({ status }: { status: string }) => {
  const s = statusCfg[status] || statusCfg.draft;
  return (
    <span className="inline-flex items-center gap-[5px] px-2.5 py-[3px] rounded-full text-[11px] font-semibold" style={{ background: s.bg, color: s.text }}>
      <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

const parsePrice = (precio?: string): number => {
  if (!precio) return 0;
  const num = precio.replace(/[^0-9.]/g, '');
  return parseFloat(num) || 0;
};

const getClientName = (q: Quotation): string => {
  return q.clienteNombre || q.clientName || q.formDataSnapshot?.client || '';
};

const getServiceName = (q: Quotation): string => {
  return q.descripcion || q.formDataSnapshot?.quotationName || 'Sin descripción';
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [showCTA, setShowCTA] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ctaRef.current && !ctaRef.current.contains(e.target as Node)) setShowCTA(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setDisplayName(data.displayName || data.nombre || user.displayName || '');
      } else {
        setDisplayName(user.displayName || '');
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'quotations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation));
      setQuotations(docs);
      setLoadingQuotations(false);
    }, (error) => {
      console.error('Error fetching quotations:', error);
      setLoadingQuotations(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  if (!mounted) return null;

  const firstName = displayName ? displayName.split(' ')[0] : '';
  const total = quotations.reduce((a, q) => a + parsePrice(q.precio), 0);
  const accepted = quotations.filter(q => q.status === 'accepted').length;
  const pending = quotations.filter(q => q.status === 'generated' || q.status === 'draft').length;
  const lastDraft = quotations.find(q => q.status === 'draft');
  const lastQuote = quotations[0];

  return (
    <div className="max-w-[1120px] mx-auto">
      {/* Row 1: Greeting + CTA */}
      <div className="flex justify-between items-end mb-6 animate-fade-in">
        <div>
          <h1 className="text-[30px] font-light tracking-tight leading-tight mb-1.5">
            {getGreeting()}, <span className="font-bold">{firstName || 'Usuario'}</span>
          </h1>
          <p className="text-sm text-text-secondary">
            {pending > 0 && <><span className="text-primary font-semibold">{pending} pendientes</span> de envío · </>}
            Monto del mes: <span className="font-semibold text-text-main">{fmt(total)}</span>
          </p>
        </div>
        <div ref={ctaRef} className="relative animate-fade-in" style={{animationDelay: '.08s'}}>
          <button onClick={() => setShowCTA(!showCTA)} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-[0_8px_24px_rgba(60,101,226,.28)] hover:-translate-y-[1px]">
            {I.plus} Nueva Cotización
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showCTA && (
            <div className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-2xl border border-border shadow-[0_20px_48px_rgba(16,24,40,.14)] p-2 w-[300px] z-30 animate-scale-in">
              <Link href="/cotizacion-express" className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors">
                <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-primary to-[#6B8CEF] flex items-center justify-center text-white flex-shrink-0">{I.zap}</div>
                <div>
                  <div className="text-sm font-semibold">Express</div>
                  <div className="text-xs text-text-secondary">Con IA en minutos</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold text-primary bg-primary/[.07] px-[7px] py-[2px] rounded-full">Rápida</span>
                    <span className="text-[10px] font-semibold text-accent bg-accent/[.07] px-[7px] py-[2px] rounded-full">Con IA</span>
                  </div>
                </div>
              </Link>
              <div className="h-px bg-border mx-3.5 my-1" />
              <Link href="/cotizacion-estructurada" className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors">
                <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-[#6B46C1] to-[#9F7AEA] flex items-center justify-center text-white flex-shrink-0">{I.clip}</div>
                <div>
                  <div className="text-sm font-semibold">Estructurada</div>
                  <div className="text-xs text-text-secondary">Wizard paso a paso</div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold text-[#6B46C1] bg-[#6B46C1]/[.07] px-[7px] py-[2px] rounded-full">Detallada</span>
                    <span className="text-[10px] font-semibold text-text-secondary bg-text-secondary/[.07] px-[7px] py-[2px] rounded-full">Profesional</span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {/* KPI 1 */}
        <div className="bento-card p-[22px_24px] animate-fade-in" style={{animationDelay:'.04s'}}>
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Cotizaciones del mes</div>
          <div className="text-[28px] font-extrabold tracking-tight leading-none">{quotations.length}</div>
          <div className="text-xs text-text-secondary mt-2 flex items-center gap-1">{I.trend}<span className="text-green-600 font-semibold">Activas</span></div>
        </div>
        {/* KPI 2 */}
        <div className="bento-card p-[22px_24px] animate-fade-in" style={{animationDelay:'.08s'}}>
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Monto cotizado</div>
          <div className="text-[28px] font-extrabold tracking-tight leading-none">{fmt(total)}</div>
          <div className="text-xs text-text-secondary mt-2 flex items-center gap-1">{I.star} Promedio: {quotations.length > 0 ? fmt(Math.round(total / quotations.length)) : '$0'}</div>
        </div>
        {/* KPI 3 */}
        <div className="bento-card p-[22px_24px] animate-fade-in" style={{animationDelay:'.12s'}}>
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Tasa de aceptación</div>
          <div className="text-[28px] font-extrabold tracking-tight leading-none text-green-600">{quotations.length > 0 ? Math.round((accepted / quotations.length) * 100) : 0}%</div>
          <div className="text-xs text-text-secondary mt-2 flex items-center gap-1">{I.check}<span className="text-green-600">{accepted} aceptadas</span> de {quotations.length}</div>
        </div>
        {/* Quick Actions */}
        <div className="bento-card p-[20px_22px] flex flex-col gap-2.5 animate-fade-in" style={{animationDelay:'.16s'}}>
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-0.5">Acciones rápidas</div>
          {lastQuote && (
            <button onClick={() => router.push('/cotizacion-express')} className="flex items-center gap-3 p-[10px_14px] border border-border rounded-xl bg-white hover:border-primary hover:bg-primary-50 transition-all text-left w-full">
              <span className="text-primary">{I.copy}</span>
              <div>
                <div className="text-[13px] font-semibold">Duplicar última cotización</div>
                <div className="text-[11px] text-text-secondary">{getServiceName(lastQuote)}</div>
              </div>
            </button>
          )}
          {pending > 0 && (
            <button className="flex items-center gap-3 p-[10px_14px] border border-border rounded-xl bg-white hover:border-primary hover:bg-primary-50 transition-all text-left w-full">
              <span className="text-primary">{I.send}</span>
              <div>
                <div className="text-[13px] font-semibold">Enviar pendientes</div>
                <div className="text-[11px] text-text-secondary">{pending} cotizaciones listas</div>
              </div>
            </button>
          )}
        </div>
        {/* Config card - span 2 */}
        <Link href="/configuracion" className="col-span-2 bento-card p-[20px_24px] flex items-center justify-between animate-fade-in" style={{animationDelay:'.2s'}}>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Configurador</div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-base font-bold text-primary">{firstName ? firstName[0] : 'U'}</div>
              <div>
                <div className="text-base font-bold">{displayName || 'Tu despacho'}</div>
                <div className="text-[13px] text-text-secondary">Perfil, servicios, facturación, pagos y branding</div>
              </div>
            </div>
          </div>
          <span className="text-text-secondary">{I.arr}</span>
        </Link>
      </div>

      {/* COTIZACIONES RECIENTES */}
      <div className="animate-fade-in" style={{animationDelay:'.24s'}}>
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="text-[17px] font-semibold">Cotizaciones recientes</h2>
          <button className="flex items-center gap-1.5 text-text-secondary text-[13px] font-medium border border-border rounded-full px-4 py-2 hover:border-primary hover:text-primary hover:bg-primary-50 transition-all">
            Ver todas {I.arr}
          </button>
        </div>
        <div className="bento-card overflow-hidden">
          {loadingQuotations ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C0C3CF" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <h3 className="text-base font-semibold mb-1">Sin cotizaciones aún</h3>
              <p className="text-sm text-text-secondary mb-5">Crea tu primera cotización con IA y aparecerá aquí.</p>
              <Link href="/cotizacion-express" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-700 transition-all">
                {I.zap} Crear primera cotización
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_110px_90px_90px] px-5 py-2.5 bg-background text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <span>Servicio / Cliente</span>
                <span>Monto</span>
                <span>Fecha</span>
                <span>Status</span>
                <span className="text-right">Acciones</span>
              </div>
              {/* Rows */}
              {quotations.map((q) => (
                <div key={q.id} className="grid grid-cols-[1fr_120px_110px_90px_90px] items-center px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-primary-50 transition-colors cursor-pointer group">
                  <div>
                    <div className="text-sm font-semibold leading-tight">{getServiceName(q)}</div>
                    <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      {I.user} {getClientName(q) || <span className="italic">Sin cliente</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold tracking-tight">{q.precio || '—'}</span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">{I.clock} {formatDate(q.createdAt)}</span>
                  <Badge status={q.status} />
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-[30px] h-[30px] rounded-lg border border-border bg-white flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50 transition-all" title="Abrir">{I.open}</button>
                    <button className="w-[30px] h-[30px] rounded-lg border border-border bg-white flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50 transition-all" title="Enviar">{I.send}</button>
                    <button className="w-[30px] h-[30px] rounded-lg border border-border bg-white flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50 transition-all" title="Duplicar">{I.copy}</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Draft banner */}
      {lastDraft && (
        <div className="mt-5 p-[14px_22px] bg-white rounded-[14px] border border-dashed border-primary flex items-center justify-between cursor-pointer hover:bg-primary-50 hover:border-solid transition-all animate-fade-in" style={{animationDelay:'.28s'}} onClick={() => router.push('/cotizacion-express')}>
          <div>
            <div className="text-[13px] font-semibold mb-0.5">Continúa donde te quedaste</div>
            <div className="text-xs text-text-secondary">Borrador: {getServiceName(lastDraft)} · {lastDraft.precio || ''}</div>
          </div>
          <span className="text-primary">{I.arr}</span>
        </div>
      )}
    </div>
  );
}'