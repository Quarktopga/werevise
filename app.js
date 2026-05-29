/* ============================================================
   We Revise — app.js (version V6 PREMIUM)
   Gestion dynamique des matières, chapitres et fiches
   + GET dans l’URL (par nom), nommage fichiers robuste, rating, analytics
   ============================================================ */

/* ============================================================
   1. Sélecteurs globaux
   ============================================================ */

const subjectsGrid = document.querySelector("#subjects-list");
const chapterList = document.querySelector(".chapter-list");
const ficheList = document.querySelector(".fiche-list");

/* Panneau latéral premium pour afficher les fiches */
let fichePanel;

/* Modale de vote */
const voteModal = document.getElementById("vote-modal");
const voteStars = document.querySelectorAll(".vote-star");
const voteClose = document.querySelector(".vote-close");
let currentFicheForRating = null;

/* Analytics */
let pageStartTime = null;
let currentPageInfo = null;

/* ============================================================
   2. Fonctions utilitaires
   ============================================================ */

function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function generateCleanFileName(file) {
    const extFromType = file.type && file.type.includes("/")
        ? file.type.split("/").pop().toLowerCase()
        : (file.name.split(".").pop() || "").toLowerCase();

    const ext = extFromType || "bin";

    let id;
    if (window.crypto && crypto.randomUUID) {
        id = crypto.randomUUID();
    } else {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    return `${id}.${ext}`;
}

/* ============================================================
   3. Chargement des matières
   ============================================================ */

async function loadSubjects() {
    const { data, error } = await client
        .from("subjects")
        .select("*")
        .order("order_index", { ascending: true });

    if (error) {
        console.error(error);
        if (subjectsGrid) {
            subjectsGrid.innerHTML = `<div class="empty">Impossible de charger les matières.</div>`;
        }
        return;
    }

    if (!subjectsGrid) return;
    subjectsGrid.innerHTML = "";

    data.forEach(subject => {
        const card = document.createElement("div");
        card.className =
            "subject-card"
            + (subject.class === "brevet" ? " brevet" : "")
            + (subject.class === "brevet-sci" ? " brevet-sci" : "");

        card.textContent = subject.name;

        card.onclick = () => {
            const from = "subjects";
            const to = "chapters";

            localStorage.setItem("currentSubject", JSON.stringify(subject));
            trackNavigation(from, to, { subject_id: subject.id });

            const encodedName = encodeURIComponent(subject.name);
            location.href = `chapters.html?subject=${encodedName}`;
        };

        subjectsGrid.appendChild(card);
    });
}

/* ============================================================
   4. Chargement des chapitres
   ============================================================ */

async function loadChapters(subjectId) {
    const { data, error } = await client
        .from("chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        if (chapterList) {
            chapterList.innerHTML = `<div class="empty">Impossible de charger les chapitres.</div>`;
        }
        return;
    }

    if (!chapterList) return;
    chapterList.innerHTML = "";

    if (data.length === 0) {
        chapterList.innerHTML = `<div class="empty">Aucun chapitre pour le moment.</div>`;
        return;
    }

    data.forEach(ch => {
        const item = document.createElement("div");
        item.className = "chapter-item";
        item.textContent = ch.name;

        item.onclick = () => {
            const from = "chapters";
            const to = "fiches";

            localStorage.setItem("currentChapter", JSON.stringify(ch));
            trackNavigation(from, to, { chapter_id: ch.id });

            const encodedName = encodeURIComponent(ch.name);
            location.href = `fiches.html?chapter=${encodedName}`;
        };

        chapterList.appendChild(item);
    });
}

/* ============================================================
   5. Création d'un chapitre
   ============================================================ */

async function createChapter(subjectId, name) {
    const { error } = await client
        .from("chapters")
        .insert([{ subject_id: subjectId, name }]);

    if (error) {
        console.error(error);
        alert("Erreur lors de la création du chapitre.");
        return;
    }

    loadChapters(subjectId);
}

