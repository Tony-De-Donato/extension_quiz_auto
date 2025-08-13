const DATA_URL = "https://ton-site.com/quiz.json"; // URL par défaut

// Bouton pour charger depuis le web
document.getElementById('loadOnline').addEventListener('click', () => {
    fetch(DATA_URL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            chrome.storage.local.set({ quizData: data }, () => {
                alert("Quiz chargé depuis le web !");
            });
        })
        .catch(err => alert("Erreur de chargement : " + err));
});

// Importer un fichier local
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            chrome.storage.local.set({ quizData: jsonData }, () => {
                alert("Quiz chargé depuis fichier !");
            });
        } catch (err) {
            alert("Erreur : fichier JSON invalide.");
        }
    };
    reader.readAsText(file);
});
