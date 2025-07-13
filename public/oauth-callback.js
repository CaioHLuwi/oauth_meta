
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const errorMessage = urlParams.get("message");

    if (accessToken) {
        const oauthResult = {
            type: "META_ADS_OAUTH_SUCCESS",
            accessToken: accessToken,
            timestamp: Date.now()
        };
        localStorage.setItem("meta_ads_oauth_result", JSON.stringify(oauthResult));
        console.log("Access token salvo no localStorage e popup será fechado.");
    } else if (errorMessage) {
        const oauthResult = {
            type: "META_ADS_OAUTH_ERROR",
            error: decodeURIComponent(errorMessage),
            timestamp: Date.now()
        };
        localStorage.setItem("meta_ads_oauth_result", JSON.stringify(oauthResult));
        console.error("Erro de autenticação salvo no localStorage e popup será fechado.");
        const errorElement = document.getElementById("errorMessage");
        if (errorElement) {
            errorElement.textContent = decodeURIComponent(errorMessage);
        }
    }

    // Always close the window after processing
    window.close();
};