/* ============================================================
   6. Rating des fiches (1 à 5 étoiles)
   ============================================================ */

const FICHE_RATINGS_KEY = "ficheRatings";

function getFicheRatings() {
    try {
        return JSON.parse(localStorage.getItem(FICHE_RATINGS_KEY)) || {};
    } catch {
        return {};
    }
}

function setFicheRatings(ratings) {
    localStorage.setItem(FICHE_RATINGS_KEY, JSON.stringify(ratings));
}

function getLocalRating(ficheId) {
    const ratings = getFicheRatings();
    return ratings[ficheId] || null;
}

function setLocalRating(ficheId, value) {
    const ratings = getFicheRatings();
    ratings[ficheId] = value;
    setFicheRatings(ratings);
}

async function sendRatingToSupabase(ficheId, rating) {
    try {
        await client.rpc("rate_fiche", {
            fiche_id_input: ficheId,
            rating_input: rating
        });
    } catch (e) {
        console.error("Erreur lors de l'enregistrement du rating", e);
    }
}

function openVoteModal(fiche) {
    if (!voteModal) return;
    currentFicheForRating = fiche;
    voteModal.classList.add("show");

    const current = getLocalRating(fiche.id);

    voteStars.forEach(star => {
        const val = parseInt(star.dataset.value, 10);
        star.classList.toggle("active", current && val <= current);
    });
}

function closeVoteModal() {
    if (!voteModal) return;
    voteModal.classList.remove("show");
    currentFicheForRating = null;
}

if (voteClose) {
    voteClose.onclick = closeVoteModal;
}

voteStars.forEach(star => {
    star.addEventListener("click", () => {
        if (!currentFicheForRating) return;

        const value = parseInt(star.dataset.value, 10);

        setLocalRating(currentFicheForRating.id, value);

        voteStars.forEach(s => {
            const v = parseInt(s.dataset.value, 10);
            s.classList.toggle("active", v <= value);
        });

        sendRatingToSupabase(currentFicheForRating.id, value);

        setTimeout(closeVoteModal, 600);
    });
});

/* ============================================================
   7. Chargement des fiches
   ============================================================ */

async function loadFiches(chapterId) {
    const { data, error } = await client
        .from("fiches")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        if (ficheList) {
            ficheList.innerHTML = `<div class="empty">Impossible de charger les fiches.</div>`;
        }
        return;
    }

    if (!ficheList) return;
    ficheList.innerHTML = "";

    if (data.length === 0) {
        ficheList.innerHTML = `<div class="empty">Aucune fiche pour ce chapitre.</div>`;
        return;
    }

    data.forEach(f => {
        const item = document.createElement("div");
        item.className = "fiche-item";

        item.innerHTML = `
            <div class="fiche-main">
                <span>${f.name}</span>
                <span class="fiche-type">${f.file_type.toUpperCase()}</span>
            </div>
            <button class="fiche-rate-trigger" aria-label="Noter cette fiche">★</button>
        `;

        // Clic global = ouverture de la fiche
        item.onclick = () => openFicheWithTracking(f);

        // Clic sur l'étoile = ouverture de la modale
        const trigger = item.querySelector(".fiche-rate-trigger");
        trigger.onclick = (e) => {
            e.stopPropagation();
            openVoteModal(f);
        };

        ficheList.appendChild(item);
    });
}

/* ============================================================
   8. Import d'une fiche (upload Storage)
   ============================================================ */

