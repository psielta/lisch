import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
// Importar as traduções em português
import translation from "zod-i18n-map/locales/pt/zod.json";

// Inicializar i18next com o idioma português
i18next.init({
  lng: "pt",
  resources: {
    pt: {
      zod: translation,
    },
  },
});

// Configurar o Zod para usar as traduções
z.setErrorMap(zodI18nMap);

// Exportar a instância configurada do Zod
export { z };
