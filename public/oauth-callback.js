

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");

    if (accessToken) {
        const oauthResult = {
            type: "META_ADS_OAUTH_SUCCESS",
            accessToken: accessToken,
            timestamp: Date.now()
        };
        localStorage.setItem("meta_ads_oauth_result", JSON.stringify(oauthResult));
        console.log("Access token saved to localStorage from external JS.");
    } else {
        localStorage.setItem("meta_ads_oauth_result", JSON.stringify({ type: "META_ADS_OAUTH_ERROR", message: "Access token not found in URL." }));
        console.error("Access token not found in URL for external JS.");
    }
    // Close the window after a short delay to ensure localStorage is set
    setTimeout(() => {
        window.close();
    }, 100);
};


