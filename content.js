console.log("🔄 Script de remplissage automatique de quiz lancé");

setTimeout(() => {
    chrome.storage.local.get(["quizData", "currentQuestionIndex"], ({quizData, currentQuestionIndex}) => {
        if (!quizData) {
            console.log("❌ Aucune donnée de quiz trouvée dans le storage");
            return;
        }

        if (currentQuestionIndex === undefined) {
            currentQuestionIndex = 0;
            chrome.storage.local.set({currentQuestionIndex: 0});
        }

        console.log(`🔍 Détection du contexte de la page - Question ${currentQuestionIndex + 1}/${quizData.length}`);

        if (currentQuestionIndex >= quizData.length) {
            console.log("Dernière question traitée, aucune action nécessaire");
            chrome.storage.local.clear();
            console.log("✅ Toutes les questions ont été traitées, stockage vidé");
            alert("Normalement c'est bon, mtn tu peux configurer les ptits details de base hehe");
            return;
        }


        try {
            const context = detectPageContext();

            if (context === 'FORM_TO_FILL') {
                if (currentQuestionIndex < quizData.length) {
                    const questionData = quizData[currentQuestionIndex];
                    console.log(`🔄 Remplissage de la question ${currentQuestionIndex + 1}`);
                    fillCurrentQuestion(questionData);

                    const nextIndex = currentQuestionIndex + 1;
                    chrome.storage.local.set({currentQuestionIndex: nextIndex});

                    setTimeout(() => {
                        submitCurrentForm();
                    }, 1000);
                }
            } else if (context === 'ADD_QUESTION_NEEDED') {
                console.log("🔄 Clic sur le bouton 'ajouter une question'");
                clickAddQuestionButton();
            } else if (context === 'QUIZ_FINISHED') {
                console.log("✅ Quiz terminé - toutes les questions ont été remplies !");
                chrome.storage.local.set({currentQuestionIndex: 0});
            } else {
                console.log("🤷 Contexte de page non reconnu, aucune action nécessaire");
            }

        } catch (error) {
            console.error("Erreur lors de la détection du contexte:", error);
        }
    });
}, 2000);


function detectPageContext() {
    const questionField = document.querySelector("input[name=\"question\"]");
    if (questionField && questionField.value.trim() === '') {
        console.log("🔍 Contexte détecté: Formulaire vide à remplir");
        return 'FORM_TO_FILL';
    }

    const addQuestionLink = document.querySelector('a[href*="add"]')

    if (addQuestionLink) {
        console.log("🔍 Contexte détecté: Bouton 'ajouter une question' présent");
        return 'ADD_QUESTION_NEEDED';
    }

    console.log("🔍 Contexte détecté: Quiz terminé ou page non reconnue");
    return 'QUIZ_FINISHED';
}

function submitCurrentForm() {
    const submitButton = document.querySelector("input[type=\"submit\"]");
    if (submitButton) {
        submitButton.click();
        console.log("✅ Formulaire soumis");
    } else {
        console.log("❌ Bouton de soumission non trouvé");
    }
}

function clickAddQuestionButton() {

    let addButton = document.querySelector('a[href*="add"]');

    if (addButton) {
        addButton.click();
        console.log("✅ Clic sur le bouton 'ajouter une question'");
    } else {
        console.log("❌ Bouton 'ajouter une question' non trouvé");
    }
}


function fillCurrentQuestion(questionData) {
    const currentNumberOfAnswers = questionData.answers.length || 3;
    setAnswersNumberCorrect(currentNumberOfAnswers);

    let questionField = document.querySelector("input[name=\"question\"]");
    if (questionField) {
        questionField.value = questionData.question;
        questionField.dispatchEvent(new Event('input', {bubbles: true}));
        questionField.dispatchEvent(new Event('change', {bubbles: true}));
    }

    questionData.answers.forEach((answer, index) => {
        const optName = `opt${index + 1}`;
        const answerField = document.querySelector(`input[name="${optName}"]`);

        if (answerField) {
            answerField.value = answer;
            answerField.dispatchEvent(new Event('input', {bubbles: true}));
            answerField.dispatchEvent(new Event('change', {bubbles: true}));
            console.log(`✅ Réponse ${index + 1} remplie: ${answer}`);
        } else {
            console.log(`❌ Champ ${optName} non trouvé`);
        }
    });


    const correctOptName = `opt${questionData.correctAnswerIndex + 1}`;
    const correctCheckbox = document.querySelector(`input[type="checkbox"][value="${correctOptName}"]`);

    if (correctCheckbox) {
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"][name="answer[]"]');
        allCheckboxes.forEach(cb => cb.checked = false);

        correctCheckbox.checked = true;
        correctCheckbox.dispatchEvent(new Event('change', {bubbles: true}));
        console.log(`✅ Bonne réponse cochée: ${correctOptName}`);
    } else {
        console.log(`❌ Checkbox pour ${correctOptName} non trouvée`);
    }

    if (questionField) {
        console.log("✅ Question remplie avec succès !");
    } else {
        console.log("❌ Les champs nécessaires ne sont pas trouvés. Assurez-vous que vous êtes sur la bonne page.");
    }
}

function setAnswersNumberCorrect(number) {
    const defaultAnswerNumber = 3;

    if (number === defaultAnswerNumber) {
        return;
    }

    const moreAnswersButton = document.getElementById("add")
    const lessAnswersButton = document.getElementById("remove");

    if (number - defaultAnswerNumber > 0) {
        for (let i = 0; i < number - defaultAnswerNumber; i++) {
            moreAnswersButton.click();
        }
    } else if (number - defaultAnswerNumber < 0) {
        for (let i = 0; i < defaultAnswerNumber - number; i++) {
            lessAnswersButton.click();
        }
    }

    console.log(`🔢 Nombre de réponses ajusté à ${number}`);
}