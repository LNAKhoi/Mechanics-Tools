import bcrypt from 'bcryptjs';

const COST = 12;

/** bcrypt only uses the first 72 bytes; longer passwords are rejected rather than silently truncated. */
export const MAX_PASSWORD_BYTES = 72;
export const passwordBytes = (password: string) => Buffer.byteLength(password, 'utf8');

export const hashPassword = (password: string) => bcrypt.hash(password, COST);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** Compared against when the email is unknown, so response timing does not reveal which emails exist. */
export const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', COST);
