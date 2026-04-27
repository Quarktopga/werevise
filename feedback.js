/* ============================================================
   We Revise — feedback.js
   Envoi d’un message (300 caractères max)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.getElementById("feedback-text");
    const sendBtn = document.getElementById("send-feedback-btn");
    const statusBox = document.getElementById("feedback-status");

    sendBtn.onclick = async () => {
        const contenu = textarea.value.trim();

        if (contenu.length === 0) {
            showStatus("Le message est vide.", "error");
            return;
        }

        if (contenu.length > 300) {
            showStatus("Le message dépasse 300 caractères.", "error");
            return;
        }

        // Confirmation premium
        if (!confirm("Envoyer ce message ?")) return;

        const { error } = await sendFeedback(contenu);

        if (error) {
            console.error(error);
            showStatus("Erreur lors de l’envoi du message.", "error");
            return;
        }

        textarea.value = "";
        showStatus("Merci pour ton message !", "success");
    };

    function showStatus(msg, type) {
        statusBox.textContent = msg;
        statusBox.style.color = type === "error" ? "#d00" : "#008000";
        statusBox.style.fontWeight = "600";
    }
});
