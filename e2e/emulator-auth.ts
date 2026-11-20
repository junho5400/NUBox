import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../src/services/firebase';

export async function signInAsTestStudent() {
  if (!auth.emulatorConfig || auth.app.options.projectId !== 'demo-nubox') {
    throw new Error('Test sign-in requires the NUBox Auth emulator.');
  }

  const credential = GoogleAuthProvider.credential(JSON.stringify({
    sub: 'nubox-e2e-student',
    email: 'e2e-student@u.northwestern.edu',
    email_verified: true,
  }));
  await signInWithCredential(auth, credential);
}
