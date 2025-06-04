'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from 'ai/react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { query, where, onSnapshot } from 'firebase/firestore';
import BrandingTab from '@/app/components/BrandingTab';
import PaymentTab from '@/app/components/PaymentTab';
import BillingTab from '@/app/components/BillingTab';
import MarketAITab from '@/app/components/MarketAITab';
import { BillingData, BrandingData } from './settings/profile/types';
import type { PaymentMethod } from '@/lib/types/payment';
import ServicesTab from '@/app/components/ServicesTab';
import { HomeIcon, DocumentTextIcon, CreditCardIcon, SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  location?: string;
  bio?: string;
}

export default function Home() {
    const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Servicios');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState<any>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [isFacturacionModalOpen, setIsFacturacionModalOpen] = useState(false);
  
  // Estado para datos fiscales
  const [datosFiscales, setDatosFiscales] = useState<BillingData>({
    razonSocial: '',
    rfc: '',
    direccion: {
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      codigoPostal: '',
      municipio: '',
      estado: '',
    },
    email: '',
    telefono: ''
  });

  // Estado para datos de branding
  const [brandingData, setBrandingData] = useState<BrandingData>({
    nombreDespacho: '',
    slogan: '',
    anoFundacion: '',
    descripcion: '',
    sitioWeb: '',
    redes: {
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: ''
    },
    colores: {
      primario: '#000000',
      secundario: '#666666',
      terciario: '#999999'
    },
    logoURL: '',
    signer: {
      name: '',
      role: '',
      phone: '',
      email: '',
      other: ''
    }
  });

  // Estado para nuevo servicio
  const [newService, setNewService] = useState({
    nombre: '',
    descripcion: '',
    detalles: '',
    tiempo: '',
    precio: '',
    incluye: ['']
  });

  // Agregar estos estados
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Inicializar el estado
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Agregar esta función para manejar la selección del método de pago
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const { complete, isLoading: isAILoading } = useCompletion({
    api: '/api/openai/chat',
    onResponse: () => {},
    onFinish: () => {},
    onError: (error) => {
      console.error('[AI Error Event]:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      setError(`Error: ${error.message}`);
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cargarServicios = async () => {
      if (!user?.uid) return;

      try {
        const serviciosRef = collection(db, 'servicios');
        const q = query(serviciosRef, where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const serviciosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setServicios(serviciosData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      }
    };

    cargarServicios();
  }, [user?.uid]);

  // Modificar el useEffect para cargar datos fiscales
  useEffect(() => {
    const cargarDatosFiscales = async () => {
      if (!user?.uid) return;

      try {
        const billingRef = doc(db, 'billing', user.uid);
        const unsubscribe = onSnapshot(billingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const billingData = docSnapshot.data();
            setDatosFiscales({
              razonSocial: billingData.razonSocial || '',
              rfc: billingData.rfc || '',
              direccion: {
                calle: billingData.direccion?.calle || '',
                numeroExterior: billingData.direccion?.numeroExterior || '',
                numeroInterior: billingData.direccion?.numeroInterior || '',
                colonia: billingData.direccion?.colonia || '',
                codigoPostal: billingData.direccion?.codigoPostal || '',
                municipio: billingData.direccion?.municipio || '',
                estado: billingData.direccion?.estado || '',
              },
              email: billingData.email || '',
              telefono: billingData.telefono || ''
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar datos fiscales:', error);
        toast.error('Error al cargar los datos fiscales');
      }
    };

    cargarDatosFiscales();
  }, [user?.uid]);

  // 1. Primero, asegurémonos de que el usuario existe al inicio
  useEffect(() => {
    const initializeUserDoc = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Crear documento inicial si no existe
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error initializing user document:', error);
      }
    };

    initializeUserDoc();
  }, [user?.uid]);

  // Agregar este useEffect para cargar métodos de pago
  useEffect(() => {
    const cargarMetodosPago = async () => {
      if (!user?.uid) return;

      try {
        // Cambiar a la colección paymentInfo
        const paymentRef = doc(db, 'paymentInfo', user.uid);
        const unsubscribe = onSnapshot(paymentRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const paymentData = docSnapshot.data();
            if (paymentData.methods) {
              const methodsArray = Object.values(paymentData.methods) as PaymentMethod[];
              setPaymentMethods(methodsArray);
            } else {
              setPaymentMethods([]);
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
        toast.error('Error al cargar los métodos de pago');
      }
    };

    cargarMetodosPago();
  }, [user?.uid]);

  // Agregar este useEffect para cargar datos de brandingInfo
  useEffect(() => {
    const cargarDatosBranding = async () => {
      if (!user?.uid) return;

      try {
        const brandingRef = doc(db, 'brandingInfo', user.uid);
        const unsubscribe = onSnapshot(brandingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const brandingInfo = docSnapshot.data();
            setBrandingData({
              nombreDespacho: brandingInfo.nombreDespacho || '',
              slogan: brandingInfo.slogan || '',
              anoFundacion: brandingInfo.anoFundacion || '',
              colores: {
                primario: brandingInfo.colores?.primario || '#000000',
                secundario: brandingInfo.colores?.secundario || '#666666',
                terciario: brandingInfo.colores?.terciario || '#999999',
              },
              descripcion: brandingInfo.descripcion || '',
              sitioWeb: brandingInfo.sitioWeb || '',
              redes: {
                linkedin: brandingInfo.redes?.linkedin || '',
                twitter: brandingInfo.redes?.twitter || '',
                instagram: brandingInfo.redes?.instagram || '',
                facebook: brandingInfo.redes?.facebook || ''
              },
              logoURL: brandingInfo.logoURL || '',
              signer: {
                name: brandingInfo.signer?.name || '',
                role: brandingInfo.signer?.role || '',
                phone: brandingInfo.signer?.phone || '',
                email: brandingInfo.signer?.email || '',
                other: brandingInfo.signer?.other || ''
              }
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar datos de branding:', error);
        toast.error('Error al cargar los datos de branding');
      }
    };

    cargarDatosBranding();
  }, [user?.uid]);

  // Agregar este useEffect para cargar el perfil del usuario
  useEffect(() => {
    const cargarPerfilUsuario = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data();
            setUserProfile({
              location: profileData.location,
              bio: profileData.bio
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar perfil del usuario:', error);
        toast.error('Error al cargar el perfil');
      }
    };

    cargarPerfilUsuario();
  }, [user?.uid]);

  if (!mounted) return null;

  return (
    <div className="w-full mx-auto px-4 box-border max-w-full">
      <div className="md:hidden sticky top-16 z-10 bg-background border-b border-border py-3">
        <h1 className="text-lg font-semibold text-text-main text-center">Configurador de Cotizador con IA</h1>
      </div>
      <div className="flex flex-col items-center">
        <h1 className="hidden md:block text-2xl font-bold text-text-main mb-2 text-center mt-16">Configurador de Cotizador con IA</h1>
        <p className="hidden md:block text-base text-text-secondary mb-6 text-center">Configura estas opciones para automatizar tus cotizaciones.</p>
        {/* Navegación */}
        <div className="w-full flex justify-center mb-4">
          <nav className="flex gap-2 bg-background-card rounded-xl p-2 shadow-sm overflow-x-auto snap-x whitespace-nowrap">
            {[
              { label: 'Servicios', Icon: HomeIcon },
              { label: 'Facturación', Icon: DocumentTextIcon },
              { label: 'Pago', Icon: CreditCardIcon },
              { label: 'Branding', Icon: SparklesIcon },
              { label: 'Mercado IA', Icon: CpuChipIcon },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => setSelectedTab(label)}
                aria-selected={selectedTab === label}
                aria-label={label}
                className={`relative flex-none snap-start min-h-[44px] text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 step-tab
                  after:absolute after:bottom-0 after:left-1.5 after:right-1.5 after:h-0.5 after:bg-primary after:rounded-full after:transition-transform
                  ${selectedTab === label
                    ? 'active text-primary after:scale-x-100'
                    : 'inactive text-text-secondary hover:text-primary after:scale-x-0'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="tab-label">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="w-full py-12 px-2 sm:px-4">
          {selectedTab === 'Servicios' ? (
            <ServicesTab
              userId={user?.uid || ''}
              servicios={servicios}
              onServiciosUpdate={setServicios}
            />
          ) : selectedTab === 'Facturación' ? (
            <BillingTab 
              userId={user?.uid || ''}
              billingData={datosFiscales}
              onBillingUpdate={setDatosFiscales}
            />
          ) : selectedTab === 'Pago' ? (
            <PaymentTab
              userId={user?.uid || ''}
              paymentMethods={paymentMethods}
              onPaymentUpdate={setPaymentMethods}
              onDefaultChange={() => {}}
            />
          ) : selectedTab === 'Branding' ? (
            <BrandingTab 
              userId={user?.uid || ''}
              brandingData={brandingData}
              onBrandingUpdate={setBrandingData}
            />
          ) : selectedTab === 'Mercado IA' ? (
            <MarketAITab 
              userId={user?.uid || ''}
            />
          ) : (
            <div className="w-full text-center py-12">
              <h2 className="text-xl font-bold mb-4">Sube tu primer proyecto</h2>
              <p className="text-gray-500 mb-6">
                Muestra tu mejor trabajo. Recibe retroalimentación y sé parte de una comunidad en crecimiento.
              </p>
              <button className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800">
                Subir primer proyecto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
