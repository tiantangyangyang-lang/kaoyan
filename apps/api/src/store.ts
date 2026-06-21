export interface PublicUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface PasswordUser extends PublicUser {
  passwordHash: string;
}

export interface LearningStateRecord {
  questionStates: Record<string, unknown>;
  paperSessions: Record<string, unknown>;
  updatedAt: string;
}

export type RegistrationResult =
  | { status: "ready"; userId: string }
  | { status: "email_taken" };

export interface AuthStore {
  registerUser(input: {
    email: string;
    passwordHash: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  }): Promise<RegistrationResult>;
  replaceVerificationToken(input: {
    email: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  }): Promise<"ready" | "already_verified" | "not_found">;
  verifyEmail(tokenHash: string): Promise<PublicUser | null>;
  findUserByEmail(email: string): Promise<PasswordUser | null>;
  createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findUserBySession(tokenHash: string): Promise<PublicUser | null>;
  deleteSession(tokenHash: string): Promise<void>;
  getLearningState(
    userId: string,
    subjectCode: string,
  ): Promise<LearningStateRecord | null>;
  saveLearningState(input: {
    userId: string;
    subjectCode: string;
    questionStates: Record<string, unknown>;
    paperSessions: Record<string, unknown>;
  }): Promise<void>;
}
