import { LocalSessionStorage } from './localSessionStorage';

describe('LocalSessionStorage', () => {
  const PREFIX = 'widget_sv5';
  const PROJECT_ID = 'proj-123';
  const OTHER_KEY = 'other_app_key';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function seed(webStorage: Storage) {
    webStorage.setItem(PREFIX + '_' + PROJECT_ID + '_tiledeskToken', 'JWT token');
    webStorage.setItem(PREFIX + '_' + PROJECT_ID + '_recipientId', 'support-group-proj-123-aaa');
    webStorage.setItem(PREFIX + '_' + PROJECT_ID + '_recipientIdOwner', 'user-A');
    webStorage.setItem(OTHER_KEY, 'keep me');
  }

  it('clear() with persistence "local" removes the widget keys from localStorage', () => {
    const storage = new LocalSessionStorage();
    storage.initialize(PREFIX, 'local', PROJECT_ID);
    seed(localStorage);
    seed(sessionStorage);

    storage.clear();

    expect(storage.getItem('tiledeskToken')).toBeNull();
    expect(storage.getItem('recipientId')).toBeNull();
    expect(storage.getItem('recipientIdOwner')).toBeNull();
    expect(localStorage.getItem(OTHER_KEY)).toBe('keep me');
    expect(sessionStorage.length).toBe(4);
  });

  it('clear() with persistence "session" removes the widget keys from sessionStorage', () => {
    const storage = new LocalSessionStorage();
    storage.initialize(PREFIX, 'session', PROJECT_ID);
    seed(sessionStorage);
    seed(localStorage);

    storage.clear();

    expect(storage.getItem('tiledeskToken')).toBeNull();
    expect(storage.getItem('recipientId')).toBeNull();
    expect(storage.getItem('recipientIdOwner')).toBeNull();
    expect(sessionStorage.getItem(OTHER_KEY)).toBe('keep me');
    expect(localStorage.length).toBe(4);
  });

  it('clear() with persistence "none" does not touch any storage', () => {
    const storage = new LocalSessionStorage();
    storage.initialize(PREFIX, 'none', PROJECT_ID);
    seed(localStorage);
    seed(sessionStorage);

    storage.clear();

    expect(localStorage.length).toBe(4);
    expect(sessionStorage.length).toBe(4);
  });
});
