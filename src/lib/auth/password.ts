import { compare, hash } from "bcryptjs";

const HASH_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

