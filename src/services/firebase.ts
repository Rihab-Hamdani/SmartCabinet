import auth from '@react-native-firebase/auth';

export const firebaseCreerCompte = async (email: string, password: string) => {
  const userCredential = await auth().createUserWithEmailAndPassword(
    email.trim().toLowerCase(), 
    password
  );
  
  try {
    await userCredential.user.sendEmailVerification();
  } catch (e) {
    console.warn('Email de vérification non envoyé:', e);
  }

  return {
    uid: userCredential.user.uid,
    emailVerifie: userCredential.user.emailVerified,
  };
};

export const firebaseConnexion = async (email: string, password: string) => {
  const userCredential = await auth().signInWithEmailAndPassword(
    email.trim().toLowerCase(), 
    password
  );
  await userCredential.user.reload();
  return {
    uid: userCredential.user.uid,
    emailVerifie: userCredential.user.emailVerified,
  };
};

export const reinitialiserMotDePasse = async (email: string) => {
  await auth().sendPasswordResetEmail(email.trim().toLowerCase());
};

export const firebaseDeconnexion = async () => {
  await auth().signOut();
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