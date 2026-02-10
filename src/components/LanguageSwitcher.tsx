"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language, languageNames } from "@/lib/translations";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Language[] = ["en", "sw", "sheng", "ki"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Globe className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">
          {languageNames[language]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                  language === lang ? "bg-emerald-50 text-emerald-600 font-medium" : "text-slate-700"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
