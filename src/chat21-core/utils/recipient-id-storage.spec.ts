import { LOCALSTORAGE_KEYS } from 'src/app/utils/constants';
import { LocalSessionStorage } from '../providers/localSessionStorage';
import { clearStoredRecipientId, getStoredRecipientId, setStoredRecipientId } from './recipient-id-storage';

describe('recipient-id-storage', () => {
  const PREFIX = 'widget_sv5';
  const PROJECT_ID = 'proj-123';
  const fullKey = (key: string) => PREFIX + '_' + PROJECT_ID + '_' + key;

  ['local', 'session'].forEach((persistence) => {
    describe(`with persistence "${persistence}"`, () => {
      let storage: LocalSessionStorage;
      let webStorage: Storage;

      beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        storage = new LocalSessionStorage();
        storage.initialize(PREFIX, persistence, PROJECT_ID);
        webStorage = persistence === 'session' ? sessionStorage : localStorage;
      });

      afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      it('setStoredRecipientId saves recipientId and its owner', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBe('support-group-proj-123-aaa');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBe('user-A');
      });

      it('setStoredRecipientId with a null convId removes both keys', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        setStoredRecipientId(storage, null, 'user-A');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBeNull();
      });

      it('getStoredRecipientId returns recipientId when the owner is the current user', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        expect(getStoredRecipientId(storage, 'user-A')).toBe('support-group-proj-123-aaa');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBe('user-A');
      });

      it('getStoredRecipientId returns null and clears the keys when the owner is another user', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        expect(getStoredRecipientId(storage, 'user-B')).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBeNull();
      });

      it('getStoredRecipientId returns null and clears the keys when the owner is missing (new anonymous user)', () => {
        storage.setItem(LOCALSTORAGE_KEYS.RECIPIENT_ID, 'support-group-proj-123-aaa');
        expect(getStoredRecipientId(storage, 'user-B', false)).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBeNull();
      });

      it('getStoredRecipientId adopts a legacy recipientId when allowed (signed in with the stored token)', () => {
        storage.setItem(LOCALSTORAGE_KEYS.RECIPIENT_ID, 'support-group-proj-123-aaa');
        expect(getStoredRecipientId(storage, 'user-A', true)).toBe('support-group-proj-123-aaa');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBe('user-A');
      });

      it('getStoredRecipientId does not adopt a recipientId owned by another user even if legacy is allowed', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        expect(getStoredRecipientId(storage, 'user-B', true)).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBeNull();
      });

      it('getStoredRecipientId without an authenticated user returns null and keeps the keys', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        expect(getStoredRecipientId(storage, null)).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBe('support-group-proj-123-aaa');
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBe('user-A');
      });

      it('clearStoredRecipientId removes both keys', () => {
        setStoredRecipientId(storage, 'support-group-proj-123-aaa', 'user-A');
        clearStoredRecipientId(storage);
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID))).toBeNull();
        expect(webStorage.getItem(fullKey(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER))).toBeNull();
      });
    });
  });
});
