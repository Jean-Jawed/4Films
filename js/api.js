// ===== MODULE API TMDB =====
// Gère toutes les interactions avec l'API The Movie Database

import { API_KEY } from './config.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// ===== HELPER FUNCTIONS =====

/**
 * Construit une URL pour l'API TMDB
 * @param {string} endpoint - L'endpoint de l'API (ex: '/discover/movie')
 * @param {Object} params - Paramètres de requête additionnels
 * @returns {string} URL complète
 */
const buildUrl = (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'fr-FR');
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.append(key, value);
        }
    });
    
    return url.toString();
};

/**
 * Effectue une requête à l'API TMDB
 * @param {string} url - URL complète de la requête
 * @returns {Promise<Object>} Données JSON de la réponse
 * @throws {Error} Si la requête échoue
 */
const fetchApi = async (url) => {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la requête API:', error);
        throw error;
    }
};

/**
 * Construit une URL complète pour une image TMDB
 * @param {string} path - Chemin de l'image (ex: '/abc123.jpg')
 * @param {string} size - Taille souhaitée (ex: 'w500', 'original')
 * @returns {string} URL complète de l'image
 */
export const getImageUrl = (path, size = 'w500') => {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
};

// ===== GENRES =====

/**
 * Récupère la liste de tous les genres de films
 * @returns {Promise<Array>} Liste des genres
 */
export const getGenres = async () => {
    try {
        const url = buildUrl('/genre/movie/list');
        const data = await fetchApi(url);
        return data.genres;
    } catch (error) {
        console.error('Erreur lors de la récupération des genres:', error);
        return [];
    }
};

// ===== DISCOVER MOVIES =====

/**
 * Découvre des films selon des filtres
 * @param {Object} filters - Filtres de recherche
 * @param {string} filters.genre - ID du genre
 * @param {string} filters.year - Année de sortie
 * @param {string} filters.country - Code langue du pays
 * @param {string} filters.platform - ID de la plateforme streaming
 * @param {string} filters.actor - ID de l'acteur
 * @returns {Promise<Array>} Top 4 des films
 */
export const discoverMovies = async (filters) => {
    try {
        const params = {
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100, // Au moins 100 votes pour éviter les films obscurs
            include_adult: false
        };
        
        // Genre
        if (filters.genre) {
            params.with_genres = filters.genre;
        }
        
        // Année
        if (filters.year) {
            params.primary_release_year = filters.year;
        }
        
        // Pays (langue originale)
        if (filters.country) {
            params.with_original_language = filters.country;
        }
        
        // Plateforme streaming
        if (filters.platform) {
            params.with_watch_providers = filters.platform;
            params.watch_region = 'FR';
        }
        
        // Acteur
        if (filters.actor) {
            params.with_cast = filters.actor;
        }
        
        const url = buildUrl('/discover/movie', params);
        const data = await fetchApi(url);
        
        // Retourner seulement les 4 premiers films
        return data.results.slice(0, 4);
    } catch (error) {
        console.error('Erreur lors de la découverte de films:', error);
        throw error;
    }
};

// ===== SEARCH =====

/**
 * Recherche des films par nom
 * @param {string} query - Terme de recherche
 * @returns {Promise<Array>} Liste de films correspondants
 */
export const searchMovie = async (query) => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const url = buildUrl('/search/movie', { query: query.trim() });
        const data = await fetchApi(url);
        return data.results.slice(0, 10); // Limiter à 10 résultats
    } catch (error) {
        console.error('Erreur lors de la recherche de films:', error);
        return [];
    }
};

/**
 * Recherche des acteurs/personnes par nom
 * @param {string} query - Terme de recherche
 * @returns {Promise<Array>} Liste de personnes correspondantes
 */
export const searchPerson = async (query) => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const url = buildUrl('/search/person', { query: query.trim() });
        const data = await fetchApi(url);
        return data.results.slice(0, 10); // Limiter à 10 résultats
    } catch (error) {
        console.error('Erreur lors de la recherche de personnes:', error);
        return [];
    }
};

// ===== SIMILAR MOVIES =====

/**
 * Récupère les films similaires à un film donné
 * @param {number} movieId - ID du film de référence
 * @returns {Promise<Array>} Top 4 des films similaires
 */
export const getSimilarMovies = async (movieId) => {
    try {
        const url = buildUrl(`/movie/${movieId}/recommendations`);
        const data = await fetchApi(url);
        
        // Retourner les 4 meilleurs films similaires
        return data.results.slice(0, 4);
    } catch (error) {
        console.error('Erreur lors de la récupération des films similaires:', error);
        throw error;
    }
};

// ===== MOVIE DETAILS =====

/**
 * Récupère les détails complets d'un film
 * @param {number} movieId - ID du film
 * @returns {Promise<Object>} Détails du film
 */
export const getMovieDetails = async (movieId) => {
    try {
        const url = buildUrl(`/movie/${movieId}`);
        return await fetchApi(url);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du film:', error);
        throw error;
    }
};

// ===== WATCH PROVIDERS =====

/**
 * Récupère les plateformes de streaming disponibles pour un film
 * @param {number} movieId - ID du film
 * @returns {Promise<Object|null>} Informations de streaming pour la France
 */
export const getWatchProviders = async (movieId) => {
    try {
        const url = buildUrl(`/movie/${movieId}/watch/providers`);
        const data = await fetchApi(url);
        
        // Retourner les infos pour la France
        return data.results?.FR || null;
    } catch (error) {
        console.error('Erreur lors de la récupération des plateformes:', error);
        return null;
    }
};

/**
 * Récupère le logo d'une plateforme streaming
 * @param {string} logoPath - Chemin du logo
 * @returns {string} URL complète du logo
 */
export const getProviderLogo = (logoPath) => {
    return getImageUrl(logoPath, 'w92');
};

// ===== EXPORT UTILITIES =====

export const IMAGE_SIZES = {
    POSTER_SMALL: 'w185',
    POSTER_MEDIUM: 'w342',
    POSTER_LARGE: 'w500',
    POSTER_ORIGINAL: 'original',
    BACKDROP_SMALL: 'w300',
    BACKDROP_MEDIUM: 'w780',
    BACKDROP_LARGE: 'w1280',
    BACKDROP_ORIGINAL: 'original',
    PROFILE_SMALL: 'w45',
    PROFILE_MEDIUM: 'w185',
    LOGO: 'w92'
};