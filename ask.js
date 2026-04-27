/* ============================================================
   ASK 2 — Moteur premium
   We Revise — 2026
   ============================================================ */

/* ------------------------------------------------------------
   0. Sélecteurs
------------------------------------------------------------ */
const box = document.getElementById("ask-response");
const askInput = document.getElementById("ask-input");
const askBtn = document.getElementById("ask-btn");

/* ------------------------------------------------------------
   1. Bouton dynamique premium
------------------------------------------------------------ */
function updateAskButton(state) {
    askBtn.classList.remove("ask-thinking", "ask-answering");

    if (state === "thinking") {
        askBtn.textContent = "Réflexion…";
        askBtn.classList.add("ask-thinking");
    }
    else if (state === "answering") {
        askBtn.textContent = "Réponse…";
        askBtn.classList.add("ask-answering");
    }
    else {
        askBtn.textContent = "Envoyer";
    }
}

/* ------------------------------------------------------------
   2. Normalisation
------------------------------------------------------------ */
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
/* ------------------------------------------------------------
   Synonymes premium (ASK 2)
------------------------------------------------------------ */
const synonyms = {
    bonjour: ["bonjour", "salut", "coucou", "hello", "hi", "hey", "bjr"],
    merci: ["merci", "thanks", "thx", "merci beaucoup", "super merci"],
    fiche: ["fiche", "fiches", "pdf", "document", "doc", "fichier", "image", "png", "jpeg", "jpg"],
    chapitre: ["chapitre", "chapitres", "section", "dossier"],
    matiere: ["matiere", "matières", "discipline", "cours"],
    feedback: ["feedback", "avis", "commentaire", "retour"],
    entrainement: ["entrainement", "entrainements", "quiz", "exercice", "questions"],
    supabase: ["supabase", "sql", "base", "donnees", "données", "stockage"],
    cookies: ["cookie", "cookies", "tracking", "traceur", "donnees", "données"],
    cgu: ["cgu", "conditions", "mentions", "legales", "légales", "legal"],
    ask: ["ask", "assistant", "bot", "ia"]
};

