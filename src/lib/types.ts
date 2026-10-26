// Shapes returned by TBN-Server src/modules/admin/admin.service.ts

export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INFO_REQUESTED"
  | "SUSPENDED";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type Role = "HOMEOWNER" | "TRADESPERSON" | "ADMIN";
export type JobStatus = "ACTIVE" | "HIRED" | "COMPLETED" | "CLOSED" | "EXPIRED";
export type CreditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface Stats {
  pendingVerifications: number;
  infoRequested: number;
  approvedTrades: number;
  homeowners: number;
  tradespeople: number;
  activeJobs: number;
  totalJobs: number;
  pendingCreditRequests: number;
  revenuePence: number;
}

export interface VerificationRow {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  username: string;
  companyName: string | null;
  trade: string | null;
  postcode: string | null;
  services: string[];
  hasIdDocument: boolean;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  joinedAt: string;
}

export interface CreditAccount {
  balance: number;
  reserved: number;
  autoTopup: boolean;
  topupAmount: number | null;
  topupThreshold: number | null;
  lastTopupAt: string | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  details: unknown;
  adminName: string;
  createdAt: string;
}

export interface TradespersonDetail {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    accountStatus: AccountStatus;
    suspensionReason: string | null;
    createdAt: string;
    lastLoginAt: string | null;
  };
  profile: {
    username: string;
    companyName: string | null;
    bio: string | null;
    trade: string | null;
    postcode: string | null;
    workRadiusMiles: number;
    idDocumentUrl: string | null;
    idDocumentName: string | null;
    idDocumentUploadedAt: string | null;
    idDocumentUrlExpiresInSeconds: number | null;
    verificationStatus: VerificationStatus;
    verificationNote: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
    reviewedAt: string | null;
    reviewedByName: string | null;
    publicLiability: string | null;
    employersLiability: string | null;
    professionalIndemnity: string | null;
    insuranceVerified: boolean;
    insuranceExpiresAt: string | null;
    guarantee: boolean;
    responseTime: string | null;
    avgRating: number;
    reviewCount: number;
    completedJobs: number;
    services: { serviceSlug: string; serviceName: string; tradeSlug: string | null }[];
    qualifications: { id: string; name: string; verified: boolean; year: number | null }[];
    documents: { id: string; fileUrl: string; fileName: string; mimeType: string; createdAt: string }[];
    portfolioItems: { id: string; imageUrl: string; title: string | null; category: string | null }[];
  };
  credits: CreditAccount;
  leads: Record<string, number>;
  auditLog: AuditEntry[];
}

export interface CreditTx {
  id: string;
  type: string;
  amount: number;
  reservedChange: number;
  balanceAfter: number;
  reservedAfter: number;
  leadId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreditRequestRow {
  id: string;
  reason: string;
  details: string;
  credits: number;
  status: CreditRequestStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  tradesperson: { id: string; name: string; email: string };
  lead: { id: string; status: string; shortlistedAt: string | null };
  job: {
    id: string;
    jobNumber: number;
    title: string;
    status: JobStatus;
    homeowner: { name: string; email: string };
  };
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  username: string | null;
  verificationStatus: VerificationStatus | null;
  avgRating: number | null;
  reviewCount: number | null;
  credits: { balance: number; reserved: number } | null;
  jobsPosted: number;
}

export interface JobRow {
  id: string;
  jobNumber: number;
  title: string;
  serviceSlug: string;
  postcode: string;
  status: JobStatus;
  leadFeeCredits: number;
  createdAt: string;
  hiredAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  homeowner: { id: string; name: string; email: string };
  hiredTradesperson: { id: string; name: string } | null;
  leadsSent: number;
  interested: number;
}

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  createdAt: string;
  author: { id: string; name: string };
  subject: { id: string; name: string };
  job: { id: string; jobNumber: number; title: string } | null;
}

export interface ServiceRow {
  slug: string;
  name: string;
  leadFeeCredits: number;
}

export interface AuditLogRow {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: unknown;
  createdAt: string;
  admin: { name: string; email: string };
}
