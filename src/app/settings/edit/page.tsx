'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserProfile, updateUserProfile, updateAuthProfile } from '@/lib/firebase/firebaseUtils';
import { auth } from '@/lib/firebase/firebase';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { fileToBase64, validateImageFile } from '@/lib/utils/imageUtils';

interface ProfileData {
  displayName: string;
  location: string;
  bio: string;
  photoURL?: string;
}

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    displayName: '',
    location: '',
    bio: '',
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setFormData({
            displayName: user.displayName || '',
            location: profile?.location || '',
            bio: profile?.bio || '',
            photoURL: profile?.photoURL,
          });
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      }
    };

    loadUserProfile();
    setMounted(true);
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingPhoto(true);
    try {
      // Validar el archivo
      validateImageFile(file);

      // Convertir a Base64
      const base64String = await fileToBase64(file);

      // Actualizar el estado local
      setFormData(prev => ({
        ...prev,
        photoURL: base64String
      }));

      toast.success('Foto actualizada correctamente');
    } catch (err) {
      console.error('Error processing photo:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Primero actualizar Firestore
      await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        location: formData.location,
        bio: formData.bio,
        photoURL: formData.photoURL,
      });

      // Luego actualizar Auth
      if (auth.currentUser) {
        try {
          await updateAuthProfile(auth.currentUser, {
            displayName: formData.displayName,
            photoURL: formData.photoURL,
          });
        } catch (authError) {
          console.error('Error updating auth profile:', authError);
        }
      }

      // Actualizar el contexto de autenticación
      await refreshUser();

      toast.success('Los cambios se guardaron exitosamente');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex gap-12">
        {/* Menú lateral */}
        <div className="w-48 space-y-4">
          <h2 className="font-semibold text-gray-900">General</h2>
          <nav className="flex flex-col space-y-2">
            {[
              'Editar perfil',
              'Contraseña',
            ].map((item) => (
              <button
                key={item}
                className={`text-left px-3 py-2 rounded-lg text-sm ${
                  item === 'Editar perfil'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            ))}
            <button className="text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
              Eliminar cuenta
            </button>
          </nav>
        </div>

        {/* Formulario */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Foto de perfil</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={formData.photoURL || '/default-avatar-icon.png'}
                    alt="Perfil"
                    fill
                    className="rounded-full object-cover"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {uploadingPhoto ? 'Subiendo...' : 'Cambiar foto'}
                  </button>
                  <button 
                    type="button"
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100"
                  >
                    Eliminar foto
                  </button>
                </div>
              </div>
            </div>

            {/* El resto del formulario se mantiene igual */}
            {/* Nombre de perfil */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Nombre de perfil</h3>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Ubicación</h3>
                <input
                  type="text"
                  name="username"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 pl-7 border rounded-md"
                />
            </div>


            {/* Sobre mí */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Sobre mí</h3>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Biografía"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 