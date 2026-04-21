import auth, { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  reload
} from '@react-native-firebase/auth';

// Initialisation unique
const authInstance = auth();

export const firebaseCreerCompte = async (email: string, password: string) => {
  // Utilisation de authInstance
  const userCredential = await createUserWithEmailAndPassword(authInstance, email.trim().toLowerCase(), password);
  
  try {
    // Nouvelle syntaxe : on passe le user à la fonction
    await sendEmailVerification(userCredential.user);
  } catch (e) {
    console.warn('Email de vérification non envoyé:', e);
  }

  return {
    uid: userCredential.user.uid,
    emailVerifie: userCredential.user.emailVerified,
  };
};

export const firebaseConnexion = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(authInstance, email.trim().toLowerCase(), password);
  await reload(userCredential.user);
  return {
    uid: userCredential.user.uid,
    emailVerifie: userCredential.user.emailVerified,
  };
};

export const reinitialiserMotDePasse = async (email: string) => {
  await sendPasswordResetEmail(authInstance, email.trim().toLowerCase());
};

export const firebaseDeconnexion = async () => {
  await signOut(authInstance);
};

export const traductionErreurFirebase = (code: string): string => {
  const erreurs: { [key: string]: string } = {
    'auth/email-already-in-use': '❌ Cet email est déjà utilisé.',
    'auth/invalid-email': "❌ L'adresse email est invalide.",
    'auth/weak-password': '❌ Mot de passe trop faible.',
    'auth/user-not-found': '❌ Aucun compte trouvé.',
    'auth/wrong-password': '❌ Mot de passe incorrect.',
    'auth/invalid-credential': '❌ Email ou mot de passe incorrect.',
    'auth/too-many-requests': '❌ Trop de tentatives.',
    'auth/network-request-failed': '❌ Pas de connexion internet.',
  };
  return erreurs[code] ?? `❌ Erreur (${code}).`;
};