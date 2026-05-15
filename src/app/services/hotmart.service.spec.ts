import { TestBed } from '@angular/core/testing';
import { HotmartService } from './hotmart.service';

describe('HotmartService', () => {
    let service: HotmartService;

    beforeEach(() => {
        sessionStorage.clear();
        TestBed.configureTestingModule({ providers: [HotmartService] });
        service = TestBed.inject(HotmartService);
    });

    it('should generate auth URL with client_id and state', () => {
        const url = service.generateAuthUrl();
        expect(url).toContain('hotmart.com');
        expect(url).toContain('client_id=');
        expect(url).toContain('state=');
        expect(url).toContain('redirect_uri=');
    });

    it('should store state in sessionStorage', () => {
        service.generateAuthUrl();
        expect(sessionStorage.getItem('hotmart_state')).not.toBeNull();
    });

    it('should validate state when matches', () => {
        const state = 'test-state-123';
        sessionStorage.setItem('hotmart_state', state);
        expect(service.validateState(state)).toBe(true);
    });

    it('should reject state when not matching', () => {
        sessionStorage.setItem('hotmart_state', 'real-state');
        expect(service.validateState('wrong-state')).toBe(false);
    });

    it('should reject state when null', () => {
        expect(service.validateState(null)).toBe(false);
    });

    it('should clean sessionStorage after validation', () => {
        sessionStorage.setItem('hotmart_state', 'state');
        service.validateState('state');
        expect(sessionStorage.getItem('hotmart_state')).toBeNull();
    });

    it('should return error when state validation fails in handleCallback', async () => {
        const result = await service.handleCallback('code-123', 'wrong-state');
        expect(result.error).toBeTruthy();
    });

    it('should return error when callback fetch fails', async () => {
        sessionStorage.setItem('hotmart_state', 'state-1');
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        vi.stubGlobal('fetch', mockFetch);
        const result = await service.handleCallback('code-123', 'state-1');
        expect(result.error).toContain('Network error');
        vi.unstubAllGlobals();
    });
});
