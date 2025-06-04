# Solución al error "Unable to process request due to missing initial state"

Si utilizas `signInWithRedirect` de Firebase Authentication y te aparece el mensaje:

```
Unable to process request due to missing initial state. This may happen if browser sessionStorage is inaccessible or accidentally cleared.
```

es probable que el almacenamiento `sessionStorage` de tu navegador esté restringido (p. ej. por configuración de privacidad o un entorno con partición de almacenamiento). Firebase almacena en `sessionStorage` un estado temporal para finalizar el flujo de autenticación después del redireccionamiento. Si ese estado no puede recuperarse, la autenticación falla.

## Solución recomendada

En la mayoría de los casos puedes evitar este error utilizando `signInWithPopup` en lugar de `signInWithRedirect`:

```ts
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
```

El método con ventana emergente no depende de `sessionStorage`, por lo que funciona incluso cuando el redireccionamiento no puede restaurar el estado.

Si necesitas usar redirección (por ejemplo, en dispositivos que bloquean las ventanas emergentes), asegúrate de no limpiar `sessionStorage` durante el flujo y utiliza la misma URL de origen al iniciar y finalizar la autenticación.
