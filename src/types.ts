export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  identityDocument: File | null;
}

export interface TransactionInfo {
  date: string;
  amount: number;
  recipientName: string;
  companyName: string;
  reason: string;
  paymentMethod: string;
  walletAddress: string;
  transactionProof: File | null;
}

export interface TrackingStatus {
  status: 'searching' | 'found' | 'not_found';
  location?: string;
  details?: {
    amount: number;
    bitcoinAmount: number;
    transactionId: string;
    bankEmail: string;
    bankAddress: string;
  }[];
}

export interface UserSubmission {
  id: string;
  secretCode: string;
  personalInfo: PersonalInfo;
  transactionInfo: TransactionInfo;
  status: TrackingStatus;
  createdAt: string;
}