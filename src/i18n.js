// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import es from "./translations/es.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
};

// Detectar idioma guardado o navegador
let defaultLang = "en";
if (typeof window !== "undefined") {
  const savedLang = localStorage.getItem("i18nextLng");
  if (savedLang && resources[savedLang]) {
    defaultLang = savedLang;
  } else {
    const browserLang = navigator.language?.split("-")[0];
    defaultLang = resources[browserLang] ? browserLang : "en";
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Guardar idioma cuando cambie
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", lng);
  }
});

export default i18n;
