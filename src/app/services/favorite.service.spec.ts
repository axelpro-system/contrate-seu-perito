import { TestBed } from '@angular/core/testing';
import { FavoriteService } from './favorite.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

describe('FavoriteService', () => {
    let service: FavoriteService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FavoriteService,
                { provide: SupabaseService, useValue: { client: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) } } },
                { provide: AuthService, useValue: { userProfile: () => ({ id: 'test-user' }), initialized: Promise.resolve() } },
            ]
        });
        service = TestBed.inject(FavoriteService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start with empty favorites', () => {
        expect(service.favoriteIds().size).toBe(0);
    });

    it('should return false for non-favorite', () => {
        expect(service.isFavorite('some-id')).toBeFalsy();
    });
});
