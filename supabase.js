/* ============================================================
   We Revise — supabase.js
   Connexion + fonctions utilitaires cohérentes avec werevise.sql
   ============================================================ */

/* ============================================================
   1. Connexion Supabase
   ============================================================ */

// NE PAS redéclarer "supabase".
// La librairie Supabase (chargée dans le HTML) fournit déjà l'objet global "supabase".

const SUPABASE_URL = "https://jaedzrrkdtglnltvbded.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8rojKIhY-3WDhHx73kl7ZA_XJ0X9Vsg";

// On crée NOTRE client, sans écraser la variable globale
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* ============================================================
   2. Fonctions Subjects (matières)
   ============================================================ */

async function getSubjects() {
    return await client
        .from("subjects")
        .select("*")
        .order("order_index", { ascending: true });
}


/* ============================================================
   3. Fonctions Chapters (chapitres)
   ============================================================ */

async function getChaptersBySubject(subjectId) {
    return await client
        .from("chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });
}

async function createChapter(subjectId, name) {
    return await client
        .from("chapters")
        .insert([{ subject_id: subjectId, name }]);
}


/* ============================================================
   4. Fonctions Fiches (fichiers PDF/JPEG/PNG)
   ============================================================ */

async function getFichesByChapter(chapterId) {
    return await client
        .from("fiches")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });
}

async function insertFiche(chapterId, name, fileUrl, fileType) {
    return await client
        .from("fiches")
        .insert([{ chapter_id: chapterId, name, file_url: fileUrl, file_type: fileType }]);
}


/* ============================================================
   5. Upload Storage (bucket : fiches)
   ============================================================ */

async function uploadFicheToStorage(chapterId, file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const filePath = `${chapterId}/${Date.now()}-${file.name}`;

    // Upload du fichier
    const { error: uploadError } = await client.storage
        .from("fiches")
        .upload(filePath, file);

    if (uploadError) return { error: uploadError };

    // URL publique
    const { data: urlData } = client.storage
        .from("fiches")
        .getPublicUrl(filePath);

    return {
        url: urlData.publicUrl,
        type: ext
    };
}


/* ============================================================
   6. Feedback (id, contenu, created_at)
   ============================================================ */

async function sendFeedback(contenu) {
    return await client
        .from("feedback")
        .insert([{ contenu }]);
}
