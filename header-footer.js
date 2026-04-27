async function loadComponent(selector, file) {
    const container = document.querySelector(selector);
    if (!container) return;

    try {
        const response = await fetch(file);
        const html = await response.text();
        container.innerHTML = html;

       
        // Dès que le header est chargé, on initialise le menu burger
        if (selector === "header") {
            initBurgerMenu();
        }

    } catch (err) {
        console.error("Erreur chargement composant :", file, err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header", "header.html");
    loadComponent("footer", "footer.html");
});


// ------------------------------------------------------------
// AJOUT : Fonction d'initialisation du menu burger
// ------------------------------------------------------------
function initBurgerMenu() {
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav-links");

    // Si le header n'est pas encore injecté → on attend
    if (!burger || !nav) {
        console.warn("Burger non trouvé, réessai dans 50ms…");
        setTimeout(initBurgerMenu, 50);
        return;
    }

    // Éviter double attachement
    if (burger.dataset.initialized === "true") return;
    burger.dataset.initialized = "true";

    burger.addEventListener("click", () => {
        nav.classList.toggle("open");
        burger.classList.toggle("active");
    });

    console.log("Burger menu initialisé !");
}