async function uploadFiche(chapterId, file, name) {
    const cleanName = generateCleanFileName(file);
    const filePath = `${chapterId}/${cleanName}`;

    const { error: uploadError } = await client.storage
        .from("fiches")
        .upload(filePath, file);

    if (uploadError) {
        console.error(uploadError);
        alert("Erreur lors de l'upload du fichier.");
        return;
    }

    const { data: urlData } = client.storage
        .from("fiches")
        .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;
    const ext = (file.type && file.type.split("/").pop().toLowerCase()) ||
                (file.name.split(".").pop() || "").toLowerCase();

    const { error: insertError } = await client
        .from("fiches")
        .insert([{
            chapter_id: chapterId,
            name,
            file_url: fileUrl,
            file_type: ext
        }]);

    if (insertError) {
        console.error(insertError);
        alert("Erreur lors de l'enregistrement de la fiche.");
        return;
    }

    loadFiches(chapterId);
}

async function uploadFicheMultiple(chapterId, files, baseName) {
    if (!files || files.length === 0) return;

    let index = 1;
    for (const file of files) {
        const displayName = files.length === 1 ? baseName : `${baseName} (${index})`;
        await uploadFiche(chapterId, file, displayName);
        index++;
    }
}

/* ============================================================
   9. Ouverture premium des fiches
   ============================================================ */

function openFiche(url) {
    if (window.innerWidth < 800) {
        window.open(url, "_blank");
        return;
    }

    if (!fichePanel) createFichePanel();

    fichePanel.querySelector("iframe").src = url;
    fichePanel.classList.add("open");
}

function openFicheWithTracking(fiche) {
    trackDownload(fiche.id);
    openFiche(fiche.file_url);
}

function createFichePanel() {
    fichePanel = document.createElement("div");
    fichePanel.className = "fiche-panel";

    fichePanel.innerHTML = `
        <div class="fiche-panel-content">
            <button class="close-panel">✕</button>
            <iframe></iframe>
        </div>
    `;

    document.body.appendChild(fichePanel);

    fichePanel.querySelector(".close-panel").onclick = () => {
        fichePanel.classList.remove("open");
    };
}

/* ============================================================
   10. Modales premium (création / import)
   ============================================================ */

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("show");
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("show");
}

function submitCreateChapter() {
    const input = document.getElementById("chapterName");
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        alert("Merci d'indiquer un nom de chapitre.");
        return;
    }

    const subject = JSON.parse(localStorage.getItem("currentSubject"));
    if (!subject) {
        alert("Sujet introuvable.");
        return;
    }

    createChapter(subject.id, name);
    closeModal("modal-create");
    input.value = "";
}

function submitImportFiches() {
    const fileInput = document.getElementById("ficheFiles");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Merci de sélectionner au moins un fichier.");
        return;
    }

    const chapter = JSON.parse(localStorage.getItem("currentChapter"));
    if (!chapter) {
        alert("Chapitre introuvable.");
        return;
    }

    const baseName = chapter.name || "Fiche";
    uploadFicheMultiple(chapter.id, fileInput.files, baseName);

    closeModal("modal-import");
    fileInput.value = "";
}

/* ============================================================
   11. Analytics V6
   ============================================================ */

function startPageTracking(page, subjectId = null, chapterId = null) {
    pageStartTime = Date.now();
    currentPageInfo = { page, subjectId, chapterId };
}

async function sendAnalytics(eventType, payload) {
    try {
        await client
            .from("analytics")
            .insert([{
                type: eventType,
                payload,
                created_at: new Date().toISOString()
            }]);
    } catch (e) {
        console.error("Erreur analytics", e);
    }
}

function trackPageTime() {
    if (!pageStartTime || !currentPageInfo) return;

    const durationMs = Date.now() - pageStartTime;
    const seconds = Math.round(durationMs / 1000);

    sendAnalytics("time", {
        page: currentPageInfo.page,
        subject_id: currentPageInfo.subjectId,
        chapter_id: currentPageInfo.chapterId,
        duration_seconds: seconds
    });
}

function trackNavigation(from, to, extra = {}) {
    sendAnalytics("navigation", {
        from,
        to,
        ...extra
    });
}

function trackDownload(ficheId) {
    sendAnalytics("download", {
        fiche_id: ficheId
    });
}

