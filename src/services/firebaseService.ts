/**
 * Centralized Firebase Service Barrel Module
 *
 * Re-exports all domain-specific Firebase services for full backward compatibility.
 * Domain modules:
 * - firebaseCore: Base Auth, error handling, config, audit logs
 * - firebaseAuth: User profiles, student account management, login inquiries
 * - firebaseMatches: Matches CRUD, scoring, tournament advancement, reminders, score approvals, commentaries
 * - firebaseCheers: Cheer counts, cheer feeds, live reactions
 * - firebaseNotices: Notices, lineups, messages, injuries, suggestions, MVP votes, app documents
 */

export * from './firebase/firebaseCore';
export * from './firebase/firebaseAuth';
export * from './firebase/firebaseMatches';
export * from './firebase/firebaseCheers';
export * from './firebase/firebaseNotices';
export * from './offlineScoreQueue';
