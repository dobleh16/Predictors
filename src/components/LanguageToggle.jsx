// src/components/LanguageToggle.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageToggle({ className = "" }) {
  const { i18n } = useTranslation();
  const current = i18n.language || "es";

  const handleChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") localStorage.setItem("i18nextLng", lang);
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Seleccionar idioma / Select language"
      className={className}
    >
      <option value="es">ES</option>
      <option value="en">EN</option>
    </select>
  );
}
