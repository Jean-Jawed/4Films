// ===== MODULE FILTERS =====
// Gère les filtres de recherche et l'autocomplete

import { getGenres, searchPerson, getImageUrl, IMAGE_SIZES } from './api.js';

let selectedActorId = null;
let actorDebounceTimer = null;

// ===== INITIALIZATION =====

/**
 * Initialise les filtres (genres et années)
 */
export const initFilters = async () => {
    await populateGenres();
    populateYears();
    initActorAutocomplete();
};

// ===== GENRES =====

/**
 * Remplit le select des genres
 */
const populateGenres = async () => {
    const genreSelect = document.getElementById('genre');
    
    try {
        const genres = await getGenres();
        
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des genres:', error);
    }
};

// ===== YEARS =====

/**
 * Remplit le select des années
 */
const populateYears = () => {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    
    // De l'année actuelle à 1900
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
};

// ===== ACTOR AUTOCOMPLETE =====

/**
 * Initialise l'autocomplete pour les acteurs
 */
const initActorAutocomplete = () => {
    const input = document.getElementById('actor');
    const suggestionsContainer = document.getElementById('actor-suggestions');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timer
        if (actorDebounceTimer) {
            clearTimeout(actorDebounceTimer);
        }
        
        // Debounce pour éviter trop de requêtes
        actorDebounceTimer = setTimeout(async () => {
            if (query.length >= 2) {
                const results = await searchPerson(query);
                displayActorSuggestions(results, suggestionsContainer, input);
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

/**
 * Affiche les suggestions d'acteurs
 * @param {Array} persons - Liste de personnes
 * @param {HTMLElement} container - Conteneur des suggestions
 * @param {HTMLInputElement} input - Input de recherche
 */
const displayActorSuggestions = (persons, container, input) => {
    container.innerHTML = '';
    
    if (persons.length === 0) {
        container.innerHTML = '<div class="no-suggestions">Aucun acteur trouvé</div>';
        container.classList.add('show');
        return;
    }
    
    persons.forEach(person => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Photo de l'acteur
        const profileUrl = person.profile_path 
            ? getImageUrl(person.profile_path, IMAGE_SIZES.PROFILE_SMALL)
            : 'https://via.placeholder.com/40x60?text=?';
        
        // Films connus
        const knownFor = person.known_for 
            ? person.known_for.slice(0, 2).map(m => m.title || m.name).join(', ')
            : '';
        
        suggestionItem.innerHTML = `
            <img src="${profileUrl}" alt="${person.name}">
            <div class="suggestion-info">
                <div class="suggestion-name">${person.name}</div>
                ${knownFor ? `<div class="suggestion-meta">${knownFor}</div>` : ''}
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            input.value = person.name;
            selectedActorId = person.id;
            container.classList.remove('show');
        });
        
        container.appendChild(suggestionItem);
    });
    
    container.classList.add('show');
};

// ===== GET FILTERS =====

/**
 * Récupère les valeurs actuelles des filtres
 * @returns {Object} Filtres sélectionnés
 */
export const getFilters = () => {
    return {
        genre: document.getElementById('genre').value,
        year: document.getElementById('year').value,
        country: document.getElementById('country').value,
        platform: document.getElementById('platform').value,
        actor: selectedActorId
    };
};

/**
 * Réinitialise tous les filtres
 */
export const resetFilters = () => {
    document.getElementById('genre').value = '';
    document.getElementById('year').value = '';
    document.getElementById('country').value = '';
    document.getElementById('platform').value = '';
    document.getElementById('actor').value = '';
    selectedActorId = null;
};

/**
 * Vérifie si au moins un filtre est sélectionné
 * @returns {boolean} true si au moins un filtre est actif
 */
export const hasActiveFilters = () => {
    const filters = getFilters();
    return Object.values(filters).some(value => value !== '' && value !== null);
};