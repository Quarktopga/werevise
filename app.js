/* ============================================================
   We Revise — app.js (version PREMIUM)
   Gestion dynamique des matières, chapitres et fiches
   ============================================================ */

/* ============================================================
   1. Sélecteurs globaux
   ============================================================ */

const subjectsGrid = document.querySelector("#subjects-list");
const chapterList = document.querySelector(".chapter-list");
const ficheList = document.querySelector(".fiche-list");

/* Panneau latéral premium pour afficher les fiches */
let fichePanel;

/* ============================================================
   2. Fonctions : Chargement des matières
   ============================================================ */

async function loadSubjects() {
    const { data, error } = await client
        .from("subjects")
        .select("*")
        .order("order_index", { ascending: true });

    if (error) {
        console.error(error);
        subjectsGrid.innerHTML = `<div class="empty">Impossible de charger les matières.</div>`;
        return;
    }

    subjectsGrid.innerHTML = "";

    data.forEach(subject => {
        const card = document.createElement("div");
        card.className =
        "subject-card"
        + (subject.class === "brevet" ? " brevet" : "")
        + (subject.class === "brevet-sci" ? " brevet-sci" : "");

        card.textContent = subject.name;

        card.onclick = () => {
            localStorage.setItem("currentSubject", JSON.stringify(subject));
            location.href = "chapters.html";
        };

        subjectsGrid.appendChild(card);
    });
}
/* ============================================================
   3. Fonctions : Chargement des chapitres
   ============================================================ */

async function loadChapters(subjectId) {
    const { data, error } = await client
        .from("chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        chapterList.innerHTML = `<div class="empty">Impossible de charger les chapitres.</div>`;
        return;
    }

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
            localStorage.setItem("currentChapter", JSON.stringify(ch));
            location.href = "fiches.html";
        };

        chapterList.appendChild(item);
    });
}

/* ============================================================
   4. Fonctions : Création d'un chapitre
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
   5. Fonctions : Chargement des fiches
   ============================================================ */

async function loadFiches(chapterId) {
    const { data, error } = await client
        .from("fiches")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        ficheList.innerHTML = `<div class="empty">Impossible de charger les fiches.</div>`;
        return;
    }

    ficheList.innerHTML = "";

    if (data.length === 0) {
        ficheList.innerHTML = `<div class="empty">Aucune fiche pour ce chapitre.</div>`;
        return;
    }

    data.forEach(f => {
        const item = document.createElement("div");
        item.className = "fiche-item";

        item.innerHTML = `
            <span>${f.name}</span>
            <span class="fiche-type">${f.file_type.toUpperCase()}</span>
        `;

        item.onclick = () => openFiche(f.file_url);

        ficheList.appendChild(item);
    });
}

/* ============================================================
   6. Fonctions : Import d'une fiche (upload Storage)
   ============================================================ */

async function uploadFiche(chapterId, file, name) {
    const ext = file.name.split(".").pop().toLowerCase();
    const filePath = `${chapterId}/${Date.now()}-${file.name}`;

    // Upload dans Storage
    const { error: uploadError } = await client.storage
        .from("fiches")
        .upload(filePath, file);

    if (uploadError) {
        console.error(uploadError);
        alert("Erreur lors de l'upload du fichier.");
        return;
    }

    // Récupération de l'URL publique
    const { data: urlData } = client.storage
        .from("fiches")
        .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Insertion dans la table SQL
    const { error: insertError } = await client
        .from("fiches")
        .insert([{ chapter_id: chapterId, name, file_url: fileUrl, file_type: ext }]);

    if (insertError) {
        console.error(insertError);
        alert("Erreur lors de l'enregistrement de la fiche.");
        return;
    }

    loadFiches(chapterId);
}

/* ============================================================
   7. Fonctions : Ouverture premium des fiches
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
   8. Initialisation automatique selon la page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "subjects") loadSubjects();

    if (page === "chapters") {
        const subject = JSON.parse(localStorage.getItem("currentSubject"));
        loadChapters(subject.id);
    }

    if (page === "fiches") {
        const chapter = JSON.parse(localStorage.getItem("currentChapter"));
        loadFiches(chapter.id);
    }
});

// ============================
// Hero section : animation d'introduction
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("hero-v5");
    const closeBtn = document.getElementById("hero-close");

    const h2 = document.querySelector("h2");
    const subjects = document.getElementById("subjects-list");

    // 👉 Si l'utilisateur a déjà vu le Hero dans CETTE session
    if (sessionStorage.getItem("heroSeen") === "1") {
        hero.classList.add("hidden");
        h2.classList.remove("hidden");
        subjects.classList.remove("hidden");
        return;
    }

    // Masquer tout le contenu sous le Hero
    h2.classList.add("hidden");
    subjects.classList.add("hidden");

    closeBtn.addEventListener("click", () => {

        // 👉 Le Hero ne reviendra plus tant que l'onglet reste ouvert
        sessionStorage.setItem("heroSeen", "1");

        hero.style.opacity = "0";
        hero.style.transform = "translateY(-10px)";

        setTimeout(() => {
            hero.classList.add("hidden");

            // Réafficher le contenu
            h2.classList.remove("hidden");
            subjects.classList.remove("hidden");
        }, 300);
    });
});
