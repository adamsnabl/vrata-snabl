const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector(".site-header");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const formSubmitButton = form?.querySelector("button[type='submit']");
const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const text = isEnglish ? {
  closeMenu: "Close menu",
  openMenu: "Open menu",
  inquiryTitle: "New inquiry from Vrata Šnábl website",
  name: "Name",
  phone: "Phone",
  email: "E-mail",
  location: "Project location",
  service: "Inquiry type",
  messageLabel: "Fault, installation or new door description:",
  subjectPrefix: "Website inquiry",
  sending: "Sending inquiry...",
  sent: "Thank you, the inquiry has been sent to",
  sentFollowUp: "We will get back to you as soon as possible.",
  failed: "The inquiry could not be sent automatically.",
  failedFollowUp: "Please call 777 286 310 or send the inquiry directly to",
  unavailable: "Automatic sending is not configured yet.",
} : {
  closeMenu: "Zavřít menu",
  openMenu: "Otevřít menu",
  inquiryTitle: "Nová poptávka z webu Vrata Šnábl",
  name: "Jméno",
  phone: "Telefon",
  email: "E-mail",
  location: "Lokalita realizace",
  service: "Čeho se poptávka týká",
  messageLabel: "Popis závady, montáže nebo nových vrat:",
  subjectPrefix: "Poptávka z webu",
  sending: "Odesíláme poptávku...",
  sent: "Děkujeme, poptávka byla odeslána na",
  sentFollowUp: "Ozveme se co nejdříve.",
  failed: "Poptávku se nepodařilo automaticky odeslat.",
  failedFollowUp: "Zavolejte prosím 777 286 310 nebo pošlete poptávku přímo na",
  unavailable: "Automatické odeslání zatím není nastavené.",
};

const closeNav = () => {
  if (!nav || !navToggle) return;

  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", text.openMenu);
};

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? text.closeMenu : text.openMenu);
  });

  nav.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;

    if (link) {
      const href = link.getAttribute("href");

      if (href && href.startsWith("#")) {
        const target = document.querySelector(href);

        if (target) {
          event.preventDefault();
          closeNav();
          target.scrollIntoView({ block: "start" });
          history.pushState(null, "", href);
          return;
        }
      }

      closeNav();
    }
  });

  window.addEventListener("hashchange", closeNav);
  window.addEventListener("pageshow", closeNav);
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 981px)").matches) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

if (header) {
  let ticking = false;

  const updateHeaderState = () => {
    header.classList.toggle("has-scrolled", window.scrollY > 8);
    ticking = false;
  };

  updateHeaderState();
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateHeaderState);
    }
  }, { passive: true });
}

const revealTargets = document.querySelectorAll([
  ".service-card",
  ".realization-card",
  ".case-card",
  ".step",
  ".issue-card",
  ".proof-list div",
  ".faq-list details",
  ".contact-methods a",
  ".keyword-grid li",
].join(","));

if (revealTargets.length && !reduceMotion.matches) {
  revealTargets.forEach((element) => element.classList.add("reveal-item"));

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.08,
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }
}

const setFormStatus = (message) => {
  if (!formStatus) return;

  formStatus.hidden = false;
  formStatus.textContent = message;
};

const contactFormStartedAt = form?.querySelector("[name='form_started_at']");
if (contactFormStartedAt) {
  contactFormStartedAt.value = String(Date.now());
}

const parseFormEndpoints = (value) => (value || "")
  .split(",")
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);

const sendFormPayload = async (endpoint, payload) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Form endpoint returned ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));
    if (result.success === false || result.success === "false") {
      throw new Error(result.message || "Form endpoint did not accept the message");
    }

    return {
      endpoint,
      provider: "forpsi_php",
    };
  } finally {
    window.clearTimeout(timeout);
  }
};

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const email = form.getAttribute("data-contact-email") || "adam@vratasnabl.cz";
    const endpoints = parseFormEndpoints(form.getAttribute("data-form-endpoint"));
    const service = data.get("service") || (isEnglish ? "service" : "servis");

    if (data.get("_honey")) return;

    if (!endpoints.length) {
      setFormStatus(`${text.unavailable} ${text.failedFollowUp} ${email}.`);
      return;
    }

    const payload = {
      _subject: data.get("_subject") || `${text.subjectPrefix} - ${service}`,
      _template: data.get("_template") || "table",
      _captcha: data.get("_captcha") || "false",
      submitted_from: `${window.location.origin}${window.location.pathname}${isEnglish ? "#contact" : "#kontakt"}`,
      name: data.get("name") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      location: data.get("location") || "",
      service,
      message: data.get("message") || "",
      form_started_at: data.get("form_started_at") || "",
    };

    try {
      if (formSubmitButton) formSubmitButton.disabled = true;
      setFormStatus(text.sending);

      let deliveryResult = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          deliveryResult = await sendFormPayload(endpoint, payload);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!deliveryResult) {
        throw lastError || new Error("No form endpoint accepted the message");
      }

      form.reset();
      if (contactFormStartedAt) {
        contactFormStartedAt.value = String(Date.now());
      }
      setFormStatus(`${text.sent} ${email}. ${text.sentFollowUp}`);
      if (typeof window.vrataSnablTrack === "function") {
        window.vrataSnablTrack("submit_inquiry", {
          form_id: "contact_form",
          inquiry_type: service,
          delivery: deliveryResult.provider,
        });
        window.vrataSnablTrack("generate_lead", {
          method: "contact_form",
        });
      }
    } catch (error) {
      if (typeof window.vrataSnablTrack === "function") {
        window.vrataSnablTrack("form_send_failed", {
          form_id: "contact_form",
          inquiry_type: service,
        });
      }
      setFormStatus(`${text.failed} ${text.failedFollowUp} ${email}.`);
    } finally {
      if (formSubmitButton) formSubmitButton.disabled = false;
    }
  });
}