/* ------------------------------------------------------------
   3. Base d’intentions ASK 2
   (réponses longues premium + liens internes)
------------------------------------------------------------ */
const intents = [

{
    id: "bonjour",
    keywords: ["bonjour"],
    patterns: ["bonjour"],
    answers: [
        `Bonjour ! Je suis ✦ASK, l’assistant premium de We Revise. 
Je peux t’aider à comprendre le fonctionnement du site, à trouver une page, ou à t’expliquer comment ajouter des fiches et chapitres.

N’hésite pas à me poser ta question.`,
        
        `Salut ! Ici ✦ASK.  
Je suis là pour t’aider à naviguer sur We Revise, comprendre les pages, ou t’expliquer comment contribuer.

Dis-moi ce que tu veux savoir.`,
        
        `Hello ! Je suis ✦ASK, l’assistant intégré de We Revise.  
Je peux t’orienter, t’expliquer les fonctionnalités ou t’aider à trouver une information.

Que puis‑je faire pour toi aujourd’hui ?`
    ]
},
{
    id: "merci",
    keywords: ["merci"],
    patterns: ["merci"],
    answers: [
        `Avec plaisir !  
Si tu as d’autres questions sur We Revise, je suis là pour t’aider à tout moment.`,

        `Je t’en prie !  
Tu peux me demander n’importe quoi concernant les fiches, chapitres, matières, ou le fonctionnement du site.`,

        `Ravi d’avoir pu t’aider !  
Si tu veux en savoir plus sur une page ou une fonctionnalité, je suis là.`
    ]
},
{
    id: "plateforme",
    keywords: ["we revise", "plateforme", "site", "projet", "objectif", "but", "presentation", "présentation"],
    patterns: ["we revise", "plateforme"],
    answers: [
        `We Revise est une plateforme de révision collaborative pensée pour les élèves. 
Elle permet d’ajouter des chapitres et des fiches dans chaque matière, sans compte et avec une interface simple et rapide.

Le but est de centraliser des contenus clairs, organisés et accessibles à tous.  
Tu peux découvrir les matières ici :
→ /index.html`
    ]
},

/* ------------------ COOKIES ------------------ */
{
    id: "cookies",
    keywords: ["cookie", "cookies", "donnees", "données", "tracking", "traceur"],
    patterns: ["cookie", "cookies"],
    answers: [
        `We Revise utilise uniquement des cookies techniques indispensables au bon fonctionnement du site. 
Ils ne servent ni à tracer les utilisateurs, ni à établir des profils, ni à afficher de la publicité. 
Aucune donnée personnelle n’est collectée ou transmise à des services externes.

Tu peux consulter les détails complets ici :
→ /cgu.html`
    ]
},

/* ------------------ CGU / MENTIONS ------------------ */
{
    id: "cgu",
    keywords: ["cgu", "conditions", "mentions", "legales", "légales", "legal"],
    patterns: ["cgu", "mentions legales"],
    answers: [
        `Les Conditions Générales d’Utilisation expliquent le fonctionnement de We Revise, les droits des utilisateurs et les règles de contribution. 
Elles sont rédigées pour être simples, transparentes et adaptées à un usage scolaire.

Tu peux les consulter ici :
→ /cgu.html

Les mentions légales sont disponibles ici :
→ /mentions-legales.html`
    ]
},

/* ------------------ SUPABASE (clarification) ------------------ */
{
    id: "supabase",
    keywords: ["supabase", "stockage", "base", "sql", "donnees", "données"],
    patterns: ["supabase"],
    answers: [
        `Supabase est uniquement utilisé comme infrastructure technique pour stocker les matières, chapitres et fiches. 
Tu n’as absolument pas besoin d’un compte Supabase pour consulter les fiches : tout est public et accessible directement depuis We Revise.

Les fichiers (PDF/PNG/JPEG) sont hébergés dans Supabase Storage, mais leur accès est entièrement géré par le site.`
    ]
},

/* ------------------ FICHES ------------------ */
{
    id: "fiche",
    keywords: ["fiche", "fiches", "pdf", "document"],
    patterns: ["ajouter fiche", "importer fiche"],
    answers: [
        `Les fiches sont des documents PDF, PNG ou JPEG importés dans un chapitre. 
Elles sont hébergées dans Supabase Storage et accessibles instantanément depuis le site, sans compte ni connexion.

Pour en ajouter une : ouvre un chapitre → clique sur « Importer une fiche » → choisis ton fichier → nomme-le → valide.`
    ]
},

/* ------------------ CHAPITRES ------------------ */
{
    id: "chapitre",
    keywords: ["chapitre", "chapitres"],
    patterns: ["ajouter chapitre", "creer chapitre"],
    answers: [
        `Les chapitres servent à organiser les fiches dans chaque matière. 
Ils sont créés par les utilisateurs via le bouton « + Contribuer » présent dans chaque matière.

Une fois le nom validé par regulateur.js, le chapitre apparaît immédiatement dans la liste.`
    ]
},

/* ------------------ MATIÈRES ------------------ */
{
    id: "matiere",
    keywords: ["matiere", "matières", "discipline"],
    patterns: ["liste matieres"],
    answers: [
        `We Revise propose toutes les matières du collège : Français, Histoire, Géographie, EMC, Maths, SPC, Technologie, SVT, Allemand, Espagnol, Anglais, Musique et Latin. 
Chaque matière peut être enrichie librement par les utilisateurs.

Tu peux accéder à la liste complète ici :
→ /index.html`
    ]
},

/* ------------------ FEEDBACK ------------------ */
{
    id: "feedback",
    keywords: ["feedback", "avis", "commentaire", "retour"],
    patterns: ["envoyer feedback"],
    answers: [
        `La page Feedback permet d’envoyer un message court (300 caractères maximum) pour partager une idée, un avis ou un problème. 
Les messages sont anonymes et peuvent être lus pour améliorer la plateforme.

Tu peux y accéder ici :
→ /feedback.html`
    ]
},

/* ------------------ ENTRAÎNEMENTS ------------------ */
{
    id: "entrainement",
    keywords: ["entrainement", "quiz", "exercice"],
    patterns: ["entrainement"],
    answers: [
        `La page Entraînement propose des activités interactives basées sur les chapitres et fiches. 
Elle évoluera progressivement avec de nouveaux formats et de nouvelles mécaniques d’apprentissage.

Accéder aux entraînements :
→ /entrainement.html`
    ]
},

/* ------------------ ASK ------------------ */
{
    id: "ask",
    keywords: ["ask", "assistant", "bot"],
    patterns: ["ask"],
    answers: [
        `✦ASK est l’assistant interne de We Revise. 
Il fonctionne entièrement hors‑ligne, sans IA externe, et repose sur un moteur d’intentions optimisé pour répondre aux questions liées au site.

Il analyse ta question, détecte les mots‑clés pertinents et génère une réponse premium adaptée.`
    ]
},

/* ------------------ FALLBACK ------------------ */
{
    id: "unknown",
    keywords: [],
    patterns: [],
    answers: [
        `Je n’ai pas encore la réponse à cette question. 
Tu peux me parler des fiches, des chapitres, des matières, de ✦ASK, de Supabase, des cookies, des CGU, du feedback ou des entraînements.`
    ]
}

];

