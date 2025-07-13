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
        document.body.innerHTML = 
            `<h1 style="color: green;">Autenticação Concluída com Sucesso!</h1>
            <p>Access Token: <span style="color: green;">${accessToken.substring(0, 20)}...</span></p>
            <p>Esta janela será fechada automaticamente.</p>`;
        setTimeout(() => {
            window.close();
        }, 1000); // Give main window time to read localStorage
    } else if (errorMessage) {
        const oauthResult = {
            type: "META_ADS_OAUTH_ERROR",
            message: decodeURIComponent(errorMessage),
            timestamp: Date.now()
        };
        localStorage.setItem("meta_ads_oauth_result", JSON.stringify(oauthResult));
        document.body.innerHTML = 
            `<h1 style="color: red;">Erro na Autenticação!</h1>
            <p>Detalhes: ${decodeURIComponent(errorMessage)}</p>
            <p>Esta janela será fechada automaticamente.</p>`;
        setTimeout(() => {
            window.close();
        }, 1000); // Give main window time to read localStorage
    } else {
        document.body.innerHTML = 
            `<h1>Processando autenticação...</h1>
            <p>Aguarde enquanto processamos sua autenticação com o Meta Ads.</p>`;
    }
};


