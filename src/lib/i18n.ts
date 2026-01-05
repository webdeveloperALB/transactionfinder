import { create } from 'zustand';
import { secureStorage } from './storage';

export type Language = 'en' | 'it' | 'de' | 'el' | 'es' | 'fr';

export const languages = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  el: 'Ελληνικά',
  es: 'Español',
  fr: 'Français'
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const stored = secureStorage.get();
const initialLanguage = stored.language || 'en';

export const useI18n = create<I18nStore>((set) => ({
  language: initialLanguage,
  setLanguage: (language) => set({ language })
}));

export const translations = {
  en: {
    // Code Entry
    enterCode: 'Enter Your Code',
    trackStatus: 'Track the status of your transaction recovery',
    recoveryCode: 'Recovery Code',
    enterRecoveryCodePlaceholder: 'Enter your recovery code',
    invalidCode: 'Invalid code. Please check with your administrator.',
    needCode: "Don't have a code?",
    contactSupport: 'Contact Support',
    continue: 'Continue',
    networkError: 'A network error occurred. Please try again.',

    // Personal Info Form
    secureVerification: 'Secure Verification',
    provideDetails: 'Please provide your details for verification',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    phoneNumber: 'Phone Number',
    currentAddress: 'Current Address',
    nationality: 'Nationality',
    identityVerification: 'Identity Verification',
    uploadIdDocument: 'Upload ID Document',
    idDocumentTypes: 'JPG, PNG, or PDF (Front Only)',
    startSearch: 'Start Search',
    byContinuing: 'By continuing, you agree to our',
    termsAndConditions: 'Terms and Conditions',

    // Email Verification
    verifyEmail: 'Verify Your Email',
    verifyEmailDesc: 'Please enter the verification code sent to',
    enterVerificationCode: 'Enter Verification Code',
    verifyCode: 'Verify Code',
    backToForm: 'Back to Form',
    resendCode: 'Resend Code',
    emailAlreadyRegistered: 'This email is already registered',

    // Transaction Info Form
    transactionDetails: 'Transaction Details',
    helpLocate: 'Help us locate your transaction by providing the details',
    amount: 'Amount',
    recipientName: 'Recipient Name',
    companyName: 'Company Name',
    transactionReason: 'Transaction Reason',
    cryptocurrency: 'Cryptocurrency',
    bankTransfer: 'Bank Transfer',
    wireTransfer: 'Wire Transfer',
    walletAddress: 'Wallet Address',
    transactionProof: 'Transaction Proof',
    uploadTransactionProof: 'Upload Transaction Proof',
    fileUploadTypes: 'JPG, PNG, or PDF files accepted',

    // Search Status
    searchTitle: 'Searching for Your Transaction',
    searchDescription: 'Our advanced algorithms are scanning global databases',
    processingText: 'Processing',
    timeElapsed: 'Time Elapsed',
    invalidTransaction: 'Invalid Transaction',

    // Results Page
    transactionLocated: 'Transaction Located',
    foundAtBank: "We've successfully found your transaction at Digital Chain Bank in Panama",
    originalAmount: 'Original Amount',
    amountFound: 'Amount Found',
    bankInformation: 'Bank Information',
    validTransaction: 'Valid Transaction',
    unlockMore: 'Unlock More Transactions',
    upgradeDescription: 'Upgrade to Pro or Enterprise to reveal 2 more transactions and get advanced features:',
    upgradeToPro: 'Upgrade to Pro',
    upgradeToEnterprise: 'Upgrade to Enterprise',
    proFeatures: [
      'Extended transaction search',
      'Advanced database scan',
      'Priority support',
      'ChatGPT 4 assistance',
      'Real-time notifications'
    ],
    enterpriseFeatures: [
      'Comprehensive transaction search',
      'Global database access',
      'Dedicated support team',
      'ChatGPT 4 Pro assistance',
      'Advanced analytics',
      'Custom recovery strategies'
    ],

    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    tryAgain: 'Please try again',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    success: 'Success',
  },

  it: {
    // Code Entry
    enterCode: 'Inserisci il Codice',
    trackStatus: 'Traccia lo stato del recupero della transazione',
    recoveryCode: 'Codice di Recupero',
    enterRecoveryCodePlaceholder: 'Inserisci il codice di recupero',
    invalidCode: 'Codice non valido. Verifica con l\'amministratore.',
    needCode: 'Non hai un codice?',
    contactSupport: 'Contatta il Supporto',
    continue: 'Continua',
    networkError: 'Si è verificato un errore di rete. Riprova.',

    // Personal Info Form
    secureVerification: 'Verifica Sicura',
    provideDetails: 'Fornisci i tuoi dati per la verifica',
    fullName: 'Nome Completo',
    emailAddress: 'Indirizzo Email',
    phoneNumber: 'Numero di Telefono',
    currentAddress: 'Indirizzo Attuale',
    nationality: 'Nazionalità',
    identityVerification: 'Verifica dell\'Identità',
    uploadIdDocument: 'Carica Documento d\'Identità',
    idDocumentTypes: 'JPG, PNG o PDF (Solo Fronte)',
    startSearch: 'Inizia Ricerca',
    byContinuing: 'Continuando, accetti i nostri',
    termsAndConditions: 'Termini e Condizioni',

    // Email Verification
    verifyEmail: 'Verifica la tua Email',
    verifyEmailDesc: 'Inserisci il codice di verifica inviato a',
    enterVerificationCode: 'Inserisci il Codice di Verifica',
    verifyCode: 'Verifica Codice',
    backToForm: 'Torna al Modulo',
    resendCode: 'Invia di Nuovo',
    emailAlreadyRegistered: 'Questa email è già registrata',

    // Transaction Info Form
    transactionDetails: 'Dettagli della Transazione',
    helpLocate: 'Aiutaci a localizzare la tua transazione fornendo i dettagli',
    amount: 'Importo',
    recipientName: 'Nome del Destinatario',
    companyName: 'Nome dell\'Azienda',
    transactionReason: 'Motivo della Transazione',
    cryptocurrency: 'Criptovaluta',
    bankTransfer: 'Bonifico Bancario',
    wireTransfer: 'Bonifico Internazionale',
    walletAddress: 'Indirizzo del Portafoglio',
    transactionProof: 'Prova della Transazione',
    uploadTransactionProof: 'Carica Prova della Transazione',
    fileUploadTypes: 'Accettati file JPG, PNG o PDF',

    // Search Status
    searchTitle: 'Ricerca della Transazione',
    searchDescription: 'I nostri algoritmi avanzati stanno scansionando i database globali',
    processingText: 'Elaborazione',
    timeElapsed: 'Tempo Trascorso',
    invalidTransaction: 'Transazione Non Valida',

    // Results Page
    transactionLocated: 'Transazione Localizzata',
    foundAtBank: 'Abbiamo trovato la tua transazione presso Digital Chain Bank a Panama',
    originalAmount: 'Importo Originale',
    amountFound: 'Importo Trovato',
    bankInformation: 'Informazioni Bancarie',
    validTransaction: 'Transazione Valida',
    unlockMore: 'Sblocca Più Transazioni',
    upgradeDescription: 'Passa a Pro o Enterprise per rivelare altre 2 transazioni e ottenere funzionalità avanzate:',
    upgradeToPro: 'Passa a Pro',
    upgradeToEnterprise: 'Passa a Enterprise',
    proFeatures: [
      'Ricerca transazioni estesa',
      'Scansione database avanzata',
      'Supporto prioritario',
      'Assistenza ChatGPT 4',
      'Notifiche in tempo reale'
    ],
    enterpriseFeatures: [
      'Ricerca transazioni completa',
      'Accesso database globale',
      'Team di supporto dedicato',
      'Assistenza ChatGPT 4 Pro',
      'Analisi avanzate',
      'Strategie di recupero personalizzate'
    ],

    // Common
    loading: 'Caricamento...',
    error: 'Si è verificato un errore',
    tryAgain: 'Riprova',
    close: 'Chiudi',
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    success: 'Successo',
  },

  de: {
    // Code Entry
    enterCode: 'Code Eingeben',
    trackStatus: 'Verfolgen Sie den Status Ihrer Transaktionswiederherstellung',
    recoveryCode: 'Wiederherstellungscode',
    enterRecoveryCodePlaceholder: 'Geben Sie Ihren Wiederherstellungscode ein',
    invalidCode: 'Ungültiger Code. Bitte überprüfen Sie mit dem Administrator.',
    needCode: 'Keinen Code?',
    contactSupport: 'Support Kontaktieren',
    continue: 'Weiter',
    networkError: 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es erneut.',

    // Personal Info Form
    secureVerification: 'Sichere Verifizierung',
    provideDetails: 'Bitte geben Sie Ihre Daten zur Überprüfung ein',
    fullName: 'Vollständiger Name',
    emailAddress: 'E-Mail-Adresse',
    phoneNumber: 'Telefonnummer',
    currentAddress: 'Aktuelle Adresse',
    nationality: 'Nationalität',
    identityVerification: 'Identitätsüberprüfung',
    uploadIdDocument: 'Ausweisdokument hochladen',
    idDocumentTypes: 'JPG, PNG oder PDF (Nur Vorderseite)',
    startSearch: 'Suche Starten',
    byContinuing: 'Durch Fortfahren stimmen Sie unseren',
    termsAndConditions: 'Geschäftsbedingungen zu',

    // Email Verification
    verifyEmail: 'E-Mail Verifizieren',
    verifyEmailDesc: 'Bitte geben Sie den Verifizierungscode ein, der gesendet wurde an',
    enterVerificationCode: 'Verifizierungscode Eingeben',
    verifyCode: 'Code Verifizieren',
    backToForm: 'Zurück zum Formular',
    resendCode: 'Code Erneut Senden',
    emailAlreadyRegistered: 'Diese E-Mail ist bereits registriert',

    // Transaction Info Form
    transactionDetails: 'Transaktionsdetails',
    helpLocate: 'Helfen Sie uns, Ihre Transaktion zu finden, indem Sie die Details angeben',
    amount: 'Betrag',
    recipientName: 'Empfängername',
    companyName: 'Firmenname',
    transactionReason: 'Transaktionsgrund',
    cryptocurrency: 'Kryptowährung',
    bankTransfer: 'Banküberweisung',
    wireTransfer: 'Auslandsüberweisung',
    walletAddress: 'Wallet-Adresse',
    transactionProof: 'Transaktionsnachweis',
    uploadTransactionProof: 'Transaktionsnachweis hochladen',
    fileUploadTypes: 'JPG, PNG oder PDF Dateien akzeptiert',

    // Search Status
    searchTitle: 'Suche nach Ihrer Transaktion',
    searchDescription: 'Unsere fortschrittlichen Algorithmen durchsuchen globale Datenbanken',
    processingText: 'Verarbeitung',
    timeElapsed: 'Verstrichene Zeit',
    invalidTransaction: 'Ungültige Transaktion',

    // Results Page
    transactionLocated: 'Transaktion Gefunden',
    foundAtBank: 'Wir haben Ihre Transaktion bei der Digital Chain Bank in Panama gefunden',
    originalAmount: 'Ursprünglicher Betrag',
    amountFound: 'Gefundener Betrag',
    bankInformation: 'Bankinformationen',
    validTransaction: 'Gültige Transaktion',
    unlockMore: 'Weitere Transaktionen Freischalten',
    upgradeDescription: 'Upgraden Sie auf Pro oder Enterprise, um 2 weitere Transaktionen und erweiterte Funktionen freizuschalten:',
    upgradeToPro: 'Auf Pro Upgraden',
    upgradeToEnterprise: 'Auf Enterprise Upgraden',
    proFeatures: [
      'Erweiterte Transaktionssuche',
      'Erweiterte Datenbanksuche',
      'Prioritäts-Support',
      'ChatGPT 4 Unterstützung',
      'Echtzeit-Benachrichtigungen'
    ],
    enterpriseFeatures: [
      'Umfassende Transaktionssuche',
      'Globaler Datenbankzugriff',
      'Dediziertes Support-Team',
      'ChatGPT 4 Pro Unterstützung',
      'Erweiterte Analysen',
      'Individuelle Wiederherstellungsstrategien'
    ],

    // Common
    loading: 'Laden...',
    error: 'Ein Fehler ist aufgetreten',
    tryAgain: 'Bitte versuchen Sie es erneut',
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    success: 'Erfolg',
  },

  el: {
    // Code Entry
    enterCode: 'Εισάγετε τον Κωδικό σας',
    trackStatus: 'Παρακολουθήστε την κατάσταση ανάκτησης της συναλλαγής σας',
    recoveryCode: 'Κωδικός Ανάκτησης',
    enterRecoveryCodePlaceholder: 'Εισάγετε τον κωδικό ανάκτησης',
    invalidCode: 'Μη έγκυρος κωδικός. Παρακαλώ ελέγξτε με τον διαχειριστή.',
    needCode: 'Δεν έχετε κωδικό;',
    contactSupport: 'Επικοινωνήστε με την Υποστήριξη',
    continue: 'Συνέχεια',
    networkError: 'Παρουσιάστηκε σφάλμα δικτύου. Παρακαλώ δοκιμάστε ξανά.',

    // Personal Info Form
    secureVerification: 'Ασφαλής Επαλήθευση',
    provideDetails: 'Παρακαλώ παρέχετε τα στοιχεία σας για επαλήθευση',
    fullName: 'Πλήρες Όνομα',
    emailAddress: 'Διεύθυνση Email',
    phoneNumber: 'Αριθμός Τηλεφώνου',
    currentAddress: 'Τρέχουσα Διεύθυνση',
    nationality: 'Εθνικότητα',
    identityVerification: 'Επαλήθευση Ταυτότητας',
    uploadIdDocument: 'Μεταφόρτωση Εγγράφου Ταυτότητας',
    idDocumentTypes: 'JPG, PNG, ή PDF (Μόνο Μπροστινή Όψη)',
    startSearch: 'Έναρξη Αναζήτησης',
    byContinuing: 'Συνεχίζοντας, συμφωνείτε με τους',
    termsAndConditions: 'Όρους και Προϋποθέσεις',

    // Email Verification
    verifyEmail: 'Επαλήθευση Email',
    verifyEmailDesc: 'Παρακαλώ εισάγετε τον κωδικό επαλήθευσης που στάλθηκε στο',
    enterVerificationCode: 'Εισάγετε Κωδικό Επαλήθευσης',
    verifyCode: 'Επαλήθευση Κωδικού',
    backToForm: 'Επιστροφή στη Φόρμα',
    resendCode: 'Επαναποστολή Κωδικού',
    emailAlreadyRegistered: 'Αυτό το email είναι ήδη εγγεγραμμένο',

    // Transaction Info Form
    transactionDetails: 'Λεπτομέρειες Συναλλαγής',
    helpLocate: 'Βοηθήστε μας να εντοπίσουμε τη συναλλαγή σας παρέχοντας τις λεπτομέρειες',
    amount: 'Ποσό',
    recipientName: 'Όνομα Παραλήπτη',
    companyName: 'Όνομα Εταιρείας',
    transactionReason: 'Αιτία Συναλλαγής',
    cryptocurrency: 'Κρυπτονόμισμα',
    bankTransfer: 'Τραπεζική Μεταφορά',
    wireTransfer: 'Διεθνής Μεταφορά',
    walletAddress: 'Διεύθυνση Πορτοφολιού',
    transactionProof: 'Απόδειξη Συναλλαγής',
    uploadTransactionProof: 'Μεταφόρτωση Απόδειξης Συναλλαγής',
    fileUploadTypes: 'Αποδεκτά αρχεία JPG, PNG ή PDF',

    // Search Status
    searchTitle: 'Αναζήτηση της Συναλλαγής σας',
    searchDescription: 'Οι προηγμένοι αλγόριθμοί μας σαρώνουν παγκόσμιες βάσεις δεδομένων',
    processingText: 'Επεξεργασία',
    timeElapsed: 'Χρόνος που Πέρασε',
    invalidTransaction: 'Μη Έγκυρη Συναλλαγή',

    // Results Page
    transactionLocated: 'Η Συναλλαγή Εντοπίστηκε',
    foundAtBank: 'Εντοπίσαμε τη συναλλαγή σας στην Digital Chain Bank στον Παναμά',
    originalAmount: 'Αρχικό Ποσό',
    amountFound: 'Ποσό που Βρέθηκε',
    bankInformation: 'Στοιχεία Τράπεζας',
    validTransaction: 'Έγκυρη Συναλλαγή',
    unlockMore: 'Ξεκλειδώστε Περισσότερες Συναλλαγές',
    upgradeDescription: 'Αναβαθμίστε σε Pro ή Enterprise για να αποκαλύψετε 2 επιπλέον συναλλαγές και να αποκτήσετε προηγμένες λειτουργίες:',
    upgradeToPro: 'Αναβάθμιση σε Pro',
    upgradeToEnterprise: 'Αναβάθμιση σε Enterprise',
    proFeatures: [
      'Εκτεταμένη αναζήτηση συναλλαγών',
      'Προηγμένη σάρωση βάσης δεδομένων',
      'Προτεραιότητα υποστήριξης',
      'Βοήθεια ChatGPT 4',
      'Ειδοποιήσεις σε πραγματικό χρόνο'
    ],
    enterpriseFeatures: [
      'Πλήρης αναζήτηση συναλλαγών',
      'Παγκόσμια πρόσβαση σε βάσεις δεδομένων',
      'Αποκλειστική ομάδα υποστήριξης',
      'Βοήθεια ChatGPT 4 Pro',
      'Προηγμένες αναλύσεις',
      'Προσαρμοσμένες στρατηγικές ανάκτησης'
    ],

    // Common
    loading: 'Φόρτωση...',
    error: 'Παρουσιάστηκε σφάλμα',
    tryAgain: 'Παρακαλώ δοκιμάστε ξανά',
    close: 'Κλείσιμο',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    confirm: 'Επιβεβαίωση',
    success: 'Επιτυχία',
  },

  es: {
    // Code Entry
    enterCode: 'Ingrese su Código',
    trackStatus: 'Rastree el estado de la recuperación de su transacción',
    recoveryCode: 'Código de Recuperación',
    enterRecoveryCodePlaceholder: 'Ingrese su código de recuperación',
    invalidCode: 'Código inválido. Por favor verifique con el administrador.',
    needCode: '¿No tiene un código?',
    contactSupport: 'Contactar Soporte',
    continue: 'Continuar',
    networkError: 'Ocurrió un error de red. Por favor intente nuevamente.',

    // Personal Info Form
    secureVerification: 'Verificación Segura',
    provideDetails: 'Por favor proporcione sus datos para verificación',
    fullName: 'Nombre Completo',
    emailAddress: 'Correo Electrónico',
    phoneNumber: 'Número de Teléfono',
    currentAddress: 'Dirección Actual',
    nationality: 'Nacionalidad',
    identityVerification: 'Verificación de Identidad',
    uploadIdDocument: 'Subir Documento de Identidad',
    idDocumentTypes: 'JPG, PNG o PDF (Solo Frente)',
    startSearch: 'Iniciar Búsqueda',
    byContinuing: 'Al continuar, acepta nuestros',
    termsAndConditions: 'Términos y Condiciones',

    // Email Verification
    verifyEmail: 'Verificar su Email',
    verifyEmailDesc: 'Por favor ingrese el código de verificación enviado a',
    enterVerificationCode: 'Ingrese el Código de Verificación',
    verifyCode: 'Verificar Código',
    backToForm: 'Volver al Formulario',
    resendCode: 'Reenviar Código',
    emailAlreadyRegistered: 'Este email ya está registrado',

    // Transaction Info Form
    transactionDetails: 'Detalles de la Transacción',
    helpLocate: 'Ayúdenos a localizar su transacción proporcionando los detalles',
    amount: 'Monto',
    recipientName: 'Nombre del Destinatario',
    companyName: 'Nombre de la Empresa',
    transactionReason: 'Motivo de la Transacción',
    cryptocurrency: 'Criptomoneda',
    bankTransfer: 'Transferencia Bancaria',
    wireTransfer: 'Transferencia Internacional',
    walletAddress: 'Dirección de Billetera',
    transactionProof: 'Comprobante de Transacción',
    uploadTransactionProof: 'Subir Comprobante de Transacción',
    fileUploadTypes: 'Se aceptan archivos JPG, PNG o PDF',

    // Search Status
    searchTitle: 'Buscando su Transacción',
    searchDescription: 'Nuestros algoritmos avanzados están escaneando bases de datos globales',
    processingText: 'Procesando',
    timeElapsed: 'Tiempo Transcurrido',
    invalidTransaction: 'Transacción Inválida',

    // Results Page
    transactionLocated: 'Transacción Localizada',
    foundAtBank: 'Hemos encontrado su transacción en Digital Chain Bank en Panamá',
    originalAmount: 'Monto Original',
    amountFound: 'Monto Encontrado',
    bankInformation: 'Información Bancaria',
    validTransaction: 'Transacción Válida',
    unlockMore: 'Desbloquear Más Transacciones',
    upgradeDescription: 'Actualice a Pro o Enterprise para revelar 2 transacciones más y obtener funciones avanzadas:',
    upgradeToPro: 'Actualizar a Pro',
    upgradeToEnterprise: 'Actualizar a Enterprise',
    proFeatures: [
      'Búsqueda extendida de transacciones',
      'Escaneo avanzado de base de datos',
      'Soporte prioritario',
      'Asistencia ChatGPT 4',
      'Notificaciones en tiempo real'
    ],
    enterpriseFeatures: [
      'Búsqueda completa de transacciones',
      'Acceso global a base de datos',
      'Equipo de soporte dedicado',
      'Asistencia ChatGPT 4 Pro',
      'Análisis avanzados',
      'Estrategias de recuperación personalizadas'
    ],

    // Common
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    tryAgain: 'Por favor intente nuevamente',
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    success: 'Éxito',
  },

  fr: {
    // Code Entry
    enterCode: 'Entrez Votre Code',
    trackStatus: 'Suivez l\'état de la récupération de votre transaction',
    recoveryCode: 'Code de Récupération',
    enterRecoveryCodePlaceholder: 'Entrez votre code de récupération',
    invalidCode: 'Code invalide. Veuillez vérifier avec l\'administrateur.',
    needCode: 'Vous n\'avez pas de code ?',
    contactSupport: 'Contacter le Support',
    continue: 'Continuer',
    networkError: 'Une erreur réseau s\'est produite. Veuillez réessayer.',

    // Personal Info Form
    secureVerification: 'Vérification Sécurisée',
    provideDetails: 'Veuillez fournir vos informations pour la vérification',
    fullName: 'Nom Complet',
    emailAddress: 'Adresse Email',
    phoneNumber: 'Numéro de Téléphone',
    currentAddress: 'Adresse Actuelle',
    nationality: 'Nationalité',
    identityVerification: 'Vérification d\'Identité',
    uploadIdDocument: 'Télécharger Document d\'Identité',
    idDocumentTypes: 'JPG, PNG ou PDF (Recto Uniquement)',
    startSearch: 'Démarrer la Recherche',
    byContinuing: 'En continuant, vous acceptez nos',
    termsAndConditions: 'Conditions Générales',

    // Email Verification
    verifyEmail: 'Vérifiez votre Email',
    verifyEmailDesc: 'Veuillez entrer le code de vérification envoyé à',
    enterVerificationCode: 'Entrez le Code de Vérification',
    verifyCode: 'Vérifier le Code',
    backToForm: 'Retour au Formulaire',
    resendCode: 'Renvoyer le Code',
    emailAlreadyRegistered: 'Cet email est déjà enregistré',

    // Transaction Info Form
    transactionDetails: 'Détails de la Transaction',
    helpLocate: 'Aidez-nous à localiser votre transaction en fournissant les détails',
    amount: 'Montant',
    recipientName: 'Nom du Destinataire',
    companyName: 'Nom de l\'Entreprise',
    transactionReason: 'Motif de la Transaction',
    cryptocurrency: 'Cryptomonnaie',
    bankTransfer: 'Virement Bancaire',
    wireTransfer: 'Virement International',
    walletAddress: 'Adresse du Portefeuille',
    transactionProof: 'Preuve de Transaction',
    uploadTransactionProof: 'Télécharger Preuve de Transaction',
    fileUploadTypes: 'Fichiers JPG, PNG ou PDF acceptés',

    // Search Status
    searchTitle: 'Recherche de Votre Transaction',
    searchDescription: 'Nos algorithmes avancés analysent les bases de données mondiales',
    processingText: 'Traitement',
    timeElapsed: 'Temps Écoulé',
    invalidTransaction: 'Transaction Invalide',

    // Results Page
    
    transactionLocated: 'Transaction Localisée',
    foundAtBank: 'Nous avons trouvé votre transaction à Digital Chain Bank au Panama',
    originalAmount: 'Montant Original',
    amountFound: 'Montant Trouvé',
    bankInformation: 'Informations Bancaires',
    validTransaction: 'Transaction Valide',
    unlockMore: 'Débloquer Plus de Transactions',
    upgradeDescription: 'Passez à Pro ou Enterprise pour révéler 2 transactions supplémentaires et obtenir des fonctionnalités avancées :',
    upgradeToPro: 'Passer à Pro',
    upgradeToEnterprise: 'Passer à Enterprise',
    proFeatures: [
      'Recherche étendue de transactions',
      'Analyse avancée de base de données',
      'Support prioritaire',
      'Assistance ChatGPT 4',
      'Notifications en temps réel'
    ],
    enterpriseFeatures: [
      'Recherche complète de transactions',
      'Accès global aux bases de données',
      'Équipe de support dédiée',
      'Assistance ChatGPT 4 Pro',
      'Analyses avancées',
      'Stratégies de récupération personnalisées'
    ],

    // Common
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    tryAgain: 'Veuillez réessayer',
    close: 'Fermer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    success: 'Succès',
  }
};