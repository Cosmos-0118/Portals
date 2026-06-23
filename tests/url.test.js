import { describe, it, expect } from 'vitest';
import { getCleanDomain, constructUrl, findActiveProject } from '../src/utils/url.js';

describe('URL Utils', () => {
  describe('getCleanDomain', () => {
    it('removes protocols', () => {
      expect(getCleanDomain('https://app.com')).toBe('app.com');
      expect(getCleanDomain('http://localhost:3000')).toBe('localhost:3000');
    });

    it('removes trailing slashes', () => {
      expect(getCleanDomain('staging.app.com/')).toBe('staging.app.com');
      expect(getCleanDomain('https://myapp.com/')).toBe('myapp.com');
    });
  });

  describe('constructUrl', () => {
    it('preserves paths, query parameters, and hashes', () => {
      const result = constructUrl('https://app.com/users/123?tab=settings#top', 'staging.app.com');
      expect(result).toBe('https://staging.app.com/users/123?tab=settings#top');
    });

    it('uses http for localhost', () => {
      const result = constructUrl('https://app.com/api', 'localhost:8080');
      expect(result).toBe('http://localhost:8080/api');
    });

    it('uses http for IP addresses', () => {
      const result = constructUrl('https://app.com/dashboard', '127.0.0.1:3000');
      expect(result).toBe('http://127.0.0.1:3000/dashboard');
    });

    it('uses http for bare ports', () => {
      const result = constructUrl('https://app.com', 'dev:4000');
      expect(result).toBe('http://dev:4000/');
    });

    it('cleans user input with protocols', () => {
      const result = constructUrl('http://localhost:3000/test', 'https://prod.com');
      expect(result).toBe('https://prod.com/test');
    });

    it('handles root path', () => {
      const result = constructUrl('https://app.com', 'localhost:3000');
      expect(result).toBe('http://localhost:3000/');
    });

    it('handles encoded characters in path', () => {
      const result = constructUrl('https://app.com/users/john%20doe', 'staging.com');
      expect(result).toBe('https://staging.com/users/john%20doe');
    });
  });

  describe('findActiveProject', () => {
    const mockProjects = [
      {
        id: 'proj_1',
        envs: [
          { domain: 'localhost:3000' },
          { domain: 'staging.app.com' }
        ]
      },
      {
        id: 'proj_2',
        envs: [
          { domain: 'admin.app.com' },
          { domain: 'api.app.com' }
        ]
      }
    ];

    it('finds project by exact match', () => {
      expect(findActiveProject(mockProjects, 'http://localhost:3000/test')).toBe('proj_1');
      expect(findActiveProject(mockProjects, 'https://admin.app.com/dashboard')).toBe('proj_2');
    });

    it('finds project by subdomain match', () => {
      expect(findActiveProject(mockProjects, 'https://test.staging.app.com')).toBe('proj_1');
    });

    it('returns null if no match', () => {
      expect(findActiveProject(mockProjects, 'https://google.com')).toBeNull();
    });
    
    it('handles protocols in config gracefully', () => {
      const badConfig = [{ id: 'proj_bad', envs: [{ domain: 'https://bad.com/' }] }];
      expect(findActiveProject(badConfig, 'https://bad.com/test')).toBe('proj_bad');
    });
  });
});
