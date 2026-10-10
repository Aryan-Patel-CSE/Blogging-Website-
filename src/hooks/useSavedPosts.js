/**
 * useSavedPosts — Custom Hook for Personal Reading List / Bookmarks
 * ------------------------------------------------------------------
 * WHAT THIS DOES:
 * Provides any component with instant, reactive access to saved articles,
 * along with dispatch actions to bookmark, unbookmark, or clear all.
 * 
 * WHY CROSS-TAB SYNCHRONIZATION:
 * If a user opens InkSpace in two different browser tabs and saves a post
 * in Tab A, the `window.addEventListener('storage', ...)` listener fires
 * in Tab B, keeping both tabs perfectly synchronized without manual refresh!
 */
import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    toggleSavePost,
    removeSavedPost,
    clearAllSavedPosts,
    syncSavedPostsFromStorage,
} from '../store/savedPostsSlice';

export function useSavedPosts() {
    const dispatch = useDispatch();
    const savedPosts = useSelector((state) => state.savedPosts?.items || []);

    // Listen for storage events fired when other browser tabs modify localStorage
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'inkspace_saved_posts') {
                dispatch(syncSavedPostsFromStorage());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [dispatch]);

    const isSaved = useCallback(
        (postId) => {
            if (!postId) return false;
            return savedPosts.some((item) => item.$id === postId);
        },
        [savedPosts]
    );

    const toggleSave = useCallback(
        (post) => {
            if (!post) return;
            dispatch(toggleSavePost(post));
        },
        [dispatch]
    );

    const removeSaved = useCallback(
        (postId) => {
            if (!postId) return;
            dispatch(removeSavedPost(postId));
        },
        [dispatch]
    );

    const clearAll = useCallback(() => {
        dispatch(clearAllSavedPosts());
    }, [dispatch]);

    return {
        savedPosts,
        savedCount: savedPosts.length,
        isSaved,
        toggleSave,
        removeSaved,
        clearAll,
    };
}

export default useSavedPosts;
