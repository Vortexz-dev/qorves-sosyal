export const config = {
  firebaseConfig: {
  apiKey: "AIzaSyAH7mPDv8RKx7dYww0_Jo_BEzmClx-KGUs",
  authDomain: "qorves-sosyal.firebaseapp.com",
  projectId: "qorves-sosyal",
  storageBucket: "qorves-sosyal.firebasestorage.app",
  messagingSenderId: "1066381237518",
  appId: "1:1066381237518:web:7b387f41dc2202f6cb4b5f"
},
  // Acil üst anahtar. false iken hiçbir yeni Gemini isteği yapılmaz.
  simulationAllowed: true,
  geminiModel: 'gemini-3.7-flash',
  feedPageSize: 40,
  maxPostLength: 500,
  // İlk DM girişinde şifre belirlenir. Bu kilit oyun içindir, gerçek yetkilendirme değildir.
};

