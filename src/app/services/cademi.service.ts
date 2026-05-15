import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface CademiCourse {
    id: string;
    name: string;
    issuer: string;
    completionDate: string;
    credentialId?: string;
}

export interface CademiUser {
    id: string;
    name: string;
    email: string;
    courses: CademiCourse[];
    certifications: string[];
}

@Injectable({ providedIn: 'root' })
export class CademiService {
    private baseUrl = environment.cademiProxyUrl || 'https://api.cademi.com.br/v1';

    private sanitizeInput(input: string): string {
        return input
            .replace(/[<>&"'/]/g, (char) => {
                const escapeMap: Record<string, string> = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '/': '&#x2F;',
                };
                return escapeMap[char] || char;
            })
            .trim();
    }

    private sanitizeQueryParams(params: Record<string, any>): Record<string, string> {
        const sanitized: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = String(value);
            }
        }
        return sanitized;
    }

    private buildUrl(path: string, params?: Record<string, any>): string {
        const sanitizedParams = params ? this.sanitizeQueryParams(params) : {};
        const queryString = new URLSearchParams(sanitizedParams).toString();
        return `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
    }

    async getUserProfile(userId: string): Promise<CademiUser | null> {
        const sanitizedId = this.sanitizeInput(userId);
        try {
            const response = await fetch(this.buildUrl(`/users/${sanitizedId}`));
            if (!response.ok) return null;
            return response.json();
        } catch {
            return null;
        }
    }

    async getUserCourses(userId: string): Promise<CademiCourse[]> {
        const sanitizedId = this.sanitizeInput(userId);
        try {
            const response = await fetch(this.buildUrl(`/users/${sanitizedId}/courses`));
            if (!response.ok) return [];
            return response.json();
        } catch {
            return [];
        }
    }

    async getUserCertifications(userId: string): Promise<string[]> {
        const sanitizedId = this.sanitizeInput(userId);
        try {
            const response = await fetch(this.buildUrl(`/users/${sanitizedId}/certifications`));
            if (!response.ok) return [];
            return response.json();
        } catch {
            return [];
        }
    }

    async getFullUserProfile(userId: string): Promise<CademiUser | null> {
        const results = await Promise.allSettled([
            this.getUserProfile(userId),
            this.getUserCourses(userId),
            this.getUserCertifications(userId),
        ]);

        const profile = results[0].status === 'fulfilled' ? results[0].value : null;
        const courses = results[1].status === 'fulfilled' ? results[1].value : [];
        const certifications = results[2].status === 'fulfilled' ? results[2].value : [];

        if (!profile) return null;

        return {
            ...profile,
            courses,
            certifications,
        };
    }

    async searchCourses(query: string): Promise<CademiCourse[]> {
        const sanitizedQuery = this.sanitizeInput(query);
        try {
            const response = await fetch(this.buildUrl('/courses/search', { q: sanitizedQuery }));
            if (!response.ok) return [];
            return response.json();
        } catch {
            return [];
        }
    }

    async verifyCredential(credentialId: string): Promise<boolean> {
        const sanitizedId = this.sanitizeInput(credentialId);
        try {
            const response = await fetch(this.buildUrl(`/credentials/${sanitizedId}/verify`));
            if (!response.ok) return false;
            const data = await response.json();
            return data.valid === true;
        } catch {
            return false;
        }
    }
}
