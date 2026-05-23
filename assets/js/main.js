const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-contact-form]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Zavřít menu" : "Otevřít menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Otevřít menu");
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
    const subject = encodeURIComponent(`Poptávka z webu - ${service}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:adam@vratasnabl.cz?subject=${subject}&body=${body}`;
  });
}
