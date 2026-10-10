/**
 * savedPostsSlice — Global Redux Slice for Saved Posts & Reading List
 * --------------------------------------------------------------------
 * ARCHITECTURAL DESIGN & WHY THIS WORKS:
 * 1. Offline & Session Persistence:
 *    Articles bookmarked by the user are saved immediately to `localStorage`
 *    under `inkspace_saved_posts`. This means users retain their reading list
 *    even if they refresh or close the browser tab.
 * 2. Lean Snapshot Schema:
 *    Instead of cloning large 50KB rich HTML articles into local storage,
 *    we store a clean, lightweight metadata snapshot ($id, title, featuredImage,
 *    author, savedAt timestamp). This keeps localStorage lightning fast.
 * 3. Immer Immutability:
 *    Redux Toolkit uses Immer internally, allowing direct mutations (`state.items.splice`,
 *    `state.items.unshift`) while keeping state updates purely immutable under the hood.
 */
import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'inkspace_saved_posts';

// Safely hydrate saved posts from localStorage on initial page load
const loadSavedFromStorage = () => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to parse saved posts from localStorage', e);
        return [];
    }
};

// Mirror changes to localStorage for persistent durability
const saveToStorage = (posts) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
        console.warn('Failed to persist saved posts to localStorage', e);
    }
};

const initialState = {
    items: loadSavedFromStorage(),
};

const savedPostsSlice = createSlice({
    name: 'savedPosts',
    initialState,
    reducers: {
        toggleSavePost: (state, action) => {
            const post = action.payload;
            if (!post || !post.$id) return;

            const existingIndex = state.items.findIndex((item) => item.$id === post.$id);
            if (existingIndex >= 0) {
                // Remove from saved
                state.items.splice(existingIndex, 1);
            } else {
                // Add to saved (store essential card properties & timestamp)
                const simplified = {
                    $id: post.$id,
                    title: post.title || 'Untitled Story',
                    featuredImage: post.featuredImage || post.featuredimage || null,
                    featuredimage: post.featuredimage || post.featuredImage || null,
                    status: post.status || 'active',
                    author: post.author || post.authorName || post.authorname || 'InkSpace author',
                    authorName: post.authorName || post.authorname || post.author || 'InkSpace author',
                    savedAt: new Date().toISOString(),
                };
                state.items.unshift(simplified);
            }
            saveToStorage(state.items);
        },
        removeSavedPost: (state, action) => {
            const postId = action.payload;
            if (!postId) return;
            state.items = state.items.filter((item) => item.$id !== postId);
            saveToStorage(state.items);
        },
        clearAllSavedPosts: (state) => {
            state.items = [];
            saveToStorage(state.items);
        },
        syncSavedPostsFromStorage: (state) => {
            state.items = loadSavedFromStorage();
        },
    },
});

export const {
    toggleSavePost,
    removeSavedPost,
    clearAllSavedPosts,
    syncSavedPostsFromStorage,
} = savedPostsSlice.actions;

export default savedPostsSlice.reducer;
