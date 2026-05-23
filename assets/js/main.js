const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const formSubmitButton = form?.querySelector("button[type='submit']");

const closeNav = () => {
  if (!nav || !navToggle) return;

  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Otevřít menu");
};

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Zavřít menu" : "Otevřít menu");
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
    "Nová poptávka z webu Vrata Šnábl",
    "",
    `Jméno: ${formData.get("name") || ""}`,
    `Telefon: ${formData.get("phone") || ""}`,
    `E-mail: ${formData.get("email") || ""}`,
    `Lokalita realizace: ${formData.get("location") || ""}`,
    `Čeho se poptávka týká: ${formData.get("service") || ""}`,
    "",
    "Popis závady, montáže nebo nových vrat:",
    `${formData.get("message") || ""}`,
  ];

  const service = formData.get("service") || "servis";
  const subject = encodeURIComponent(`Poptávka z webu - ${service}`);
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
    const service = data.get("service") || "servis";

    if (data.get("_honey")) return;

    if (!endpoint) {
      setFormStatus(`Otevřeli jsme e-mailovou aplikaci s adresou ${email}. Zprávu je potřeba ještě odeslat. Pokud se e-mailová aplikace neotevře, zavolejte 777 286 310.`);
      window.location.href = buildMailtoLink(data, email);
      return;
    }

    const payload = {
      _subject: `Poptávka z webu - ${service}`,
      _template: "table",
      _captcha: "false",
      _url: `${window.location.origin}${window.location.pathname}#kontakt`,
      name: data.get("name") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      location: data.get("location") || "",
      service,
      message: data.get("message") || "",
    };

    try {
      if (formSubmitButton) formSubmitButton.disabled = true;
      setFormStatus("Odesíláme poptávku...");

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
      setFormStatus(`Děkujeme, poptávka byla odeslána na ${email}. Ozveme se co nejdříve.`);
    } catch (error) {
      setFormStatus(`Poptávku se nepodařilo odeslat automaticky. Otevřeli jsme proto připravený e-mail na ${email}; zprávu prosím ještě odešlete, nebo zavolejte 777 286 310.`);
      window.location.href = buildMailtoLink(data, email);
    } finally {
      if (formSubmitButton) formSubmitButton.disabled = false;
    }
  });
}
