import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../src/services/firebase';

export async function signInToEmulator(email: string, staff: boolean) {
  if (!auth.emulatorConfig || auth.app.options.projectId !== 'demo-nubox') {
    throw new Error('Test sign-in requires the NUBox Auth emulator.');
  }

  const modeKey = 'nubox-staff-sign-in';
  if (staff) localStorage.setItem(modeKey, '1');
  else localStorage.removeItem(modeKey);

  const credential = GoogleAuthProvider.credential(JSON.stringify({
    sub: email,
    email,
    email_verified: true,
  }));
  await signInWithCredential(auth, credential);
}
