// ===== MODULE CAROUSEL 3D =====
// Gère l'affichage et les interactions du carousel 3D

import { getImageUrl, getWatchProviders, getProviderLogo } from './api.js';

let currentRotation = 0;
let currentIndex = 0;
let movies = [];
let isDragging = false;
let startX = 0;
let currentX = 0;

// ===== INITIALIZATION =====

/**
 * Initialise le carousel avec des films
 * @param {Array} moviesData - Tableau de 4 films
 */
export const initCarousel = async (moviesData) => {
    movies = moviesData;
    currentRotation = 0;
    currentIndex = 0;
    
    const carousel = document.getElementById('carousel');
    const placeholder = document.querySelector('.carousel-placeholder');
    const controls = document.querySelector('.carousel-controls');
    const dots = document.getElementById('carousel-dots');
    
    // Cacher le placeholder
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Vider le carousel
    carousel.innerHTML = '';
    
    // Créer les cards
    for (let i = 0; i < movies.length; i++) {
        const card = await createMovieCard(movies[i], i + 1);
        carousel.appendChild(card);
    }
    
    // Afficher les contrôles et dots
    controls.classList.remove('hidden');
    dots.classList.remove('hidden');
    
    // Créer les dots
    createDots();
    
    // Initialiser les event listeners
    initEventListeners();
    
    // Afficher la première card
    updateCarousel();
};

// ===== CARD CREATION =====

/**
 * Crée une card de film
 * @param {Object} movie - Données du film
 * @param {number} rank - Position dans le top 4
 * @returns {HTMLElement} Card HTML
 */
const createMovieCard = async (movie, rank) => {
    const card = document.createElement('div');
    card.className = `movie-card rank-${rank}`;
    card.style.setProperty('--index', rank - 1);
    card.style.setProperty('--rotate', (rank - 1) * 90 + 'deg');
    
    // Récupérer les plateformes de streaming
    const providers = await getWatchProviders(movie.id);
    
    // Poster
    const posterUrl = getImageUrl(movie.poster_path, 'w500') || 'https://via.placeholder.com/300x500?text=No+Poster';
    
    card.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}" class="card-poster">
        
        <div class="card-rank rank-${rank}">#${rank}</div>
        
        <div class="card-overlay">
            <h3 class="card-title">${movie.title}</h3>
            <div class="card-meta">
                <div class="card-rating">
                    <span>⭐</span>
                    <span>${movie.vote_average.toFixed(1)}</span>
                </div>
                <span class="card-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
            </div>
            ${providers ? createPlatformsHTML(providers) : ''}
        </div>
        
        <div class="card-synopsis">
            <h4 class="synopsis-title">${movie.title}</h4>
            <p class="synopsis-text">${movie.overview || 'Aucun synopsis disponible.'}</p>
        </div>
    `;
    
    return card;
};

/**
 * Crée le HTML pour les plateformes de streaming
 * @param {Object} providers - Données des plateformes
 * @returns {string} HTML des plateformes
 */
const createPlatformsHTML = (providers) => {
    let html = '<div class="card-platforms">';
    
    // Priorité: flatrate (abonnement) > rent > buy
    const platformList = providers.flatrate || providers.rent || providers.buy || [];
    
    // Afficher maximum 3 logos
    const displayPlatforms = platformList.slice(0, 3);
    
    displayPlatforms.forEach(provider => {
        const logoUrl = getProviderLogo(provider.logo_path);
        if (logoUrl) {
            html += `<img src="${logoUrl}" alt="${provider.provider_name}" class="platform-logo" title="${provider.provider_name}">`;
        }
    });
    
    html += '</div>';
    return html;
};

// ===== CAROUSEL ROTATION =====

/**
 * Met à jour la rotation du carousel
 */
const updateCarousel = () => {
    const carousel = document.getElementById('carousel');
    carousel.style.transform = `rotateY(${currentRotation}deg)`;
    
    // Mettre à jour les dots
    updateDots();
};

/**
 * Passe au film suivant
 */
export const nextMovie = () => {
    currentRotation -= 90;
    currentIndex = (currentIndex + 1) % movies.length;
    updateCarousel();
};

/**
 * Revient au film précédent
 */
export const prevMovie = () => {
    currentRotation += 90;
    currentIndex = (currentIndex - 1 + movies.length) % movies.length;
    updateCarousel();
};

/**
 * Va à un film spécifique
 * @param {number} index - Index du film (0-3)
 */
const goToMovie = (index) => {
    const diff = index - currentIndex;
    currentRotation -= diff * 90;
    currentIndex = index;
    updateCarousel();
};

// ===== DOTS =====

/**
 * Crée les indicateurs de position (dots)
 */
const createDots = () => {
    const dotsContainer = document.getElementById('carousel-dots');
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < movies.length; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToMovie(i));
        dotsContainer.appendChild(dot);
    }
};

/**
 * Met à jour l'état actif des dots
 */
const updateDots = () => {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
};

// ===== EVENT LISTENERS =====

/**
 * Initialise tous les event listeners
 */
const initEventListeners = () => {
    // Boutons prev/next
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.addEventListener('click', prevMovie);
    nextBtn.addEventListener('click', nextMovie);
    
    // Clavier
    document.addEventListener('keydown', handleKeyboard);
    
    // Touch events pour mobile
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd);
    
    // Mouse drag (optionnel, pour desktop)
    carousel.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseEnd);
};

/**
 * Gère les touches du clavier
 * @param {KeyboardEvent} e - Événement clavier
 */
const handleKeyboard = (e) => {
    if (e.key === 'ArrowLeft') {
        prevMovie();
    } else if (e.key === 'ArrowRight') {
        nextMovie();
    }
};

// ===== TOUCH EVENTS =====

/**
 * Début du touch
 * @param {TouchEvent} e - Événement touch
 */
const handleTouchStart = (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    currentX = startX;
};

/**
 * Mouvement du touch
 * @param {TouchEvent} e - Événement touch
 */
const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
};

/**
 * Fin du touch
 */
const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 50; // Sensibilité du swipe
    
    if (diff > threshold) {
        prevMovie();
    } else if (diff < -threshold) {
        nextMovie();
    }
    
    isDragging = false;
};

// ===== MOUSE DRAG =====

/**
 * Début du drag souris
 * @param {MouseEvent} e - Événement souris
 */
const handleMouseDown = (e) => {
    isDragging = true;
    startX = e.clientX;
    currentX = startX;
    document.body.style.cursor = 'grabbing';
};

/**
 * Mouvement du drag souris
 * @param {MouseEvent} e - Événement souris
 */
const handleMouseMove = (e) => {
    if (!isDragging) return;
    currentX = e.clientX;
};

/**
 * Fin du drag souris
 */
const handleMouseEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 100; // Sensibilité du drag
    
    if (diff > threshold) {
        prevMovie();
    } else if (diff < -threshold) {
        nextMovie();
    }
    
    isDragging = false;
    document.body.style.cursor = 'default';
};

// ===== RESET =====

/**
 * Réinitialise le carousel
 */
export const resetCarousel = () => {
    const carousel = document.getElementById('carousel');
    const placeholder = document.querySelector('.carousel-placeholder');
    const controls = document.querySelector('.carousel-controls');
    const dots = document.getElementById('carousel-dots');
    
    carousel.innerHTML = '';
    controls.classList.add('hidden');
    dots.classList.add('hidden');
    
    if (placeholder) {
        placeholder.style.display = 'block';
    }
    
    currentRotation = 0;
    currentIndex = 0;
    movies = [];
};