/* ------------------------------------------------------------
   4. Matching intelligent (scoring)
------------------------------------------------------------ */
function matchIntent(query) {
    const q = normalize(query);
    let best = { id: "unknown", score: 0 };

    for (const intent of intents) {
        let score = 0;

        // mots-clés
        for (const k of intent.keywords) {
            if (q.includes(k)) score++;
            if (synonyms[k]) {
                for (const syn of synonyms[k]) {
                     if (q.includes(syn)) score++;
                }
}

        }

        // patterns
        for (const p of intent.patterns) {
            if (q.includes(p)) score += 2;
        }

        if (score > best.score) {
            best = { id: intent.id, score };
        }
    }
    // Règle premium : ignorer bonjour/merci si une autre intention a un meilleur score
    if (best.id === "bonjour" || best.id === "merci") {
        // Cherche une autre intention avec un score > 0
        for (const intent of intents) {
            if (intent.id !== "bonjour" && intent.id !== "merci") {
                let s = 0;

                for (const k of intent.keywords) {
                    if (q.includes(k)) s++;
                    if (synonyms[k]) {
                        for (const syn of synonyms[k]) {
                            if (q.includes(syn)) s++;
                        }
                    }
                }

                for (const p of intent.patterns) {
                    if (q.includes(p)) s += 2;
                }

                if (s > 0) {
                    // Une vraie intention est détectée → on ignore bonjour/merci
                    best = { id: intent.id, score: s };
                }
            }
        }
    }

    return intents.find(i => i.id === best.id);
}
function linkifyResponse() {
    const raw = box.textContent;

    const html = raw.replace(/(\/[a-zA-Z0-9\-]+\.html)/g, (match) => {
        const full = `/werevise${match}`;
        return `<a href="${full}" class="ask-link">${full}</a>`;
    });

    box.innerHTML = html;
}


/* ------------------------------------------------------------
   5. Typewriter premium
------------------------------------------------------------ */
let isGenerating = false;

function typeWriter(text) {
    if (isGenerating) return;
    isGenerating = true;

    updateAskButton("answering");

    box.textContent = "";
    let i = 0;

    function getSpeed(char) {
        let base = 28 + Math.random() * 40;
        if (".!?".includes(char)) return base + 300;
        if (",;:".includes(char)) return base + 150;
        return base;
    }

    function write() {
        if (i < text.length) {
            box.textContent += text.charAt(i);
            const delay = getSpeed(text.charAt(i));
            i++;
            setTimeout(write, delay);
        } else {
            setTimeout(() => {
                linkifyResponse();
                isGenerating = false;
                updateAskButton("idle");
            }, 200);
        }
    }

    write();
}

/* ------------------------------------------------------------
   6. Processus principal
------------------------------------------------------------ */
async function processQuestion() {
    const q = askInput.value.trim();
    if (!q || isGenerating) return;

    updateAskButton("thinking");

    // petite réflexion premium
    box.textContent = "✦ Réflexion…";
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

    const intent = matchIntent(q);
    const answer = intent.answers[Math.floor(Math.random() * intent.answers.length)];

    // enregistrement Supabase
    saveAskQuery(q, intent.id !== "unknown", intent.id).catch(() => {});

    typeWriter(answer);
}

/* ------------------------------------------------------------
   7. Supabase logging
------------------------------------------------------------ */
async function saveAskQuery(question, understood, category) {
    return await client
        .from("ask_logs")
        .insert([{ question, understood, category }]);
}

/* ------------------------------------------------------------
   8. Événements
------------------------------------------------------------ */
askBtn.onclick = processQuestion;
askInput.addEventListener("keydown", e => {
    if (e.key === "Enter") processQuestion();
});
