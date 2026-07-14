/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingList, Product, Category, ActivityLog, AppConfig, UserProfile } from '../types';
import { INITIAL_CATEGORIES, INITIAL_CONFIG } from '../mockData';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  writeBatch,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { 
  ref, 
  listAll, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../services/firebase';

interface AppContextType {
  lists: ShoppingList[];
  products: Product[];
  categories: Category[];
  config: AppConfig;
  user: UserProfile | null;
  logs: ActivityLog[];
  syncStatus: 'synced' | 'syncing' | 'offline';
  currentView: 'dashboard' | 'lists' | 'favorites' | 'history' | 'settings' | 'super_admin';
  selectedListId: string | null;
  isEmailVerified: boolean;
  isLoadingAuth: boolean;
  
  // Auth actions
  login: (provider: 'google' | 'apple' | 'email', email?: string, name?: string) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  sendEmailVerificationLink: () => Promise<void>;
  checkEmailVerificationStatus: () => Promise<boolean>;

  // List actions
  addList: (list: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateList: (id: string, updates: Partial<ShoppingList>) => void;
  deleteList: (id: string) => void;
  restoreListState: (logId: string) => void;

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  addMultipleProducts: (newProducts: Omit<Product, 'id' | 'updatedAt'>[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleBought: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addFavoriteToList: (productId: string, listId: string) => void;

  // Global settings
  updateConfig: (updates: Partial<AppConfig>) => void;
  setView: (view: 'dashboard' | 'lists' | 'favorites' | 'history' | 'settings' | 'super_admin', listId?: string | null) => void;

  // Data sync & export
  triggerSync: () => Promise<void>;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  const [config, setConfig] = useState<AppConfig>(() => {
    const stored = localStorage.getItem('smartlist_config');
    return stored ? JSON.parse(stored) : INITIAL_CONFIG;
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [currentView, setCurrentView] = useState<'dashboard' | 'lists' | 'favorites' | 'history' | 'settings' | 'super_admin'>('dashboard');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync settings to localStorage for immediate visual performance on boot
  useEffect(() => {
    localStorage.setItem('smartlist_config', JSON.stringify(config));
  }, [config]);

  // Real-time user session and data stream manager
  useEffect(() => {
    let unsubUser: () => void = () => {};
    let unsubLists: () => void = () => {};
    let unsubProducts: () => void = () => {};
    let unsubLogs: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoadingAuth(true);
      if (firebaseUser) {
        setIsEmailVerified(firebaseUser.emailVerified);
        const uid = firebaseUser.uid;

        const userDocRef = doc(db, 'users', uid);
        
        const nowIso = new Date().toISOString();
        const profileData = {
          id: uid,
          name: firebaseUser.displayName || 'Usuário SmartList',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || undefined,
          provider: (firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 
                     firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple' : 'email') as any,
          createdAt: nowIso,
          plan: 'Free' as const,
          settings: config,
          stats: {
            totalLists: 0,
            totalProducts: 0,
            favoriteProductsCount: 0,
            boughtProductsCount: 0,
            totalEstimatedValue: 0,
            totalPaidValue: 0,
          },
          lastLogin: nowIso,
          emailVerified: firebaseUser.emailVerified,
          role: 'user' as const
        };

        try {
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            // New user registration profile initialization
            await setDoc(userDocRef, profileData);
            setUser(profileData);
          } else {
            // Existing user login profile update
            const existingData = userSnap.data();
            const updatedProfile = {
              ...profileData,
              name: existingData.name || profileData.name,
              photoUrl: existingData.photoUrl || profileData.photoUrl,
              createdAt: existingData.createdAt || profileData.createdAt,
              plan: existingData.plan || 'Free',
              settings: { ...config, ...existingData.settings },
              stats: existingData.stats || profileData.stats,
              lastLogin: nowIso,
              emailVerified: firebaseUser.emailVerified,
              role: existingData.role || 'user'
            };
            await updateDoc(userDocRef, {
              lastLogin: nowIso,
              emailVerified: firebaseUser.emailVerified
            }).catch(e => console.warn("Could not write lastLogin (continuing offline):", e));
            setUser(updatedProfile);
            if (existingData.settings) {
              setConfig(existingData.settings);
            }
          }
        } catch (error) {
          console.warn("Firestore user profile loading failed (likely offline):", error);
          setUser(profileData);
          setSyncStatus('offline');
        }

        // Real-time user profile listener
        try {
          unsubUser = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setUser(prev => prev ? { ...prev, ...data } : data);
              if (data.settings) {
                setConfig(data.settings);
              }
            }
          }, (error) => {
            console.error("Firestore user snapshot error:", error);
            setSyncStatus('offline');
          });
        } catch (snapErr) {
          console.warn("Failed to subscribe to user snapshots:", snapErr);
          setSyncStatus('offline');
        }

        // Set up secure real-time stream listeners for lists, products, and logs owned by the authenticated user
        setSyncStatus('syncing');

        const listsQuery = query(
          collection(db, 'listas'), 
          where('ownerId', '==', uid)
        );
        unsubLists = onSnapshot(listsQuery, (snapshot) => {
          const fetchedLists: ShoppingList[] = [];
          snapshot.forEach((doc) => {
            fetchedLists.push({ id: doc.id, ...doc.data() } as ShoppingList);
          });
          // Sort lists by updatedAt descending
          fetchedLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setLists(fetchedLists);
          setSyncStatus('synced');
        }, (error) => {
          console.error("Firestore lists snapshot error:", error);
          setSyncStatus('offline');
        });

        const productsQuery = query(
          collection(db, 'produtos'), 
          where('ownerId', '==', uid)
        );
        unsubProducts = onSnapshot(productsQuery, (snapshot) => {
          const fetchedProducts: Product[] = [];
          snapshot.forEach((doc) => {
            fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(fetchedProducts);
          setSyncStatus('synced');
        }, (error) => {
          console.error("Firestore products snapshot error:", error);
          setSyncStatus('offline');
        });

        const logsQuery = query(
          collection(db, 'logs'), 
          where('ownerId', '==', uid)
        );
        unsubLogs = onSnapshot(logsQuery, (snapshot) => {
          const fetchedLogs: ActivityLog[] = [];
          snapshot.forEach((doc) => {
            fetchedLogs.push({ id: doc.id, ...doc.data() } as ActivityLog);
          });
          // Sort by timestamp descending
          fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(fetchedLogs.slice(0, 50)); // Only keep 50 logs in UI memory
          setSyncStatus('synced');
        }, (error) => {
          console.error("Firestore logs snapshot error:", error);
          setSyncStatus('offline');
        });

      } else {
        // User logout cleanup: clear listeners and state
        unsubUser();
        unsubLists();
        unsubProducts();
        unsubLogs();

        setUser(null);
        setIsEmailVerified(false);
        setLists([]);
        setProducts([]);
        setLogs([]);
        setSelectedListId(null);
        setCurrentView('dashboard');
        setSyncStatus('synced');
      }
      setIsLoadingAuth(false);
    });

    return () => {
      unsubscribeAuth();
      unsubUser();
      unsubLists();
      unsubProducts();
      unsubLogs();
    };
  }, []);

  // Update dynamic user profile stats whenever lists or products change
  useEffect(() => {
    if (!auth.currentUser || !user) return;

    const favoriteProductsCount = products.filter(p => p.isFavorite).length;
    const boughtProductsCount = products.filter(p => p.isBought).length;
    const totalEstimatedValue = products.reduce((acc, p) => acc + (p.estimatedPrice * p.quantity), 0);
    const totalPaidValue = products.reduce((acc, p) => acc + (p.isBought ? (p.paidPrice || p.estimatedPrice) * p.quantity : 0), 0);

    const stats = {
      totalLists: lists.length,
      totalProducts: products.length,
      favoriteProductsCount,
      boughtProductsCount,
      totalEstimatedValue,
      totalPaidValue
    };

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    updateDoc(userDocRef, { stats }).catch(err => console.warn("Error updating stats in Firestore:", err));
  }, [lists, products]);

  // Add internal activity log in Firestore
  const addLog = async (action: ActivityLog['action'], details: string, listId?: string, payload?: string) => {
    if (!auth.currentUser) return;
    const newId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newLog = {
      id: newId,
      ownerId: auth.currentUser.uid,
      timestamp: new Date().toISOString(),
      action,
      details,
      listId: listId || null,
      payload: payload || null
    };
    try {
      await setDoc(doc(db, 'logs', newId), newLog);
    } catch (err) {
      console.warn("Offline or permission error writing log:", err);
    }
  };

  // Auth Operations
  const login = (provider: 'google' | 'apple' | 'email', email?: string, name?: string) => {
    // For back compatibility, redirects can be mapped, but we handle via beautiful dedicated promises instead
    console.log(`Deprecated Context login method triggered for provider ${provider}`);
  };

  const loginWithEmail = async (email: string, password: string) => {
    setSyncStatus('syncing');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setSyncStatus('syncing');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);
    }
  };

  const loginWithGoogle = async () => {
    setSyncStatus('syncing');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithApple = async () => {
    setSyncStatus('syncing');
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    setSyncStatus('syncing');
    await signOut(auth);
    localStorage.clear();
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setSyncStatus('syncing');

    const uid = currentUser.uid;

    // 1. Delete all Firestore lists
    const listsSnap = await getDocs(query(collection(db, 'listas'), where('ownerId', '==', uid)));
    const batch = writeBatch(db);
    listsSnap.docs.forEach(doc => batch.delete(doc.ref));

    // 2. Delete all products
    const productsSnap = await getDocs(query(collection(db, 'produtos'), where('ownerId', '==', uid)));
    productsSnap.docs.forEach(doc => batch.delete(doc.ref));

    // 3. Delete all logs
    const logsSnap = await getDocs(query(collection(db, 'logs'), where('ownerId', '==', uid)));
    logsSnap.docs.forEach(doc => batch.delete(doc.ref));

    // 4. Delete profile
    batch.delete(doc(db, 'users', uid));

    await batch.commit();

    // 5. Delete user files in Storage
    try {
      const userStorageRef = ref(storage, `usuarios/${uid}`);
      const listRes = await listAll(userStorageRef);
      const deleteFolder = async (folderRef: any) => {
        const list = await listAll(folderRef);
        for (const fileRef of list.items) {
          await deleteObject(fileRef);
        }
        for (const subFolderRef of list.prefixes) {
          await deleteFolder(subFolderRef);
        }
      };
      await deleteFolder(userStorageRef);
    } catch (err) {
      console.warn("Storage cleanup failed or empty:", err);
    }

    // 6. Delete authentication record
    await deleteUser(currentUser);
    localStorage.clear();
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    await sendPasswordResetEmail(auth, email);
    return true;
  };

  const sendEmailVerificationLink = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkEmailVerificationStatus = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setIsEmailVerified(verified);
      
      // Update Firestore profile
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { emailVerified: verified });
      return verified;
    }
    return false;
  };

  // List Operations
  const addList = (list: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>): string => {
    if (!auth.currentUser) return '';
    const newId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newList = {
      ...list,
      id: newId,
      ownerId: auth.currentUser.uid,
      participants: [auth.currentUser.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setDoc(doc(db, 'listas', newId), newList).catch(err => console.error("Error creating list:", err));
    addLog('create_list', `Criou a lista "${list.name}"`, newId, JSON.stringify(newList));
    return newId;
  };

  const updateList = (id: string, updates: Partial<ShoppingList>) => {
    if (!auth.currentUser) return;
    const ref = doc(db, 'listas', id);
    updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    }).catch(err => console.error("Error updating list:", err));
    
    addLog('update_list', `Atualizou a lista "${updates.name || 'modificada'}"`, id);
  };

  const deleteList = async (id: string) => {
    if (!auth.currentUser) return;
    const list = lists.find((l) => l.id === id);
    if (!list) return;

    const associatedProducts = products.filter((p) => p.listId === id);
    const backupPayload = JSON.stringify({ list, products: associatedProducts });

    const batch = writeBatch(db);
    batch.delete(doc(db, 'listas', id));
    associatedProducts.forEach(p => batch.delete(doc(db, 'produtos', p.id)));

    await batch.commit().catch(err => console.error("Error deleting list batch:", err));

    if (selectedListId === id) {
      setSelectedListId(null);
      setCurrentView('lists');
    }

    addLog('delete_list', `Excluiu a lista "${list.name}"`, id, backupPayload);
  };

  const restoreListState = async (logId: string) => {
    if (!auth.currentUser) return;
    const log = logs.find((l) => l.id === logId);
    if (!log || !log.payload) return;

    try {
      const data = JSON.parse(log.payload);
      
      if (log.action === 'delete_list' && data.list) {
        const restoredList = {
          ...data.list,
          ownerId: auth.currentUser.uid,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'listas', restoredList.id), restoredList);
        
        if (data.products && Array.isArray(data.products)) {
          const batch = writeBatch(db);
          data.products.forEach((p: any) => {
            batch.set(doc(db, 'produtos', p.id), {
              ...p,
              ownerId: auth.currentUser!.uid,
              updatedAt: new Date().toISOString()
            });
          });
          await batch.commit();
        }
        addLog('restore_list', `Restaurou a lista "${restoredList.name}" excluída`, restoredList.id);
      } else if (log.action === 'create_list' && data.id) {
        await setDoc(doc(db, 'listas', data.id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
        addLog('restore_list', `Restaurou o estado original da lista "${data.name}"`, data.id);
      }
    } catch (e) {
      console.error('Failed to parse restore payload', e);
    }
  };

  // Product Operations
  const addProduct = (product: Omit<Product, 'id' | 'updatedAt'>) => {
    if (!auth.currentUser) return;
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProduct = {
      ...product,
      id: newId,
      ownerId: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
    };
    setDoc(doc(db, 'produtos', newId), newProduct).catch(err => console.error("Error adding product:", err));
    addLog('add_product', `Adicionou o produto "${product.name}"`, product.listId);
  };

  const addMultipleProducts = (newProducts: Omit<Product, 'id' | 'updatedAt'>[]) => {
    if (!auth.currentUser || newProducts.length === 0) return;
    const batch = writeBatch(db);
    newProducts.forEach((p, index) => {
      const newId = `prod-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      batch.set(doc(db, 'produtos', newId), {
        ...p,
        id: newId,
        ownerId: auth.currentUser!.uid,
        updatedAt: new Date().toISOString(),
      });
    });
    batch.commit().catch(err => console.error("Error batch-adding products:", err));
    addLog('add_product', `Importou ${newProducts.length} produtos em lote por texto`, newProducts[0]?.listId || '');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!auth.currentUser) return;
    updateDoc(doc(db, 'produtos', id), {
      ...updates,
      updatedAt: new Date().toISOString()
    }).catch(err => console.error("Error updating product:", err));

    const prod = products.find(p => p.id === id);
    if (prod) {
      addLog('update_product', `Atualizou o produto "${updates.name || prod.name}"`, prod.listId);
    }
  };

  const deleteProduct = (id: string) => {
    if (!auth.currentUser) return;
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    deleteDoc(doc(db, 'produtos', id)).catch(err => console.error("Error deleting product:", err));
    addLog('delete_product', `Removeu o produto "${prod.name}"`, prod.listId);
  };

  const toggleBought = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod || !auth.currentUser) return;

    const newIsBought = !prod.isBought;
    updateDoc(doc(db, 'produtos', id), {
      isBought: newIsBought,
      boughtAt: newIsBought ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }).catch(err => console.error("Error toggling bought:", err));

    addLog(
      'buy_product',
      `${prod.isBought ? 'Desmarcou' : 'Marcou'} como comprado o item "${prod.name}"`,
      prod.listId
    );
  };

  const toggleFavorite = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    updateDoc(doc(db, 'produtos', id), {
      isFavorite: !prod.isFavorite,
      updatedAt: new Date().toISOString()
    }).catch(err => console.error("Error toggling favorite:", err));
  };

  const addFavoriteToList = (productId: string, listId: string) => {
    const original = products.find((p) => p.id === productId);
    const targetList = lists.find((l) => l.id === listId);
    if (!original || !targetList || !auth.currentUser) return;

    const newId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newProduct = {
      ...original,
      id: newId,
      ownerId: auth.currentUser.uid,
      listId,
      isBought: false,
      boughtAt: null,
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, 'produtos', newId), newProduct).catch(err => console.error("Error cloning favorite:", err));
    addLog('add_product', `Adicionou o favorito "${original.name}" na lista "${targetList.name}"`, listId);
  };

  // Config actions
  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userDocRef, { settings: { ...config, ...updates } }).catch(err => console.warn("Error updating configs in Firestore:", err));
    }
  };

  const setView = (view: 'dashboard' | 'lists' | 'favorites' | 'history' | 'settings' | 'super_admin', listId: string | null = null) => {
    setCurrentView(view);
    setSelectedListId(listId);
  };

  // Manual Trigger Force Sync
  const triggerSync = async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSyncStatus('synced');
  };

  const exportData = () => {
    const data = {
      lists,
      products,
      config,
      user,
      logs,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!auth.currentUser) return false;
      
      const batch = writeBatch(db);

      if (data.lists && Array.isArray(data.lists)) {
        data.lists.forEach((l: any) => {
          const lRef = doc(db, 'listas', l.id || `list-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
          batch.set(lRef, {
            ...l,
            ownerId: auth.currentUser!.uid,
            updatedAt: new Date().toISOString()
          });
        });
      }
      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((p: any) => {
          const pRef = doc(db, 'produtos', p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
          batch.set(pRef, {
            ...p,
            ownerId: auth.currentUser!.uid,
            updatedAt: new Date().toISOString()
          });
        });
      }

      batch.commit().then(() => {
        addLog('create_list', 'Dados do aplicativo importados com sucesso pelo usuário');
      }).catch(err => console.error("Error committing imported data:", err));

      return true;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        lists,
        products,
        categories,
        config,
        user,
        logs,
        syncStatus,
        currentView,
        selectedListId,
        isEmailVerified,
        isLoadingAuth,
        login,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        loginWithApple,
        logout,
        deleteAccount,
        resetPassword,
        sendEmailVerificationLink,
        checkEmailVerificationStatus,
        addList,
        updateList,
        deleteList,
        restoreListState,
        addProduct,
        addMultipleProducts,
        updateProduct,
        deleteProduct,
        toggleBought,
        toggleFavorite,
        addFavoriteToList,
        updateConfig,
        setView,
        triggerSync,
        exportData,
        importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
