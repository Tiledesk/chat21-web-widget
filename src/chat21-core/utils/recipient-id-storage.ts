import { AppStorageService } from '../providers/abstract/app-storage.service';
import { LOCALSTORAGE_KEYS } from '../../app/utils/constants';
/**
 * Save the active conversation together with the uid of the user that owns it.
 * A null/empty convId removes both keys.
 */
export function setStoredRecipientId(storage: AppStorageService, convId: string, ownerUid: string): void {
  if (!convId || !ownerUid) {
    clearStoredRecipientId(storage);
    return;
  }
  storage.setItem(LOCALSTORAGE_KEYS.RECIPIENT_ID, convId);
  storage.setItem(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER, ownerUid);
}

/**
 * Return the stored conversation only if it belongs to currentUid; otherwise remove both keys.
 * With no currentUid (not yet authenticated) nothing is returned and nothing is removed.
 * allowLegacy: accept a recipientId saved before recipientIdOwner existed and adopt it for currentUid.
 * It must be true only when currentUid signed in with the token already present in storage.
 */
export function getStoredRecipientId(storage: AppStorageService, currentUid: string, allowLegacy: boolean = false): string | null {
  if (!currentUid) {
    return null;
  }
  const recipientId = storage.getItem(LOCALSTORAGE_KEYS.RECIPIENT_ID);
  if (!recipientId) {
    storage.removeItem(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER);
    return null;
  }
  const ownerUid = storage.getItem(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER);
  if (ownerUid === currentUid) {
    return recipientId;
  }
  if (!ownerUid && allowLegacy) {
    storage.setItem(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER, currentUid);
    return recipientId;
  }
  clearStoredRecipientId(storage);
  return null;
}

export function clearStoredRecipientId(storage: AppStorageService): void {
  storage.removeItem(LOCALSTORAGE_KEYS.RECIPIENT_ID);
  storage.removeItem(LOCALSTORAGE_KEYS.RECIPIENT_ID_OWNER);
}
