/**
 * Shared mock for pre-chat dynamic form (unit / integration-style tests).
 * Mirrors a typical `g.preChatFormJson` payload with i18n labels and email regex.
 */
export const PRECHAT_FORM_JSON_MOCK = [
  {
    name: 'userFullname',
    type: 'text',
    mandatory: true,
    label: {
      en: 'User fullname',
      it: 'Nome utente',
    },
  },
  {
    name: 'userEmail',
    type: 'text',
    mandatory: true,
    regex:
      "/^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/",
    label: {
      en: 'Email',
      it: 'Indirizzo email',
    },
    errorLabel: {
      en: 'Invalid email address',
      it: 'Indirizzo email non valido',
    },
  },
];

/** Deep clone so `setTranslations` / `buildFormGroup` can mutate safely in tests. */
export function clonePrechatFormJsonMock(): any[] {
  return JSON.parse(JSON.stringify(PRECHAT_FORM_JSON_MOCK));
}
