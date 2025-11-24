// ===== MODULE SIMILAR MOVIES =====
// Gère la recherche de films similaires

import { searchMovie, getImageUrl, IMAGE_SIZES } from './api.js';

let selectedMovieId = null;
let movieDebounceTimer = null;

// ===== INITIALIZATION =====

/**
 * Initialise l'autocomplete pour la recherche de films
 */
export const initSimilarSearch = () => {
    const input = document.getElementById('movie-input');
    const suggestionsContainer = document.getElementById('movie-suggestions');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timer
        if (movieDebounceTimer) {
            clearTimeout(movieDebounceTimer);
        }
        
        // Debounce pour éviter trop de requêtes
        movieDebounceTimer = setTimeout(async () => {
            if (query.length >= 2) {
                const results = await searchMovie(query);
                displayMovieSuggestions(results, suggestionsContainer, input);
            } else {
                suggestionsContainer.classList.remove('show');
                suggestionsContainer.innerHTML = '';
            }
        }, 300);
    });
    
    // Fermer les suggestions si click ailleurs
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.remove('show');
        }
    });
};

// ===== SUGGESTIONS =====

/**
 * Affiche les suggestions de films
 * @param {Array} movies - Liste de films
 * @param {HTMLElement} container - Conteneur des suggestions
 * @param {HTMLInputElement} input - Input de recherche
 */
const displayMovieSuggestions = (movies, container, input) => {
    container.innerHTML = '';
    
    if (movies.length === 0) {
        container.innerHTML = '<div class="no-suggestions">Aucun film trouvé</div>';
        container.classList.add('show');
        return;
    }
    
    movies.forEach(movie => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Poster du film
        const posterUrl = movie.poster_path 
            ? getImageUrl(movie.poster_path, IMAGE_SIZES.POSTER_SMALL)
            : 'https://via.placeholder.com/40x60?text=?';
        
        // Année de sortie
        const year = movie.release_date 
            ? movie.release_date.split('-')[0]
            : 'N/A';
        
        // Note
        const rating = movie.vote_average 
            ? `⭐ ${movie.vote_average.toFixed(1)}`
            : '';
        
        suggestionItem.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}">
            <div class="suggestion-info">
                <div class="suggestion-name">${movie.title}</div>
                <div class="suggestion-meta">${year} ${rating}</div>
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            input.value = movie.title;
            selectedMovieId = movie.id;
            container.classList.remove('show');
        });
        
        container.appendChild(suggestionItem);
    });
    
    container.classList.add('show');
};

// ===== GETTERS =====

/**
 * Récupère l'ID du film sélectionné
 * @returns {number|null} ID du film ou null
 */
export const getSelectedMovieId = () => {
    return selectedMovieId;
};

/**
 * Réinitialise la sélection
 */
export const resetSimilarSearch = () => {
    document.getElementById('movie-input').value = '';
    selectedMovieId = null;
};

/**
 * Vérifie si un film est sélectionné
 * @returns {boolean} true si un film est sélectionné
 */
export const hasSelectedMovie = () => {
    return selectedMovieId !== null;
};