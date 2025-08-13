chrome.storage.local.get("quizData", ({ quizData }) => {
    if (!quizData) return;

    const titleField = document.querySelector('#quizTitle');
    if (titleField) titleField.value = quizData.title;

    quizData.questions.forEach((q, i) => {
        const questionField = document.querySelector(`#question${i+1}`);
        const answerField = document.querySelector(`#answer${i+1}`);

        if (questionField) questionField.value = q.text;
        if (answerField) answerField.value = q.answer;
    });

    console.log("✅ Quiz rempli automatiquement !");
});