window.addEventListener("beforeunload", () => {
    trackPageTime();
});

/* ============================================================
   12. Initialisation automatique selon la page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "subjects") {
        startPageTracking("subjects");
        loadSubjects();
    }

    if (page === "chapters") {
        (async () => {
            const subjectNameFromUrl = getQueryParam("subject");
            let subject = null;

            const stored = localStorage.getItem("currentSubject");
            if (stored) {
                try {
                    subject = JSON.parse(stored);
                } catch {
                    subject = null;
                }
            }

            if ((!subject || (subjectNameFromUrl && subject.name !== subjectNameFromUrl)) && subjectNameFromUrl) {
                const { data, error } = await client
                    .from("subjects")
                    .select("*")
                    .eq("name", subjectNameFromUrl)
                    .single();

                if (error || !data) {
                    if (chapterList) {
                        chapterList.innerHTML = `<div class="empty">Sujet introuvable.</div>`;
                    }
                    return;
                }

                subject = data;
                localStorage.setItem("currentSubject", JSON.stringify(subject));
            }

            if (!subject || !subject.id) {
                if (chapterList) {
                    chapterList.innerHTML = `<div class="empty">Sujet introuvable.</div>`;
                }
                return;
            }

            startPageTracking("chapters", subject.id, null);
            loadChapters(subject.id);
        })();
    }

    if (page === "fiches") {
        (async () => {
            const chapterNameFromUrl = getQueryParam("chapter");
            let chapter = null;

            const storedChapter = localStorage.getItem("currentChapter");
            if (storedChapter) {
                try {
                    chapter = JSON.parse(storedChapter);
                } catch {
                    chapter = null;
                }
            }

            const storedSubject = localStorage.getItem("currentSubject");
            let subject = null;
            if (storedSubject) {
                try {
                    subject = JSON.parse(storedSubject);
                } catch {
                    subject = null;
                }
            }

            if ((!chapter || (chapterNameFromUrl && chapter.name !== chapterNameFromUrl)) && chapterNameFromUrl) {
                let query = client
                    .from("chapters")
                    .select("*")
                    .eq("name", chapterNameFromUrl)
                    .limit(1);

                if (subject && subject.id) {
                    query = query.eq("subject_id", subject.id);
                }

                const { data, error } = await query;

                if (error || !data || data.length === 0) {
                    if (ficheList) {
                        ficheList.innerHTML = `<div class="empty">Chapitre introuvable.</div>`;
                    }
                    return;
                }

                chapter = data[0];
                localStorage.setItem("currentChapter", JSON.stringify(chapter));
            }

            if (!chapter || !chapter.id) {
                if (ficheList) {
                    ficheList.innerHTML = `<div class="empty">Chapitre introuvable.</div>`;
                }
                return;
            }

            startPageTracking("fiches", subject ? subject.id : null, chapter.id);
            loadFiches(chapter.id);
        })();
    }
});

/* ============================================================
   13. Hero section : animation d'introduction (V5 conservé)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("hero-v5");
    const closeBtn = document.getElementById("hero-close");

    if (!hero || !closeBtn) return;

    const h2 = document.querySelector("h2");
    const subjects = document.getElementById("subjects-list");

    if (sessionStorage.getItem("heroSeen") === "1") {
        hero.classList.add("hidden");
        if (h2) h2.classList.remove("hidden");
        if (subjects) subjects.classList.remove("hidden");
        return;
    }

    if (h2) h2.classList.add("hidden");
    if (subjects) subjects.classList.add("hidden");

    closeBtn.addEventListener("click", () => {
        sessionStorage.setItem("heroSeen", "1");

        hero.style.opacity = "0";
        hero.style.transform = "translateY(-10px)";

        setTimeout(() => {
            hero.classList.add("hidden");

            if (h2) h2.classList.remove("hidden");
            if (subjects) subjects.classList.remove("hidden");
        }, 300);
    });
});
