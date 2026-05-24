(function () {
  const config = window.VRATA_SNABL_ANALYTICS || {};
  const measurementId = String(config.ga4MeasurementId || "").trim();
  const storageKey = config.consentStorageKey || "vrata_snabl_analytics_consent";
  const validMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId);
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const copy = isEnglish ? {
    inactive: "Analytics is not active yet. Once the GA4 measurement ID is set, cookie settings can be changed here.",
    bannerLabel: "Analytical cookie settings",
    title: "Help us improve the website",
    text: "We use Google Analytics only after your consent. We measure visits and clicks on phone, e-mail, map and inquiry actions. Form message text is not sent to analytics.",
    privacy: "Privacy and cookies",
    privacyHref: "privacy-cookies.html",
    deny: "Decline",
    accept: "Allow analytics",
  } : {
    inactive: "Analytika zatím není aktivní. Jakmile bude doplněné GA4 měřicí ID, půjde zde upravit souhlas s měřením.",
    bannerLabel: "Nastavení analytických cookies",
    title: "Pomozte nám zlepšovat web",
    text: "Používáme Google Analytics pouze po vašem souhlasu. Měříme návštěvnost a kliknutí na telefon, e-mail, mapu a poptávku. Texty z formuláře neodesíláme do analytiky.",
    privacy: "Soukromí a cookies",
    privacyHref: "ochrana-osobnich-udaju.html",
    deny: "Odmítnout",
    accept: "Povolit analytiku",
  };

  if (!validMeasurementId) {
    window.vrataSnablTrack = function () {};
    document.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-cookie-settings]") : null;
      if (!button) return;

      event.preventDefault();
      window.alert(copy.inactive);
    });
    return;
  }

  const readConsent = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
      // Analytics consent is optional; the site must stay usable without storage.
    }
  };

  const consentGranted = () => readConsent() === "granted";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  const loadGoogleTag = () => {
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      return;
    }

    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      transport_type: "beacon",
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };

  const track = (eventName, params) => {
    if (!consentGranted() || typeof window.gtag !== "function") return;

    window.gtag("event", eventName, {
      page_location: window.location.href,
      page_path: window.location.pathname,
      transport_type: "beacon",
      ...(params || {}),
    });
  };

  window.vrataSnablTrack = track;

  const removeBanner = () => {
    document.querySelector("[data-cookie-banner]")?.remove();
  };

  const showBanner = () => {
    removeBanner();

    const banner = document.createElement("section");
    banner.className = "cookie-consent";
    banner.setAttribute("data-cookie-banner", "");
    banner.setAttribute("aria-label", copy.bannerLabel);
    banner.innerHTML = `
      <div>
        <strong>${copy.title}</strong>
        <p>${copy.text}</p>
        <a href="${copy.privacyHref}">${copy.privacy}</a>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-secondary" data-cookie-deny>${copy.deny}</button>
        <button type="button" class="btn btn-primary" data-cookie-accept>${copy.accept}</button>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      saveConsent("granted");
      loadGoogleTag();
      track("analytics_consent_granted");
      removeBanner();
    });

    banner.querySelector("[data-cookie-deny]").addEventListener("click", () => {
      saveConsent("denied");
      removeBanner();
    });
  };

  const linkEventName = (link) => {
    const href = link.getAttribute("href") || "";
    const text = (link.textContent || "").toLowerCase();

    if (href.startsWith("tel:")) return "click_phone";
    if (href.startsWith("mailto:")) return "click_email";
    if (/wa\.me|whatsapp/i.test(href)) return "click_whatsapp";
    if (/maps\.app\.goo\.gl|google\.com\/maps/i.test(href)) {
      return /profil|recenze/.test(text) ? "click_google_profile" : "click_map";
    }
    if (/#(?:kontakt|contact)$/.test(href) && /poptav|kontakt|inquiry|contact/.test(text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
      return "click_inquiry_cta";
    }

    return "";
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    if (!target) return;

    const eventName = linkEventName(target);
    if (!eventName) return;

    track(eventName, {
      link_url: target.href,
      link_text: (target.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
      link_location: target.className || target.closest("header, footer, main")?.tagName.toLowerCase() || "page",
    });
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target instanceof Element ? event.target.closest("[data-contact-form]") : null;
    if (!form) return;

    track("submit_inquiry", {
      form_id: "contact_form",
      inquiry_type: form.querySelector("[name='service']")?.value || "",
    });
    track("generate_lead", {
      method: "contact_form",
    });
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-cookie-settings]") : null;
    if (button) {
      event.preventDefault();
      showBanner();
    }
  });

  if (consentGranted()) {
    loadGoogleTag();
  } else if (!readConsent()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner, { once: true });
    } else {
      showBanner();
    }
  }
}());
