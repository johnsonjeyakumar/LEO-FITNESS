const mockFirestore = {
  collection: () => ({}),
  doc: () => ({}),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => null }),
  getDocs: () => Promise.resolve({ forEach: () => {} }),
  setDoc: () => Promise.resolve(),
  updateDoc: () => Promise.resolve(),
  deleteDoc: () => Promise.resolve(),
  serverTimestamp: () => null,
};

export const db = mockFirestore as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
} as any;

export default { auth, db };
