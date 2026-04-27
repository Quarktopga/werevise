(function () {
  const SUPABASE_URL = "https://jaedzrrkdtglnltvbded.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_8rojKIhY-3WDhHx73kl7ZA_XJ0X9Vsg";

  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(mobile|iphone|android)/.test(ua)) return "mobile";
    if (/(tablet|ipad)/.test(ua)) return "tablet";
    return "desktop";
  }

  function detectPage() {
    const path = (location.pathname || "").replace(/^\//, "");
    return path || "index";
  }

  async function initTracking() {
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const page = detectPage();
      const device = detectDevice();
      const startTime = Date.now();
      let durationSent = false;

      const { error: arrivalError } = await client
        .from("visites")
        .insert({
          page,
          device,
          duration_seconds: null,
        })
        .select();

      if (arrivalError) {
        console.error(arrivalError);
      }

      document.addEventListener("visibilitychange", async function () {
        if (document.visibilityState !== "hidden" || durationSent) return;
        durationSent = true;

        const durationSeconds = Math.round((Date.now() - startTime) / 1000);

        const { error: durationError } = await client
          .from("visites")
          .insert({
            page,
            device,
            duration_seconds: durationSeconds,
          })
          .select();

        if (durationError) {
          console.error(durationError);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (window.supabase && typeof window.supabase.createClient === "function") {
    initTracking();
    return;
  }

  const sdkScript = document.createElement("script");
  sdkScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  sdkScript.onload = initTracking;
  sdkScript.onerror = function (error) {
    console.error(error);
  };
  document.head.appendChild(sdkScript);
})();
