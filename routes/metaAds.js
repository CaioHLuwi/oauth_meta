const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Utility function to get environment variables
const getEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`Environment variable ${key} is not set.`);
  }
  return value;
};

const META_APP_ID = getEnv("META_APP_ID");
const META_APP_SECRET = getEnv("META_APP_SECRET");
const REDIRECT_URI = getEnv("REDIRECT_URI");

// Serve static files from the 'public' directory
router.use(express.static(path.join(__dirname, "../public")));

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy" });
});

// Initiate OAuth flow
router.get("/oauth/initiate", (req, res) => {
  if (!META_APP_ID || !REDIRECT_URI) {
    return res
      .status(500)
      .json({ error: "META_APP_ID or REDIRECT_URI not configured in environment." });
  }
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

// OAuth callback endpoint
router.get("/oauth-callback.html", async (req, res) => {
    const { code, error, error_description } = req.query;

    if (error) {
        // If there's an error from Facebook, redirect to oauth-error.html with error details
        return res.redirect(`/oauth_meta/oauth-error.html?error=${error}&error_description=${error_description}`);
    }

    if (!code) {
        console.error("Authorization code not received.");
        return res.redirect(`/oauth_meta/oauth-error.html?error=no_code&error_description=Authorization code not received.`);
    }

    if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
        console.error("Missing environment variables for token exchange.");
        return res.redirect(`/oauth_meta/oauth-error.html?error=env_missing&error_description=Missing environment variables for token exchange.`);
    }

    try {
        const tokenResponse = await axios.get(
            "https://graph.facebook.com/v23.0/oauth/access_token",
            {
                params: {
                    client_id: META_APP_ID,
                    client_secret: META_APP_SECRET,
                    redirect_uri: REDIRECT_URI,
                    code: code,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log(
            "Access Token obtained:",
            accessToken ? accessToken.substring(0, 20) + "..." : "N/A"
        );

        // Redirect to a static HTML page that handles localStorage communication
        res.redirect(`/oauth_meta/oauth-result.html?access_token=${accessToken}`);
    } catch (err) {
        console.error(
            "Error exchanging code for access token:",
            err.response ? err.response.data : err.message
        );
        const errorMessage = err.response && err.response.data && err.response.data.error && err.response.data.error.message
            ? err.response.data.error.message
            : "Unknown error obtaining access token.";
        return res.redirect(`/oauth_meta/oauth-error.html?error=token_exchange_failed&error_description=${encodeURIComponent(errorMessage)}`);
    }
});

// Static HTML page to handle localStorage communication
router.get("/oauth-result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/oauth-result.html"));
});

// Test token endpoint (for debugging)
router.get("/test-token", async (req, res) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required." });
  }

  try {
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`
    );
    res.json(debugResponse.data);
  } catch (error) {
    console.error(
      "Error debugging token:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({
        error: "Failed to debug token.",
        details: error.response ? error.response.data : error.message,
      });
  }
});

module.exports = router;
