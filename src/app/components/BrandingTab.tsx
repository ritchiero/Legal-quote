"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebase";
import { toast } from "react-hot-toast";
import { onSnapshot } from "firebase/firestore";

interface BrandingData {
  nombreDespacho: string;
  slogan?: string;
  anoFundacion?: string;
  descripcion?: string;
  sitioWeb?: string;
  redes?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  colores: {
    primario: string;
    secundario: string;
    terciario: string;
  };
  logoURL?: string;
  signer: {
    name: string;
    role: string;
    phone?: string;
    email: string;
    other?: string;
  };
}

interface BrandingTabProps {
  userId: string;
  brandingData: BrandingData;
  onBrandingUpdate: (data: BrandingData) => void;
}

export default function BrandingTab({
  userId,
  brandingData,
  onBrandingUpdate,
}: BrandingTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrandingData>({
    ...brandingData,
    signer: brandingData.signer || {
      name: '',
      role: '',
      email: '',
      phone: '',
      other: ''
    }
  });

  // Mantén sincronizado el formulario con los datos de branding que reciba el componente
  useEffect(() => {
    setFormData({
      ...brandingData,
      signer: brandingData.signer || {
        name: '',
        role: '',
        email: '',
        phone: '',
        other: ''
      }
    });
  }, [brandingData]);

  useEffect(() => {
    const loadBrandingInfo = async () => {
      if (!userId) return;

      try {
        const brandingRef = doc(db, "brandingInfo", userId);
        const unsubscribe = onSnapshot(brandingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as BrandingData;
            onBrandingUpdate(data);
            setFormData(data);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error al cargar información de branding:", error);
        toast.error("Error al cargar la información de marca");
      }
    };

    loadBrandingInfo();
  }, [userId, onBrandingUpdate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("color")) {
      const colorKey = name
        .replace("color", "")
        .toLowerCase() as keyof typeof formData.colores;
      setFormData((prev) => ({
        ...prev,
        colores: {
          ...prev.colores,
          [colorKey]: value,
        },
      }));
    } else if (name.startsWith("redes.")) {
      const redKey = name.split(".")[1] as keyof NonNullable<
        typeof formData.redes
      >;
      setFormData((prev) => ({
        ...prev,
        redes: {
          ...prev.redes,
          [redKey]: value,
        },
      }));
    } else if (name.startsWith('signer.')) {
      const signerKey = name.split('.')[1] as keyof typeof formData.signer;
      setFormData(prev => ({
        ...prev,
        signer: {
          ...prev.signer,
          [signerKey]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!userId || !e.target.files?.[0]) return;

      const file = e.target.files[0];

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe exceder 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);

      const storageRef = ref(storage, `logos/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);

      const logoURL = await getDownloadURL(storageRef);

      setFormData((prev) => ({
        ...prev,
        logoURL,
      }));

      toast.success("Logo subido exitosamente");
    } catch (error) {
      console.error("Error al subir logo:", error);
      toast.error("Error al subir el logo");
    }
  };

  const handleSaveBranding = async () => {
    try {
      setIsLoading(true);

      if (!formData.nombreDespacho.trim()) {
        toast.error("El nombre del despacho es obligatorio");
        return;
      }

      const brandingRef = doc(db, "brandingInfo", userId);

      await setDoc(
        brandingRef,
        {
          ...formData,
          updatedAt: serverTimestamp(),
          userId,
        },
        { merge: true },
      );

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        branding: {
          ...formData,
          updatedAt: serverTimestamp(),
        },
      });

      onBrandingUpdate(formData);
      // Actualiza el estado local para mostrar inmediatamente los cambios guardados
      setFormData(formData);
      setIsModalOpen(false);
      toast.success("Datos de branding guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar datos de branding:", error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBrandingData = brandingData.nombreDespacho || brandingData.logoURL;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {hasBrandingData ? (
          <>
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Identidad de Marca
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Gestiona la imagen y estilo de tu despacho
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Editar
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                {brandingData.logoURL && (
                  <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center p-4 flex-shrink-0">
                    <Image
                      src={brandingData.logoURL}
                      alt="Logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                )}

                {/* Información */}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brandingData.nombreDespacho}
                  </h3>
                  {brandingData.slogan && (
                    <p className="mt-2 text-base italic text-gray-900">
                      {brandingData.slogan}
                    </p>
                  )}
                  {brandingData.anoFundacion && (
                    <p className="mt-2 text-sm text-gray-900">
                      Desde {brandingData.anoFundacion}
                    </p>
                  )}
                  {brandingData.descripcion && (
                    <p className="mt-2 text-sm text-gray-900">
                      {brandingData.descripcion}
                    </p>
                  )}
                  {brandingData.sitioWeb && (
                    <a
                      href={brandingData.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center text-sm underline text-gray-900 hover:no-underline"
                    >
                      <i className="fas fa-link mr-2 text-gray-400"></i>
                      {brandingData.sitioWeb}
                    </a>
                  )}
                {brandingData.redes && (
                  <div className="flex gap-3 mt-3 text-gray-500">
                      {brandingData.redes.linkedin && (
                        <a
                          href={brandingData.redes.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-900"
                        >
                          <i className="fab fa-linkedin"></i>
                        </a>
                      )}
                      {brandingData.redes.twitter && (
                        <a
                          href={brandingData.redes.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-900"
                        >
                          <i className="fab fa-twitter"></i>
                        </a>
                      )}
                      {brandingData.redes.instagram && (
                        <a
                          href={brandingData.redes.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-900"
                        >
                          <i className="fab fa-instagram"></i>
                        </a>
                      )}
                      {brandingData.redes.facebook && (
                        <a
                          href={brandingData.redes.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-900"
                        >
                          <i className="fab fa-facebook"></i>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Firmante */}
              {brandingData.signer && (
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Firmante</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    <strong>{brandingData.signer.name}</strong><br />
                    {brandingData.signer.role}<br />
                    {brandingData.signer.email}
                    {brandingData.signer.phone && ` · ${brandingData.signer.phone}`}
                    {brandingData.signer.other && ` · ${brandingData.signer.other}`}
                  </p>
                </div>
              )}

              {/* Paleta de Colores */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Paleta de Colores
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {["primario", "secundario", "terciario"].map((key) => (
                    <div
                      key={key}
                      className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg border shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor:
                            brandingData.colores[
                              key as keyof typeof brandingData.colores
                            ],
                        }}
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900 capitalize">
                          {key}
                        </span>
                        <span className="block text-xs text-gray-500 uppercase">
                          {
                            brandingData.colores[
                              key as keyof typeof brandingData.colores
                            ]
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="px-8 py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Configura la identidad de tu marca
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Define los elementos visuales de tu despacho como el logo,
                colores y más para fortalecer tu presencia profesional
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Comenzar configuración
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Los estilos del modal también se pueden mejorar pero necesitaría más espacio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {hasBrandingData
                    ? "Editar Identidad de Marca"
                    : "Configurar Identidad de Marca"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido del formulario */}
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del Despacho
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {(() => {
                        const logoSrc = previewLogo ?? formData.logoURL ?? "";
                        return logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt="Logo Preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-contain p-2"
                            priority
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        );
                      })()}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Subir logo
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG o GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Despacho
                    </label>
                    <input
                      type="text"
                      name="nombreDespacho"
                      value={formData.nombreDespacho}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Ej: Bufete Jurídico González & Asociados"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año de Fundación
                    </label>
                    <input
                      type="text"
                      name="anoFundacion"
                      value={formData.anoFundacion}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Ej: 2010"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slogan
                    </label>
                    <input
                      type="text"
                      name="slogan"
                      value={formData.slogan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Ej: Excelencia jurídica a tu servicio"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción breve
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      maxLength={300}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Máx. 300 caracteres"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio web
                    </label>
                    <input
                      type="url"
                      name="sitioWeb"
                      value={formData.sitioWeb}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "linkedin", label: "LinkedIn" },
                      { name: "twitter", label: "Twitter/X" },
                      { name: "instagram", label: "Instagram" },
                      { name: "facebook", label: "Facebook" },
                    ].map((red) => (
                      <div key={red.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {red.label}
                        </label>
                        <input
                          type="url"
                          name={`redes.${red.name}`}
                          value={
                            formData.redes?.[
                              red.name as keyof typeof formData.redes
                            ] || ""
                          }
                          onChange={(e) => {
                            const { value } = e.target;
                            setFormData((prev) => ({
                              ...prev,
                              redes: {
                                ...prev.redes,
                                [red.name]: value,
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder={`https://`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colores */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Paleta de Colores
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["primario", "secundario", "terciario"].map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          Color {key}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            name={`color${key.charAt(0).toUpperCase() + key.slice(1)}`}
                            value={
                              formData.colores[
                                key as keyof typeof formData.colores
                              ]
                            }
                            onChange={handleInputChange}
                            className="h-9 w-16"
                          />
                          <input
                            type="text"
                            value={formData.colores[
                              key as keyof typeof formData.colores
                            ].toUpperCase()}
                            onChange={handleInputChange}
                            name={`color${key.charAt(0).toUpperCase() + key.slice(1)}`}
                            className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-gray-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Firmante */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Datos del firmante</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="signer.name"
                        autoFocus
                        value={formData.signer.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
                      <input
                        type="text"
                        name="signer.role"
                        value={formData.signer.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                      <input
                        type="email"
                        name="signer.email"
                        value={formData.signer.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        name="signer.phone"
                        value={formData.signer.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Otro</label>
                      <input
                        type="text"
                        name="signer.other"
                        value={formData.signer.other || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Agregar el footer con botones */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveBranding}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
