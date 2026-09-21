const PRODUCTION_FRONTEND_URL = "https://password-reset0-app.netlify.app";
const DEVELOPMENT_FRONTEND_URL = "http://localhost:5173";

const stripTrailingSlash = (url) => url.trim().replace(/\/+$/, "");

// Base URL of the deployed React app. Used for reset links and CORS.
// FRONTEND_URL wins; otherwise fall back to the Netlify site in production
// and to the Vite dev server everywhere else.
const frontendUrl = () => {
  if (process.env.FRONTEND_URL?.trim()) {
    return stripTrailingSlash(process.env.FRONTEND_URL);
  }

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_FRONTEND_URL
    : DEVELOPMENT_FRONTEND_URL;
};

module.exports = { frontendUrl, PRODUCTION_FRONTEND_URL };
