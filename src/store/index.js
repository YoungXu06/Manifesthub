import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithRedirect
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { notifyIndexRequired } from '../components/IndexNotification';

const mapAuthErrorCode = (errorCode) => {
  const errorMap = {
    'auth/user-not-found': 'No account found with this email. Please check or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/too-many-requests': 'Too many login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Multiple sign-in popups detected. Please try again.',
    'auth/popup-blocked': 'Popup blocked by browser. Please allow popups or use another sign-in method.'
  };

  return errorMap[errorCode] || 'Sign in failed. Please try again.';
};

const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      authChecked: false,
      authError: null,
      authLoading: false,
      
      // Goals State
      goals: [],
      goalCategories: ['career', 'finance', 'health', 'relationships', 'personal', 'other'],
      currentGoal: null,
      
      // Vision Board State
      visionBoard: [],
      
      // Calendar Activities State
      checkIns: [],
      gratitudeEntries: [],
      streakCount: 0,
      lastCheckIn: null,
      
      // UI State
      isLoading: false,
      darkMode: false,
      language: 'en',
      
      // Global Notification State
      notifications: [],
      
      // Notification Actions
      addNotification: (message, type = 'error', duration = 5000) => {
        const id = Date.now() + Math.random();
        const notification = {
          id,
          message,
          type, // 'success', 'error', 'warning', 'info'
          duration,
          timestamp: new Date().toISOString()
        };
        
        set(state => ({
          notifications: [...state.notifications, notification]
        }));
        
        return id;
      },
      
      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearAllNotifications: () => {
        set({ notifications: [] });
      },
      
      // Convenience notification methods
      showSuccess: (message, duration = 3000) => {
        return get().addNotification(message, 'success', duration);
      },
      
      showError: (message, duration = 5000) => {
        return get().addNotification(message, 'error', duration);
      },
      
      showWarning: (message, duration = 4000) => {
        return get().addNotification(message, 'warning', duration);
      },
      
      showInfo: (message, duration = 3000) => {
        return get().addNotification(message, 'info', duration);
      },
      
      // Auth Actions
      checkAuth: async () => {
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data() || {};
                
                set({ 
                  user: { 
                    uid: user.uid, 
                    email: user.email, 
                    displayName: user.displayName || userData?.displayName || 'User',
                    photoURL: user.photoURL || userData?.photoURL,
                    ...userData
                  }, 
                  authChecked: true,
                  authError: null
                });
              } catch (error) {
                console.error('Error fetching user data:', error);
                get().showError('Failed to load user profile. Some features may not work properly.');
                set({ 
                  user: { 
                    uid: user.uid, 
                    email: user.email, 
                    displayName: user.displayName || 'User',
                    photoURL: user.photoURL
                  }, 
                  authChecked: true,
                  authError: 'Failed to load user profile. Some features may not work properly.'
                });
              }
            } else {
              set({ user: null, authChecked: true, authError: null });
            }
            resolve();
            unsubscribe(); // clean up listener
          });
        });
      },
      
      register: async (email, password, displayName) => {
        set({ authLoading: true, authError: null });
        try {
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          
          // Create user profile in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            displayName,
            email,
            createdAt: new Date().toISOString(),
            preferences: {
              theme: get().darkMode ? 'dark' : 'light',
              language: get().language || 'en',
              notifications: true
            }
          });
          
          set({ 
            user: { 
              uid: user.uid, 
              email, 
              displayName,
              preferences: {
                theme: get().darkMode ? 'dark' : 'light',
                language: get().language || 'en',
                notifications: true
              }
            }, 
            authLoading: false,
            authError: null
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = mapAuthErrorCode(error.code) || error.message;
          set({ authError: errorMessage, authLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          const { user } = await signInWithEmailAndPassword(auth, email, password);
          
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() || {};
            
            set({ 
              user: { 
                uid: user.uid, 
                email: user.email,
                displayName: user.displayName || userData?.displayName || 'User',
                photoURL: user.photoURL || userData?.photoURL,
                ...userData
              }, 
              authLoading: false,
              authError: null
            });
          } catch (firestoreError) {
            console.error('Firestore operation error:', firestoreError);
            get().showWarning('Profile data could not be saved completely, but login was successful.');
            // Allow sign-in even if Firestore fails, but with limited profile
            set({ 
              user: { 
                uid: user.uid, 
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL
              }, 
              authLoading: false,
              authError: 'Signed in successfully but profile data could not be saved'
            });
          }
          
          return { success: true };
        } catch (error) {
          const errorMessage = mapAuthErrorCode(error.code) || error.message;
          set({ authError: errorMessage, authLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      loginWithGoogle: async () => {
        set({ authLoading: true, authError: null });
        try {
          const provider = new GoogleAuthProvider();
          // Fall back to redirect sign-in
          try {
            const { user } = await signInWithPopup(auth, provider);
            
            try {
              // Check if user already exists
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              
              if (!userDoc.exists()) {
                // Create new user profile
                await setDoc(doc(db, 'users', user.uid), {
                  displayName: user.displayName || 'User',
                  email: user.email,
                  photoURL: user.photoURL || null,
                  createdAt: new Date().toISOString(),
                  preferences: {
                    theme: get().darkMode ? 'dark' : 'light',
                    language: get().language || 'en',
                    notifications: true
                  }
                });
              }
              
              const userData = userDoc.exists() ? userDoc.data() : {};
              
              set({ 
                user: { 
                  uid: user.uid, 
                  email: user.email,
                  displayName: user.displayName || userData?.displayName || 'User',
                  photoURL: user.photoURL || userData?.photoURL,
                  ...userData
                }, 
                authLoading: false,
                authError: null
              });
            } catch (firestoreError) {
              console.error('Firestore operation error:', firestoreError);
              get().showWarning('Profile data could not be saved completely, but login was successful.');
              // Allow sign-in even if Firestore fails, but with limited profile
              set({ 
                user: { 
                  uid: user.uid, 
                  email: user.email,
                  displayName: user.displayName || 'User',
                  photoURL: user.photoURL
                }, 
                authLoading: false,
                authError: 'Signed in successfully but profile data could not be saved'
              });
            }
            
            return { success: true };
          } catch (popupError) {
            // Try redirect if popup fails
            if (popupError.code === 'auth/popup-closed-by-user' || 
                popupError.code === 'auth/popup-blocked' ||
                popupError.message.includes('Cross-Origin-Opener-Policy')) {
              try {
                await signInWithRedirect(auth, provider);
                return { success: true };
              } catch (redirectError) {
                const errorMessage = mapAuthErrorCode(redirectError.code) || redirectError.message;
                set({ authError: errorMessage, authLoading: false });
                return { success: false, error: errorMessage };
              }
            }
            throw popupError;
          }
        } catch (error) {
          console.error('Google sign-in error:', error);
          get().showError('Google login failed. Please try again or use email login.');
          const errorMessage = mapAuthErrorCode(error.code) || error.message;
          set({ authError: errorMessage, authLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      resetPassword: async (email) => {
        set({ authLoading: true, authError: null });
        try {
          await sendPasswordResetEmail(auth, email);
          set({ authLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = mapAuthErrorCode(error.code) || error.message;
          set({ authError: errorMessage, authLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      logout: async () => {
        set({ authLoading: true });
        try {
          await signOut(auth);
          set({ user: null, authLoading: false, authError: null });
          return { success: true };
        } catch (error) {
          const errorMessage = mapAuthErrorCode(error.code) || error.message;
          set({ authError: errorMessage, authLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      clearAuthError: () => {
        set({ authError: null });
      },
      
      // Goals Actions
      fetchGoals: async (forceRefresh = false) => {
        const { user } = get();
        if (!user) return;
        
        // Skip reload if data exists and not forced
        const currentGoals = get().goals;
        if (currentGoals.length > 0 && !forceRefresh) {
          return; // data already loaded, skip
        }
        
        set({ isLoading: true });
        try {
          const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          const goals = [];
          querySnapshot.forEach((doc) => {
            goals.push({ id: doc.id, ...doc.data() });
          });
          
          set({ goals, isLoading: false });
        } catch (error) {
          console.error('Error fetching goals:', error);
          get().showError('Failed to load goals. Please refresh the page.');
          set({ isLoading: false });
        }
      },
      
      addGoal: async (goalData) => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not authenticated' };
        
        set({ isLoading: true });
        try {
          const newGoal = {
            ...goalData,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            progress: 0,
            completed: false,
            priority: goalData.priority !== undefined && goalData.priority !== null ? Number(goalData.priority) : goalData.priority
          };
          
          const docRef = await addDoc(collection(db, 'goals'), newGoal);
          
          const goals = [...get().goals, { id: docRef.id, ...newGoal }];
          set({ goals, isLoading: false });
          
          return { success: true, goalId: docRef.id };
        } catch (error) {
          console.error('Error adding goal:', error);
          get().showError('Failed to create goal. Please try again.');
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      updateGoal: async (goalId, updates) => {
        set({ isLoading: true });
        try {
          // Ensure priority is a number if provided
          if (updates.priority !== undefined && updates.priority !== null) {
            updates.priority = Number(updates.priority);
          }
          await updateDoc(doc(db, 'goals', goalId), updates);
          
          const updatedGoals = get().goals.map(goal => 
            goal.id === goalId ? { ...goal, ...updates } : goal
          );
          
          set({ goals: updatedGoals, isLoading: false });
          return { success: true };
        } catch (error) {
          console.error('Error updating goal:', error);
          get().showError('Failed to update goal. Please try again.');
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      deleteGoal: async (goalId) => {
        set({ isLoading: true });
        try {
          await deleteDoc(doc(db, 'goals', goalId));
          
          const filteredGoals = get().goals.filter(goal => goal.id !== goalId);
          set({ goals: filteredGoals, isLoading: false });
          
          return { success: true };
        } catch (error) {
          console.error('Error deleting goal:', error);
          get().showError('Failed to delete goal. Please try again.');
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      // Image Upload Utilities
      uploadImage: async (file, path = 'vision-images') => {
        try {
          // Check file size (2MB limit for base64 storage)
          const maxSize = 2 * 1024 * 1024; // 2MB in bytes
          if (file.size > maxSize) {
            throw new Error('Image size must be less than 2MB for optimal performance');
          }
          
          // Check file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
          }
          
          // Compress and convert image to base64
          const compressedBase64 = await new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
              // Calculate new dimensions (max 800px width/height)
              const maxDimension = 800;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxDimension) {
                  height = (height * maxDimension) / width;
                  width = maxDimension;
                }
              } else {
                if (height > maxDimension) {
                  width = (width * maxDimension) / height;
                  height = maxDimension;
                }
              }
              
              // Set canvas dimensions
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress image
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to base64 with compression
              const quality = file.size > 500 * 1024 ? 0.7 : 0.85; // Lower quality for larger files
              const base64 = canvas.toDataURL('image/jpeg', quality);
              
              resolve(base64);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
          });
          
          // Generate unique identifier for the image
          const { user } = get();
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const imageId = `${user?.uid || 'anonymous'}_${timestamp}_${randomString}`;
          
          return { 
            success: true, 
            base64Data: compressedBase64,
            imageId: imageId,
            originalName: file.name,
            size: file.size,
            type: file.type,
            // For backward compatibility, also provide url field
            url: compressedBase64
          };
        } catch (error) {
          console.error('Error processing image:', error);
          get().showError(`Image upload failed: ${error.message}`);
          return { 
            success: false, 
            error: error.message 
          };
        }
      },
      
      deleteImage: async (imageId) => {
        try {
          // Since images are now stored as base64 in documents,
          // deletion is handled when the document is updated/deleted
          // This method is kept for backward compatibility
          return { success: true };
        } catch (error) {
          console.error('Error in deleteImage:', error);
          get().showWarning('Image cleanup encountered an issue, but operation continued.');
          return { 
            success: false, 
            error: error.message 
          };
        }
      },
      
      // Vision Board Actions
      fetchVisionBoard: async (forceRefresh = false) => {
        const { user } = get();
        if (!user) return;
        
        // Skip reload if data exists and not forced
        const currentVisionBoard = get().visionBoard;
        if (currentVisionBoard.length > 0 && !forceRefresh) {
          return; // data already loaded, skip
        }
        
        set({ isLoading: true });
        try {
          const q = query(collection(db, 'visionBoard'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          const visionBoard = [];
          querySnapshot.forEach((doc) => {
            visionBoard.push({ id: doc.id, ...doc.data() });
          });
          
          set({ visionBoard, isLoading: false });
        } catch (error) {
          console.error('Error fetching vision board:', error);
          get().showError('Failed to load vision board. Please refresh the page.');
          set({ isLoading: false });
        }
      },
      
      addVisionBoardItem: async (item) => {
        set({ isLoading: true });
        try {
          // Sanitize data
          const sanitizedItem = { ...item };
          // No longer adding uuid field
          if (!sanitizedItem.createdAt) {
            sanitizedItem.createdAt = new Date().toISOString();
          }
          sanitizedItem.updatedAt = new Date().toISOString();
          // Add current user ID
          const { user } = get();
          if (!sanitizedItem.userId && user) {
            sanitizedItem.userId = user.uid;
          }
          if (!sanitizedItem.title) {
            throw new Error('Title is required');
          }
          // Format due date if exists
          if (sanitizedItem.dueDate) {
            try {
              const dateObj = new Date(sanitizedItem.dueDate);
              if (!isNaN(dateObj.getTime())) {
                sanitizedItem.dueDate = dateObj.toISOString();
              } else {
                sanitizedItem.dueDate = null;
              }
            } catch (e) {
              sanitizedItem.dueDate = null;
            }
          }
          sanitizedItem.progress = Number(sanitizedItem.progress || 0);
          sanitizedItem.completed = Boolean(sanitizedItem.completed || false);
          // Convert priority to number if exists
          if (sanitizedItem.priority !== undefined && sanitizedItem.priority !== null) {
            sanitizedItem.priority = Number(sanitizedItem.priority);
          }
          // Let Firebase generate document ID
          const docRef = await addDoc(collection(db, 'visionBoard'), sanitizedItem);
          const newItem = {
            ...sanitizedItem,
            id: docRef.id
          };
          set({ 
            visionBoard: [newItem, ...get().visionBoard],
            isLoading: false 
          });
          return { success: true, id: docRef.id };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      updateVisionBoardItem: async (itemId, updates) => {
        set({ isLoading: true });
        try {
          if (!itemId) {
            set({ isLoading: false });
            return { success: false, error: 'Invalid item ID' };
          }
          // Look up by id only
          let existingItem = get().visionBoard.find(item => item.id === itemId);
          if (!existingItem) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: `Item with ID ${itemId} not found in local state, cannot update in Firebase` 
            };
          }
          const docId = existingItem.id;
          // Sanitize data
          const sanitizedUpdates = {};
          Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
              if (key === 'dueDate') {
                if (updates[key] === '' || updates[key] === null) {
                  sanitizedUpdates[key] = null;
                } else if (typeof updates[key] === 'string') {
                  try {
                    const dateObj = new Date(updates[key]);
                    if (!isNaN(dateObj.getTime())) {
                      sanitizedUpdates[key] = dateObj.toISOString();
                    } else {
                      sanitizedUpdates[key] = null;
                    }
                  } catch (e) {
                    sanitizedUpdates[key] = null;
                  }
                }
              } else if (key === 'progress' && updates[key] !== null) {
                sanitizedUpdates[key] = Number(updates[key]);
              } else if (key === 'priority' && updates[key] !== null && updates[key] !== undefined) {
                sanitizedUpdates[key] = Number(updates[key]);
              } else if (key === 'completed') {
                sanitizedUpdates[key] = Boolean(updates[key]);
              } else if (key === 'steps' && Array.isArray(updates[key])) {
                sanitizedUpdates[key] = updates[key].map(step => ({
                  text: String(step.text || ''),
                  completed: Boolean(step.completed)
                }));
              } else {
                sanitizedUpdates[key] = updates[key];
              }
            }
          });
          sanitizedUpdates.updatedAt = new Date().toISOString();
          if (!docId) {
            throw new Error(`Cannot update: no valid document ID found. Item id=${existingItem.id}`);
          }
          try {
            await updateDoc(doc(db, 'visionBoard', docId), sanitizedUpdates);
            const updatedVisionBoard = get().visionBoard.map(item => 
              item.id === docId ? { ...item, ...sanitizedUpdates } : item
            );
            set({ visionBoard: updatedVisionBoard, isLoading: false });
            return { success: true };
          } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      deleteVisionBoardItem: async (itemId) => {
        set({ isLoading: true });
        try {
          let itemToDelete = get().visionBoard.find(item => item.id === itemId);
          if (!itemToDelete) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: `Item with ID ${itemId} not found in local state, cannot delete from Firebase` 
            };
          }
          
          // Since images are now stored as base64 in the document,
          // no separate image deletion is needed
          
          const docId = itemToDelete.id;
          await deleteDoc(doc(db, 'visionBoard', docId));
          const filteredVisionBoard = get().visionBoard.filter(item => item.id !== docId);
          set({ visionBoard: filteredVisionBoard, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      // Calendar Activity Actions
      fetchCalendarActivities: async (startDate, endDate) => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoading: true });
        try {
          // Convert date strings to Timestamp objects if needed
          let startTimestamp = startDate;
          let endTimestamp = endDate;
          
          if (typeof startDate === 'string') {
            startTimestamp = Timestamp.fromDate(new Date(startDate));
          } else if (startDate instanceof Date) {
            startTimestamp = Timestamp.fromDate(startDate);
          }
          
          if (typeof endDate === 'string') {
            endTimestamp = Timestamp.fromDate(new Date(endDate));
          } else if (endDate instanceof Date) {
            endTimestamp = Timestamp.fromDate(endDate);
          }
          
          // Check activity data
          let checkIns = [];
          let gratitudeEntries = [];
          
          try {
            // First try fetching check-in data
            const checkInsQuery = query(
              collection(db, 'checkIns'),
              where('userId', '==', user.uid),
              where('date', '>=', startTimestamp),
              where('date', '<=', endTimestamp),
              orderBy('date', 'desc')
            );
            
            const checkInsSnapshot = await getDocs(checkInsQuery);
            checkInsSnapshot.forEach(doc => {
              const data = doc.data();
              checkIns.push({
                id: doc.id,
                ...data,
                date: data.date ? data.date.toDate().toISOString() : null
              });
            });
          } catch (error) {
            // Catch index errors and show helpful hint
            if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
              console.warn('A composite index is required for checkIns. Create it at:');
              const indexMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/);
              if (indexMatch) {
                console.warn('Create index at: ' + indexMatch[0]);
                // Show index creation prompt via notification system
                notifyIndexRequired('checkIns', indexMatch[0]);
              }
              get().showWarning('Database index setup required. Check-in data may not load completely.');
            } else {
              console.error('Error fetching check-in data:', error);
              get().showError('Failed to load check-in data. Please try again.');
            }
            // Continue execution even on index error
          }
          
          try {
            // Then try fetching gratitude entries
            const gratitudeQuery = query(
              collection(db, 'gratitudeEntries'),
              where('userId', '==', user.uid),
              where('date', '>=', startTimestamp),
              where('date', '<=', endTimestamp),
              orderBy('date', 'desc')
            );
            
            const gratitudeSnapshot = await getDocs(gratitudeQuery);
            gratitudeSnapshot.forEach(doc => {
              const data = doc.data();
              gratitudeEntries.push({
                id: doc.id,
                ...data,
                date: data.date ? data.date.toDate().toISOString() : null
              });
            });
          } catch (error) {
            // Catch index errors and show helpful hint
            if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
              console.warn('A composite index is required for gratitudeEntries. Create it at:');
              const indexMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/);
              if (indexMatch) {
                console.warn('Create index at: ' + indexMatch[0]);
                // Show index creation prompt via notification system
                notifyIndexRequired('gratitudeEntries', indexMatch[0]);
              }
              get().showWarning('Database index setup required. Gratitude data may not load completely.');
            } else {
              console.error('Error fetching gratitude entries:', error);
              get().showError('Failed to load gratitude entries. Please try again.');
            }
            // Continue execution even on index error
          }
          
          // Update streak information
          await get().updateStreakInfo();
          
          set({ 
            checkIns, 
            gratitudeEntries, 
            isLoading: false 
          });
          
          return { checkIns, gratitudeEntries };
        } catch (error) {
          console.error('Error fetching calendar activity data:', error);
          get().showError('Failed to load calendar activities. Please refresh the page.');
          set({ isLoading: false });
          return { error: error.message };
        }
      },
      
      // Update user's streak information
      updateStreakInfo: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          // Get the user's latest check-in
          const latestCheckInQuery = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(1)
          );
          
          const latestCheckInSnapshot = await getDocs(latestCheckInQuery);
          let lastCheckIn = null;
          let checkInDate = null;
          
          if (!latestCheckInSnapshot.empty) {
            const latestCheckInDoc = latestCheckInSnapshot.docs[0];
            const data = latestCheckInDoc.data();
            lastCheckIn = latestCheckInDoc.id;
            checkInDate = data.date ? data.date.toDate() : null;
          }
          
          // Fetch streak count from user document
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data() || {};
          let streakCount = userData.streakCount || 0;
          let lastStreak = userData.lastStreak ? userData.lastStreak.toDate() : null;
          
          // Update state
          set({ 
            lastCheckIn: checkInDate ? checkInDate.toISOString() : null,
            streakCount
          });
          
          return { lastCheckIn, streakCount };
        } catch (error) {
          console.error('Error updating streak info:', error);
          get().showWarning('Failed to update streak information. Your progress is still saved.');
          return { error: error.message };
        }
      },
      
      // Add a check-in for today
      addCheckIn: async () => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not authenticated' };
        
        // Removed global loading; components manage their own state
        try {
          // Create a date object for today at 00:00:00 local time
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Check if user already checked in today
          const todayCheckInQuery = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            where('date', '==', Timestamp.fromDate(today))
          );
          
          const existingCheckIns = await getDocs(todayCheckInQuery);
          if (!existingCheckIns.empty) {
            return { success: false, error: 'Already checked in today' };
          }
          
          // Add new check-in
          const checkInData = {
            userId: user.uid,
            date: Timestamp.fromDate(today),
            createdAt: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db, 'checkIns'), checkInData);
          
          // Get yesterday's date
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // Check if user checked in yesterday to maintain streak
          const yesterdayCheckInQuery = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            where('date', '==', Timestamp.fromDate(yesterday))
          );
          
          const yesterdayCheckIns = await getDocs(yesterdayCheckInQuery);
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() || {};
          
          let newStreakCount = 1; // Default to 1 if streak is broken or first check-in
          
          if (!yesterdayCheckIns.empty || 
              (userData.lastStreak && userData.lastStreak.toDate().getTime() === yesterday.getTime())) {
            // Maintain streak
            newStreakCount = (userData.streakCount || 0) + 1;
          }
          
          // Update user's streak information
          await updateDoc(userDocRef, {
            streakCount: newStreakCount,
            lastStreak: Timestamp.fromDate(today)
          });
          
          // Update local state (only update what is needed)
          const newCheckIn = {
            id: docRef.id,
            ...checkInData,
            date: today.toISOString()
          };
          
          set({ 
            checkIns: [newCheckIn, ...get().checkIns],
            streakCount: newStreakCount,
            lastCheckIn: today.toISOString()
          });
          
          // No longer force-refreshing calendar; handled by optimistic updates
          
          return { success: true, checkIn: newCheckIn, streakCount: newStreakCount };
        } catch (error) {
          console.error('Error adding check-in:', error);
          get().showError('Failed to record check-in. Please try again.');
          return { success: false, error: error.message };
        }
      },
      
      // Add a gratitude entry
      addGratitudeEntry: async (content, targetDate = null) => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not authenticated' };
        if (!content.trim()) return { success: false, error: 'Content cannot be empty' };
        
        // Removed global loading; components manage their own state
        try {
          // Create a date object at 00:00:00 local time
          // Use provided targetDate or default to today
          const entryDate = targetDate ? new Date(targetDate) : new Date();
          entryDate.setHours(0, 0, 0, 0);
          
          // Check if there's an existing entry for this date
          const dateEntryQuery = query(
            collection(db, 'gratitudeEntries'),
            where('userId', '==', user.uid),
            where('date', '==', Timestamp.fromDate(entryDate))
          );
          
          const existingEntries = await getDocs(dateEntryQuery);
          let docRef;
          let isUpdate = false;
          
          if (!existingEntries.empty) {
            // Update existing entry
            const existingDoc = existingEntries.docs[0];
            await updateDoc(doc(db, 'gratitudeEntries', existingDoc.id), {
              content,
              updatedAt: serverTimestamp()
            });
            docRef = { id: existingDoc.id };
            isUpdate = true;
          } else {
            // Create new entry
            const entryData = {
              userId: user.uid,
              content,
              date: Timestamp.fromDate(entryDate),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            docRef = await addDoc(collection(db, 'gratitudeEntries'), entryData);
          }
          
          // Optimised: reduce unnecessary data fetching
          // No longer auto-refreshing recent gratitude/calendar; handled at component level
          
          return { 
            success: true, 
            entryId: docRef.id, 
            isUpdate,
            date: entryDate.toISOString() 
          };
        } catch (error) {
          console.error('Error adding gratitude entry:', error);
          get().showError('Failed to save gratitude entry. Please try again.');
          return { success: false, error: error.message };
        }
      },
      
      // Fetch recent gratitude entries (default: last 7 days)
      fetchRecentGratitude: async (days = 7) => {
        const { user } = get();
        if (!user) return { entries: [] };
        
        set({ isLoading: true });
        try {
          const endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - (days - 1));
          startDate.setHours(0, 0, 0, 0);
          
          const gratitudeQuery = query(
            collection(db, 'gratitudeEntries'),
            where('userId', '==', user.uid),
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(endDate)),
            orderBy('date', 'desc')
          );
          
          const gratitudeSnapshot = await getDocs(gratitudeQuery);
          const entries = [];
          
          gratitudeSnapshot.forEach(doc => {
            const data = doc.data();
            entries.push({
              id: doc.id,
              ...data,
              date: data.date ? data.date.toDate().toISOString() : null,
              formattedDate: data.date ? data.date.toDate().toLocaleDateString() : ''
            });
          });
          
          set({ 
            gratitudeEntries: entries,
            isLoading: false 
          });
          
          return { entries };
        } catch (error) {
          console.error('Error fetching recent gratitude entries:', error);
          get().showError('Failed to load recent gratitude entries. Please refresh the page.');
          set({ isLoading: false });
          return { entries: [], error: error.message };
        }
      },
      
      // Get all calendar data for a specific month
      fetchMonthCalendarData: async (year, month) => {
        const { user } = get();
        if (!user) return { data: {} };
        
        set({ isLoading: true });
        try {
          // Calculate start and end dates for the month
          const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0); // Month is 0-indexed in JS
          const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
          
          // Fetch check-ins and gratitude entries for the month
          const result = await get().fetchCalendarActivities(startDate, endDate);
          
          // Organize data by date for easy lookup
          const calendarData = {};
          
          if (result.checkIns) {
            result.checkIns.forEach(checkIn => {
              // Fix: Use a timezone-aware approach for date strings
              const checkInDate = new Date(checkIn.date);
              const dateStr = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;
              
              if (!calendarData[dateStr]) {
                calendarData[dateStr] = {};
              }
              calendarData[dateStr].checkIn = true;
            });
          }
          
          if (result.gratitudeEntries) {
            result.gratitudeEntries.forEach(entry => {
              // Fix: Use a timezone-aware approach for date strings
              const entryDate = new Date(entry.date);
              const dateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
              
              if (!calendarData[dateStr]) {
                calendarData[dateStr] = {};
              }
              calendarData[dateStr].gratitude = entry.content;
            });
          }
          
          set({ isLoading: false });
          return { data: calendarData };
        } catch (error) {
          console.error('Error fetching month calendar data:', error);
          get().showError('Failed to load calendar data for this month. Please try again.');
          set({ isLoading: false });
          return { data: {}, error: error.message };
        }
      },
      
      // UI Actions
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        document.documentElement.classList.toggle('dark', newDarkMode);
        set({ darkMode: newDarkMode });
      },
      
      setLanguage: (language) => {
        localStorage.setItem('language', language);
        set({ language });
      },
      
      // Profile Actions
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { success: false, error: 'User not authenticated' };
        
        set({ isLoading: true });
        try {
          await updateDoc(doc(db, 'users', user.uid), updates);
          
          set({ 
            user: { ...user, ...updates }, 
            isLoading: false 
          });
          
          return { success: true };
        } catch (error) {
          console.error('Error updating profile:', error);
          get().showError('Failed to update profile. Please try again.');
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },
      
      // Fetch gratitude entry for a specific date
      fetchGratitudeForDate: async (date) => {
        const { user } = get();
        if (!user) return { entry: null };
        
        set({ isLoading: true });
        try {
          // Create a date object at 00:00:00 local time for the specified date
          const targetDate = new Date(date);
          targetDate.setHours(0, 0, 0, 0);
          
          // Query for gratitude entry on the specified date
          const gratitudeQuery = query(
            collection(db, 'gratitudeEntries'),
            where('userId', '==', user.uid),
            where('date', '==', Timestamp.fromDate(targetDate))
          );
          
          const snapshot = await getDocs(gratitudeQuery);
          
          if (snapshot.empty) {
            set({ isLoading: false });
            return { entry: null };
          }
          
          // Get the first entry (there should be only one per day)
          const doc = snapshot.docs[0];
          const data = doc.data();
          
          const entry = {
            id: doc.id,
            ...data,
            date: data.date ? data.date.toDate().toISOString() : null,
            formattedDate: data.date ? data.date.toDate().toLocaleDateString() : '',
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
          };
          
          set({ isLoading: false });
          return { entry };
        } catch (error) {
          console.error('Error fetching gratitude for date:', error);
          get().showError('Failed to load gratitude entry for the selected date.');
          set({ isLoading: false });
          return { entry: null, error: error.message };
        }
      },

      // ── Daily Log (unified per-day record) ───────────────────────────────
      // Document ID: `${userId}_${YYYY-MM-DD}`
      // Fields: mood, intention, gratitude, checkIn (bool), updatedAt

      _dailyLogId: (uid, dateStr) => `${uid}_${dateStr}`,

      fetchDailyLog: async (date) => {
        const { user } = get();
        if (!user) return { log: null };
        const dateStr = (() => {
          const d = new Date(date);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();
        try {
          const docSnap = await getDoc(doc(db, 'dailyLogs', `${user.uid}_${dateStr}`));
          if (!docSnap.exists()) return { log: null, dateStr };
          const data = docSnap.data();
          return {
            log: {
              ...data,
              updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
            },
            dateStr,
          };
        } catch (error) {
          console.error('Error fetching daily log:', error);
          return { log: null, dateStr };
        }
      },

      saveDailyLog: async (date, fields) => {
        // fields: { mood?, intention?, gratitude?, checkIn? }
        const { user } = get();
        if (!user) return { success: false, error: 'Not authenticated' };
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const docId = `${user.uid}_${dateStr}`;
        try {
          const ref = doc(db, 'dailyLogs', docId);
          const existing = await getDoc(ref);
          const payload = {
            userId: user.uid,
            date: Timestamp.fromDate(d),
            dateStr,
            ...fields,
            updatedAt: serverTimestamp(),
          };
          if (existing.exists()) {
            await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
          } else {
            await setDoc(ref, payload);
          }

          // ── Keep legacy collections in sync ──────────────────────────────
          // gratitude
          if (fields.gratitude !== undefined) {
            const gQuery = query(
              collection(db, 'gratitudeEntries'),
              where('userId', '==', user.uid),
              where('date', '==', Timestamp.fromDate(d))
            );
            const gSnap = await getDocs(gQuery);
            if (!gSnap.empty) {
              await updateDoc(doc(db, 'gratitudeEntries', gSnap.docs[0].id), {
                content: fields.gratitude,
                updatedAt: serverTimestamp(),
              });
            } else {
              await addDoc(collection(db, 'gratitudeEntries'), {
                userId: user.uid,
                content: fields.gratitude,
                date: Timestamp.fromDate(d),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
          // checkIn
          if (fields.checkIn === true) {
            const ciQuery = query(
              collection(db, 'checkIns'),
              where('userId', '==', user.uid),
              where('date', '==', Timestamp.fromDate(d))
            );
            const ciSnap = await getDocs(ciQuery);
            if (ciSnap.empty) {
              await addDoc(collection(db, 'checkIns'), {
                userId: user.uid,
                date: Timestamp.fromDate(d),
                createdAt: serverTimestamp(),
              });
              // Update streak
              const yesterday = new Date(d);
              yesterday.setDate(yesterday.getDate() - 1);
              const yQuery = query(
                collection(db, 'checkIns'),
                where('userId', '==', user.uid),
                where('date', '==', Timestamp.fromDate(yesterday))
              );
              const ySnap = await getDocs(yQuery);
              const userDocRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              const userData = userDoc.data() || {};
              const newStreak = (!ySnap.empty) ? (userData.streakCount || 0) + 1 : 1;
              await updateDoc(userDocRef, {
                streakCount: newStreak,
                lastStreak: Timestamp.fromDate(d),
              });
              set({ streakCount: newStreak, lastCheckIn: d.toISOString() });
            }
          }

          return { success: true, dateStr };
        } catch (error) {
          console.error('Error saving daily log:', error);
          return { success: false, error: error.message };
        }
      },

      fetchMonthDailyLogs: async (year, month) => {
        const { user } = get();
        if (!user) return { logs: {} };
        try {
          const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
          const endDate   = new Date(year, month, 0, 23, 59, 59, 999);
          const q = query(
            collection(db, 'dailyLogs'),
            where('userId', '==', user.uid),
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(endDate))
          );
          const snap = await getDocs(q);
          const logs = {};
          snap.forEach(d => {
            const data = d.data();
            logs[data.dateStr] = {
              mood: data.mood || null,
              intention: data.intention || null,
              gratitude: data.gratitude || null,
              checkIn: data.checkIn || false,
            };
          });
          return { logs };
        } catch (error) {
          console.error('Error fetching month daily logs:', error);
          return { logs: {} };
        }
      },
    }),
    {
      name: 'manifest-hub-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language
      })
    }
  )
);

export default useStore;
