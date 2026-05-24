const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const formSubmitButton = form?.querySelector("button[type='submit']");
const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");

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
  fallbackOpened: "We opened your e-mail app with the address",
  fallbackSend: "The message still needs to be sent. If the e-mail app does not open, please call 777 286 310.",
  sending: "Sending inquiry...",
  sent: "Thank you, the inquiry has been sent to",
  sentFollowUp: "We will get back to you as soon as possible.",
  failed: "The inquiry could not be sent automatically. We opened a prepared e-mail to",
  failedFollowUp: "please send the message there, or call 777 286 310.",
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
  fallbackOpened: "Otevřeli jsme e-mailovou aplikaci s adresou",
  fallbackSend: "Zprávu je potřeba ještě odeslat. Pokud se e-mailová aplikace neotevře, zavolejte 777 286 310.",
  sending: "Odesíláme poptávku...",
  sent: "Děkujeme, poptávka byla odeslána na",
  sentFollowUp: "Ozveme se co nejdříve.",
  failed: "Poptávku se nepodařilo odeslat automaticky. Otevřeli jsme proto připravený e-mail na",
  failedFollowUp: "zprávu prosím ještě odešlete, nebo zavolejte 777 286 310.",
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

const buildMailtoLink = (formData, email) => {
  const lines = [
    text.inquiryTitle,
    "",
    `${text.name}: ${formData.get("name") || ""}`,
    `${text.phone}: ${formData.get("phone") || ""}`,
    `${text.email}: ${formData.get("email") || ""}`,
    `${text.location}: ${formData.get("location") || ""}`,
    `${text.service}: ${formData.get("service") || ""}`,
    "",
    text.messageLabel,
    `${formData.get("message") || ""}`,
  ];

  const service = formData.get("service") || (isEnglish ? "service" : "servis");
  const subject = encodeURIComponent(`${text.subjectPrefix} - ${service}`);
  const body = encodeURIComponent(lines.join("\n"));

  return `mailto:${email}?subject=${subject}&body=${body}`;
};

const setFormStatus = (message) => {
  if (!formStatus) return;

  formStatus.hidden = false;
  formStatus.textContent = message;
};

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const email = form.getAttribute("data-contact-email") || "adam@vratasnabl.cz";
    const endpoint = form.getAttribute("data-form-endpoint") || "";
    const service = data.get("service") || (isEnglish ? "service" : "servis");

    if (data.get("_honey")) return;

    if (!endpoint) {
      setFormStatus(`${text.fallbackOpened} ${email}. ${text.fallbackSend}`);
      window.location.href = buildMailtoLink(data, email);
      return;
    }

    const payload = {
      _subject: `${text.subjectPrefix} - ${service}`,
      _template: "table",
      _captcha: "false",
      _url: `${window.location.origin}${window.location.pathname}${isEnglish ? "#contact" : "#kontakt"}`,
      name: data.get("name") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      location: data.get("location") || "",
      service,
      message: data.get("message") || "",
    };

    try {
      if (formSubmitButton) formSubmitButton.disabled = true;
      setFormStatus(text.sending);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Form endpoint returned ${response.status}`);
      }

      const result = await response.json().catch(() => ({}));
      if (result.success === false || result.success === "false") {
        throw new Error(result.message || "Form endpoint did not accept the message");
      }

      form.reset();
      setFormStatus(`${text.sent} ${email}. ${text.sentFollowUp}`);
    } catch (error) {
      setFormStatus(`${text.failed} ${email}; ${text.failedFollowUp}`);
      window.location.href = buildMailtoLink(data, email);
    } finally {
      if (formSubmitButton) formSubmitButton.disabled = false;
    }
  });
}
