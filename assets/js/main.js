const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

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

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const lines = [
      "Nová poptávka z webu Vrata Šnábl",
      "",
      `Jméno: ${data.get("name") || ""}`,
      `Telefon: ${data.get("phone") || ""}`,
      `Lokalita realizace: ${data.get("location") || ""}`,
      `Čeho se poptávka týká: ${data.get("service") || ""}`,
      "",
      "Popis závady, montáže nebo nových vrat:",
      `${data.get("message") || ""}`,
    ];

    const service = data.get("service") || "servis";
    const email = form.getAttribute("data-contact-email") || "adam@vratasnabl.cz";
    const subject = encodeURIComponent(`Poptávka z webu - ${service}`);
    const body = encodeURIComponent(lines.join("\n"));

    if (formStatus) {
      formStatus.hidden = false;
      formStatus.textContent = `Otevřeli jsme e-mailovou aplikaci s adresou ${email}. Zprávu je potřeba ještě odeslat. Pokud se e-mailová aplikace neotevře, zavolejte 777 286 310.`;
    }

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  });
}
