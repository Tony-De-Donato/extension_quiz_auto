const AI_GOOGLE_API_KEY = "AIzaSyCXxTVZ4KAvhsAtcNOABrKzpjAO5mgGnyA";
const AI_GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + AI_GOOGLE_API_KEY;


document.getElementById('loadOnline').addEventListener('click', () => {
    
    const theme = document.getElementById('quizTheme').value;
    const nbQuestions = document.getElementById('quizNumberOfQuestions').value;
    const nbReponses = document.getElementById('quizNumberOfAnswers').value;
    const difficulty = document.getElementById('quizDifficulty').value;

    const request = `
Il me faut un quiz sur le thème : "${theme}".
Il doit contenir ${nbQuestions} questions.
Chaque question doit avoir ${nbReponses} réponses possibles, dont une seule correcte.
La difficulté doit être "${difficulty}".

Réponds STRICTEMENT en JSON valide correspondant au schéma suivant :
[
  {
    "question": "string",
    "answers": ["string", "string", ...],
    "correctAnswerIndex": 0
  }
]
Ne renvoie rien d'autre que ce JSON.
`;

    const body = {
        contents: [
            {
                parts: [{text: request}],
                role: "user"
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: {type: "string"},
                        answers: {
                            type: "array",
                            items: {type: "string"}
                        },
                        correctAnswerIndex: {type: "integer"}
                    },
                    required: ["question", "answers", "correctAnswerIndex"],
                    propertyOrdering: ["question", "answers", "correctAnswerIndex"]
                }
            }
        }
    };


    fetch(AI_GOOGLE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            let quizJson;
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const jsonText = data.candidates[0].content.parts[0].text;
                try {
                    quizJson = JSON.parse(jsonText);
                } catch (e) {
                    throw new Error("JSON invalide reçu de l'API");
                }
            } else {
                throw new Error("Format de réponse inattendu de l'API");
            }

            showJsonEditor(quizJson);
        })
        .catch(err => alert("Erreur de chargement : " + err));
});

function showJsonEditor(jsonData) {
    const jsonEditor = document.getElementById('jsonEditor');
    const questionsContainer = document.getElementById('questionsContainer');

    questionsContainer.innerHTML = '';

    jsonData.forEach((questionData, questionIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-form';

        const questionTitle = document.createElement('h4');
        questionTitle.textContent = `Question ${questionIndex + 1}`;
        questionDiv.appendChild(questionTitle);

        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.className = 'question-input';
        questionInput.value = questionData.question;
        questionInput.setAttribute('data-question-index', questionIndex);
        questionDiv.appendChild(questionInput);

        questionData.answers.forEach((answer, answerIndex) => {
            const answerRow = document.createElement('div');
            answerRow.className = 'answer-row';

            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            answerInput.className = 'answer-input';
            answerInput.value = answer;
            answerInput.setAttribute('data-question-index', questionIndex);
            answerInput.setAttribute('data-answer-index', answerIndex);

            const correctCheckbox = document.createElement('input');
            correctCheckbox.type = 'checkbox';
            correctCheckbox.className = 'correct-checkbox';
            correctCheckbox.checked = answerIndex === questionData.correctAnswerIndex;
            correctCheckbox.setAttribute('data-question-index', questionIndex);
            correctCheckbox.setAttribute('data-answer-index', answerIndex);

            const correctLabel = document.createElement('label');
            correctLabel.className = 'correct-label';
            correctLabel.textContent = 'Bonne réponse';

            correctCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    const otherCheckboxes = questionsContainer.querySelectorAll(`input[type="checkbox"][data-question-index="${questionIndex}"]`);
                    otherCheckboxes.forEach(cb => {
                        if (cb !== this) cb.checked = false;
                    });
                }
            });
            
            answerRow.appendChild(answerInput);
            answerRow.appendChild(correctCheckbox);
            answerRow.appendChild(correctLabel);
            questionDiv.appendChild(answerRow);
        });
        
        questionsContainer.appendChild(questionDiv);
    });
    
    jsonEditor.style.display = 'block';
    window.tempQuizData = jsonData;
}

function hideJsonEditor() {
    const jsonEditor = document.getElementById('jsonEditor');
    jsonEditor.style.display = 'none';
    window.tempQuizData = null;
}




function saveQuizData(jsonData) {
    chrome.storage.local.set({quizData: jsonData}, () => {
        if (chrome.runtime.lastError) {
            alert("Erreur lors de la sauvegarde : " + chrome.runtime.lastError.message);
            return;
        }

        clickCommencerButton();
    });
}

function clickCommencerButton() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const commencerButton = document.querySelector('[href="quiz-edit.php"]');
                    if (commencerButton) {
                        commencerButton.click();
                        console.log("✅ Clic sur le bouton 'commencer'");
                    } else {
                        console.log("❌ Bouton 'commencer' non trouvé");
                        alert("Bouton 'commencer' non trouvé sur cette page");
                    }
                }
            }, () => {
                if (chrome.runtime.lastError) {
                    alert("Erreur : Impossible de cliquer sur le bouton. " + chrome.runtime.lastError.message);
                } else {
                    console.log("✅ Clic sur le bouton 'commencer' effectué avec succès");
                    hideJsonEditor();
                    window.close();
                }
            });
        } else {
            alert("Erreur : Aucun onglet actif trouvé.");
        }
    });
}




function downloadJsonFile() {
    try {
        const formData = collectFormData();
        const jsonString = JSON.stringify(formData, null, 2);

        const blob = new Blob([jsonString], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        a.download = `quiz_${dateStr}.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        
    } catch (e) {
        alert("Erreur lors du téléchargement : " + e.message);
    }
}

function collectFormData() {
    const questionsContainer = document.getElementById('questionsContainer');
    const questions = [];
    
    const questionForms = questionsContainer.querySelectorAll('.question-form');
    questionForms.forEach((questionForm, questionIndex) => {
        const questionInput = questionForm.querySelector('.question-input');
        const questionText = questionInput.value.trim();
        
        if (!questionText) {
            throw new Error(`La question ${questionIndex + 1} ne peut pas être vide.`);
        }

        const answerInputs = questionForm.querySelectorAll('.answer-input');
        const answers = [];
        let correctAnswerIndex = -1;
        
        answerInputs.forEach((answerInput, answerIndex) => {
            const answerText = answerInput.value.trim();
            if (!answerText) {
                throw new Error(`La réponse ${answerIndex + 1} de la question ${questionIndex + 1} ne peut pas être vide.`);
            }
            answers.push(answerText);

            const checkbox = questionForm.querySelector(`input[type="checkbox"][data-answer-index="${answerIndex}"]`);
            if (checkbox && checkbox.checked) {
                correctAnswerIndex = answerIndex;
            }
        });
        
        if (correctAnswerIndex === -1) {
            throw new Error(`Vous devez sélectionner une bonne réponse pour la question ${questionIndex + 1}.`);
        }
        
        questions.push({
            question: questionText,
            answers: answers,
            correctAnswerIndex: correctAnswerIndex
        });
    });
    
    return questions;
}

document.getElementById('validateJson').addEventListener('click', () => {
    try {
        const formData = collectFormData();
        saveQuizData(formData);
    } catch (e) {
        alert("Erreur : " + e.message);
    }
});

document.getElementById('downloadJson').addEventListener('click', () => {
    downloadJsonFile();
});

document.getElementById('cancelJson').addEventListener('click', () => {
    hideJsonEditor();
});

document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            showJsonEditor(jsonData);
        } catch (err) {
            alert("Erreur : fichier JSON invalide.");
        }
    };
    reader.readAsText(file);
});
