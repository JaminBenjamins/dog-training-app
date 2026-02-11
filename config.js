// Configuration for API endpoints
// Change this when deploying to production

const config = {
    // For local development, use relative URLs (backend on same server)
    // For production (GitHub Pages), replace with your backend URL

    // Example production URL: 'https://dogman-backend.onrender.com'
    // Leave empty for local development
    API_BASE_URL: '' // Change to your backend URL when deploying
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return config.API_BASE_URL ? `${config.API_BASE_URL}${endpoint}` : endpoint;
}

// Export for use in app.js
window.appConfig = {
    getApiUrl
};
