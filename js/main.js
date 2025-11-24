// ===== MAIN APPLICATION =====
// Point d'entrée principal de l'application 4 Films

import { discoverMovies, getSimilarMovies } from './api.js';
import { initCarousel, resetCarousel } from './carousel.js';
import { initFilters, getFilters, hasActiveFilters, resetFilters } from './filters.js';
import { initSimilarSearch, getSelectedMovieId, hasSelectedMovie, resetSimilarSearch } from './similar.js';

// ===== STATE =====
let currentMode = 'filters'; // 'filters' ou 'similar'

// ===== INITIALIZATION =====

/**
 * Initialise l'application au chargement
 */
const init = async () => {
    console.log('🎬 Initialisation de 4 Films...');
    
    try {
        // Initialiser les filtres
        await initFilters();
        
        // Initialiser la recherche similaire
        initSimilarSearch();
        
        // Initialiser les event listeners
        initEventListeners();
        
        console.log('✅ Application prête !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement de l\'application. Veuillez recharger la page.');
    }
};

// ===== EVENT LISTENERS =====

/**
 * Initialise tous les event listeners
 */
const initEventListeners = () => {
    // Toggle entre les modes
    const modeFilters = document.getElementById('mode-filters');
    const modeSimilar = document.getElementById('mode-similar');
    
    modeFilters.addEventListener('change', () => {
        if (modeFilters.checked) {
            switchMode('filters');
        }
    });
    
    modeSimilar.addEventListener('change', () => {
        if (modeSimilar.checked) {
            switchMode('similar');
        }
    });
    
    // Bouton recherche par filtres
    const searchFiltersBtn = document.getElementById('search-filters');
    searchFiltersBtn.addEventListener('click', handleFilterSearch);
    
    // Bouton recherche films similaires
    const searchSimilarBtn = document.getElementById('search-similar');
    searchSimilarBtn.addEventListener('click', handleSimilarSearch);
    
    // Enter key sur les inputs
    document.getElementById('movie-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSimilarSearch();
        }
    });
};

// ===== MODE SWITCHING =====

/**
 * Change le mode de recherche
 * @param {string} mode - 'filters' ou 'similar'
 */
const switchMode = (mode) => {
    currentMode = mode;
    
    const filtersSection = document.getElementById('filters-section');
    const similarSection = document.getElementById('similar-section');
    
    if (mode === 'filters') {
        filtersSection.classList.add('active');
        similarSection.classList.remove('active');
    } else {
        filtersSection.classList.remove('active');
        similarSection.classList.add('active');
    }
    
    // Réinitialiser le carousel
    resetCarousel();
    hideError();
};

// ===== SEARCH HANDLERS =====

/**
 * Gère la recherche par filtres
 */
const handleFilterSearch = async () => {
    const filters = getFilters();
    
    // Vérifier qu'au moins un filtre est sélectionné
    if (!hasActiveFilters()) {
        showError('Veuillez sélectionner au moins un critère de recherche.');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const movies = await discoverMovies(filters);
        
        if (movies.length === 0) {
            showError('Aucun film trouvé avec ces critères. Essayez de modifier vos filtres.');
            hideLoading();
            return;
        }
        
        if (movies.length < 4) {
            showError(`Seulement ${movies.length} film(s) trouvé(s) avec ces critères. Essayez d'élargir votre recherche.`, 'warning');
        }
        
        await initCarousel(movies);
        hideLoading();
        
        // Scroll automatique vers les résultats
        setTimeout(() => {
            document.querySelector('.carousel-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
        
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        showError('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
        hideLoading();
    }
};

/**
 * Gère la recherche de films similaires
 */
const handleSimilarSearch = async () => {
    const movieId = getSelectedMovieId();
    
    if (!hasSelectedMovie()) {
        showError('Veuillez sélectionner un film dans les suggestions.');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const movies = await getSimilarMovies(movieId);
        
        if (movies.length === 0) {
            showError('Aucun film similaire trouvé. Essayez avec un autre film.');
            hideLoading();
            return;
        }
        
        if (movies.length < 4) {
            showError(`Seulement ${movies.length} film(s) similaire(s) trouvé(s).`, 'warning');
        }
        
        await initCarousel(movies);
        hideLoading();
        
        // Scroll automatique vers les résultats
        setTimeout(() => {
            document.querySelector('.carousel-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
        
    } catch (error) {
        console.error('Erreur lors de la recherche de films similaires:', error);
        showError('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
        hideLoading();
    }
};

// ===== UI HELPERS =====

/**
 * Affiche le loader
 */
const showLoading = () => {
    const loading = document.getElementById('loading');
    const carouselContainer = document.querySelector('.carousel-placeholder');
    
    loading.classList.remove('hidden');
    
    if (carouselContainer) {
        carouselContainer.style.display = 'none';
    }
};

/**
 * Cache le loader
 */
const hideLoading = () => {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
};

/**
 * Affiche un message d'erreur
 * @param {string} message - Message à afficher
 * @param {string} type - 'error' ou 'warning'
 */
const showError = (message, type = 'error') => {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    if (type === 'warning') {
        errorElement.style.background = 'rgba(251, 191, 36, 0.1)';
        errorElement.style.borderColor = '#F59E0B';
        errorElement.style.color = '#D97706';
    } else {
        errorElement.style.background = 'rgba(239, 68, 68, 0.1)';
        errorElement.style.borderColor = '#EF4444';
        errorElement.style.color = '#EF4444';
    }
};

/**
 * Cache le message d'erreur
 */
const hideError = () => {
    const errorElement = document.getElementById('error-message');
    errorElement.classList.add('hidden');
};

// ===== ERROR HANDLING =====

/**
 * Gère les erreurs globales
 */
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    showError('Une erreur inattendue est survenue. Veuillez recharger la page.');
});

/**
 * Gère les promesses rejetées non gérées
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejetée non gérée:', event.reason);
    showError('Une erreur est survenue lors de la communication avec le serveur.');
});

// ===== START APPLICATION =====

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export pour debug (optionnel)
window.debugApp = {
    currentMode: () => currentMode,
    filters: getFilters,
    selectedMovie: getSelectedMovieId,
    resetAll: () => {
        resetFilters();
        resetSimilarSearch();
        resetCarousel();
        hideError();
    }
};