import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules', () => {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  it('should exist and contain valid rules header', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('service cloud.firestore');
  });

  const protectedCollections = [
    'users',
    'notices',
    'matches',
    'system',
    'app_documents'
  ];

  protectedCollections.forEach((collectionName) => {
    it(`should deny client write access for /${collectionName}`, () => {
      // Find the match block for the collection
      const collectionRegex = new RegExp(
        `match\\s+\\/${collectionName}\\/\\{[^\\}]+\\}\\s*\\{([^\\}]+)\\}`,
        'm'
      );
      const match = collectionRegex.exec(rulesContent);
      expect(match).not.toBeNull();

      if (match) {
        const blockContent = match[1];
        expect(blockContent).toContain('allow read: if true;');
        expect(blockContent).toContain('allow write: if false;');
        expect(blockContent).not.toContain('allow write: if true;');
      }
    });
  });
});
