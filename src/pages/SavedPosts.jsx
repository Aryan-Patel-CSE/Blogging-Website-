import { useState } from 'react';
import { Container, PostCard } from '../components';
import { useSavedPosts } from '../hooks/useSavedPosts';
import { Link } from 'react-router-dom';

function SavedPosts() {
    const { savedPosts, savedCount, clearAll } = useSavedPosts();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPosts = savedPosts.filter((post) =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClearAll = () => {
        if (savedCount === 0) return;
        const confirmed = window.confirm(
            'Are you sure you want to remove all saved stories from your reading list?'
        );
        if (confirmed) {
            clearAll();
        }
    };

    return (
        <div className="w-full py-8 md:py-12">
            <Container>
                {/* Header & Controls Bar */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 pb-6 border-b border-slate-200/50 dark:border-white/5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full neu-surface-sm text-[var(--accent-primary)]">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Reading List
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                &bull; {savedCount} {savedCount === 1 ? 'story' : 'stories'} saved
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Saved Stories
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                            Stories, perspectives, and ideas you&apos;ve bookmarked for reading or revisiting anytime.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {savedCount > 0 && (
                            <>
                                <div className="relative w-full sm:w-64">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search in saved..."
                                        className="neu-input w-full pl-10 pr-4 py-2 text-sm"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="neu-surface px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Clear all saved stories"
                                >
                                    Clear All
                                </button>
                            </>
                        )}

                        <Link
                            to="/all-posts"
                            className="neu-btn-primary px-4 py-2 text-sm whitespace-nowrap"
                        >
                            <span>Browse Stories</span>
                        </Link>
                    </div>
                </div>

                {/* Empty State: No stories saved yet */}
                {savedCount === 0 ? (
                    <div className="py-16 md:py-24 text-center max-w-lg mx-auto neu-card p-8 sm:p-12 space-y-5">
                        <div className="neu-surface-sm w-16 h-16 rounded-2xl text-[var(--accent-primary)] flex items-center justify-center mx-auto shadow-inner">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Your Reading List is Empty
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Whenever you find an insightful article or story you want to keep, tap the bookmark icon to save it here for offline contemplation.
                            </p>
                        </div>

                        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                to="/all-posts"
                                className="neu-btn-primary px-6 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
                            >
                                <span>Explore Published Stories</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    /* Search filter with 0 results */
                    <div className="py-16 text-center max-w-md mx-auto neu-card p-8 space-y-4">
                        <div className="neu-surface-sm w-12 h-12 rounded-xl text-slate-400 flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Matching Stories</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No saved stories matched &ldquo;{searchTerm}&rdquo;. Try another term or view all saved items.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="neu-surface px-4 py-2 text-xs font-bold text-[var(--accent-primary)] rounded-xl cursor-pointer hover:scale-105 transition-all"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    /* Grid of Saved Posts */
                    <div className="posts-grid-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredPosts.map((post) => (
                            <div key={post.$id} className="h-full">
                                <PostCard {...post} />
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}

export default SavedPosts;
