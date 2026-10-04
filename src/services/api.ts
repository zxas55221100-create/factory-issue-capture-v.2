import { Issue, FREE_FIELDS } from '../types.ts';
import { LocalStorageService } from './storage.ts';

export interface ApiResponse<T = unknown> {
  ok?: boolean;
  error?: string;
  data?: T;
  id?: string;
}

export const ApiService = {
  getWebAppUrl(): string {
    return LocalStorageService.getWebAppUrl();
  },

  hasWebAppConfigured(): boolean {
    const url = this.getWebAppUrl();
    return Boolean(url && url.startsWith('http'));
  },

  async fetchAll(): Promise<{ issues: Issue[]; cats: string; lineToken?: string; isRemote: boolean }> {
    const url = this.getWebAppUrl();
    if (!url) {
      return {
        issues: LocalStorageService.getIssues(),
        cats: LocalStorageService.getCategories(),
        lineToken: LocalStorageService.getLineToken(),
        isRemote: false,
      };
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      if (json && Array.isArray(json.issues)) {
        // Sync local storage copy as cache
        LocalStorageService.saveIssues(json.issues);
        if (json.cats) {
          LocalStorageService.saveCategories(json.cats);
        }
        if (json.lineToken) {
          LocalStorageService.setLineToken(json.lineToken);
        }
        return {
          issues: json.issues,
          cats: json.cats || LocalStorageService.getCategories(),
          lineToken: json.lineToken || LocalStorageService.getLineToken(),
          isRemote: true,
        };
      }
      throw new Error('Invalid format from Web App');
    } catch (err) {
      console.warn('Failed to fetch from Web App URL, using local cache:', err);
      return {
        issues: LocalStorageService.getIssues(),
        cats: LocalStorageService.getCategories(),
        lineToken: LocalStorageService.getLineToken(),
        isRemote: false,
      };
    }
  },

  async verifyPin(pin: string): Promise<boolean> {
    const url = this.getWebAppUrl();
    if (!url) {
      // Local check
      return pin === LocalStorageService.getAdminPin();
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Plain text prevents unnecessary CORS preflight in GAS
        },
        body: JSON.stringify({ action: 'checkPin', pin }),
      });
      const data = await res.json();
      return Boolean(data.ok);
    } catch {
      // Fallback local check
      return pin === LocalStorageService.getAdminPin();
    }
  },

  async addIssue(
    issue: Omit<Issue, 'id' | 'created' | 'status' | 'closedAt' | 'fixMethod' | 'fixBy'>
  ): Promise<{ ok: boolean; id: string; error?: string }> {
    if (!issue.who || !issue.who.trim()) {
      return { ok: false, id: '', error: 'who_required' };
    }

    // Save reporter name for convenience
    LocalStorageService.setLastReporter(issue.who);

    const url = this.getWebAppUrl();
    const generatedId = Math.random().toString(36).substring(2, 10);
    const newIssue: Issue = {
      ...issue,
      id: generatedId,
      created: Date.now(),
      status: 'Open',
      closedAt: 0,
      fixMethod: '',
      fixBy: '',
    };

    if (url) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'add', issue: newIssue }),
        });
        const data = await res.json();
        if (data.ok) {
          newIssue.id = data.id || generatedId;
        }
      } catch (err) {
        console.warn('Web App POST failed, saving locally:', err);
      }
    }

    // Always update local cache so UI reacts immediately
    const existing = LocalStorageService.getIssues();
    const updated = [newIssue, ...existing];
    LocalStorageService.saveIssues(updated);

    return { ok: true, id: newIssue.id };
  },

  async updateIssue(
    id: string,
    fields: Partial<Issue>,
    pin?: string
  ): Promise<{ ok: boolean; error?: string }> {
    const keys = Object.keys(fields) as (keyof Issue)[];
    const requiresPin = keys.some(k => !FREE_FIELDS.includes(k as (typeof FREE_FIELDS)[number]));

    if (requiresPin) {
      const isValid = await this.verifyPin(pin || '');
      if (!isValid) {
        return { ok: false, error: 'pin' };
      }
    }

    const url = this.getWebAppUrl();
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'update',
            id,
            fields,
            pin: pin || '',
          }),
        });
      } catch (err) {
        console.warn('Web App update failed, saving locally:', err);
      }
    }

    // Update local cache
    const existing = LocalStorageService.getIssues();
    const updated = existing.map(item => {
      if (item.id === id) {
        return { ...item, ...fields };
      }
      return item;
    });
    LocalStorageService.saveIssues(updated);

    return { ok: true };
  },

  async deleteIssues(ids: string[], pin: string): Promise<{ ok: boolean; error?: string }> {
    const isValid = await this.verifyPin(pin);
    if (!isValid) {
      return { ok: false, error: 'pin' };
    }

    const url = this.getWebAppUrl();
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'delete',
            ids,
            pin,
          }),
        });
      } catch (err) {
        console.warn('Web App delete failed, deleting locally:', err);
      }
    }

    const existing = LocalStorageService.getIssues();
    const idSet = new Set(ids);
    const updated = existing.filter(i => !idSet.has(i.id));
    LocalStorageService.saveIssues(updated);

    return { ok: true };
  },

  async saveCategories(text: string, pin: string): Promise<{ ok: boolean; error?: string }> {
    const isValid = await this.verifyPin(pin);
    if (!isValid) {
      return { ok: false, error: 'pin' };
    }

    const url = this.getWebAppUrl();
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveCats',
            text,
            pin,
          }),
        });
      } catch (err) {
        console.warn('Web App saveCats failed, saving locally:', err);
      }
    }

    LocalStorageService.saveCategories(text);
    return { ok: true };
  },

  async uploadPhoto(dataUrl: string): Promise<{ ok: boolean; photoUrl: string; error?: string }> {
    const url = this.getWebAppUrl();
    if (url) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'photo',
            data: dataUrl,
          }),
        });
        const data = await res.json();
        if (data && data.id) {
          // Google Drive direct view link or Drive ID
          const driveLink = `https://drive.google.com/uc?id=${data.id}`;
          return { ok: true, photoUrl: driveLink };
        }
      } catch (err) {
        console.warn('Web App photo upload failed, using local DataURL:', err);
      }
    }

    // Local storage / offline mode: retain dataUrl for preview
    return { ok: true, photoUrl: dataUrl };
  },

  async saveLineToken(token: string, pin: string): Promise<{ ok: boolean; error?: string }> {
    const isValid = await this.verifyPin(pin);
    if (!isValid) {
      return { ok: false, error: 'pin' };
    }

    const url = this.getWebAppUrl();
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveLineToken',
            token,
            pin,
          }),
        });
      } catch (err) {
        console.warn('Web App saveLineToken failed, saving locally:', err);
      }
    }

    LocalStorageService.setLineToken(token);
    return { ok: true };
  },

  async testLineNotify(token: string): Promise<{ ok: boolean; error?: string }> {
    const url = this.getWebAppUrl();
    if (url) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'testLineNotify',
            token,
            who: 'ผู้ทดสอบระบบ',
          }),
        });
        const data = await res.json();
        return { ok: Boolean(data.ok), error: data.error };
      } catch (err) {
        console.warn('Web App testLineNotify failed:', err);
      }
    }

    // In local / offline simulation
    return { ok: true };
  },
};
