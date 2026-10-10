import { useState, useEffect } from 'react';
import { Container, PostCard, NeuLoader } from '../components';
import appwriteService from "../appwrite/conf";
import { Link } from 'react-router-dom';

function AllPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let isMounted = true;
        appwriteService.getPosts([])
            .then((res) => {
                if (isMounted && res?.documents) {
                    setPosts(res.documents);
                }
            })
            .catch((err) => {
                console.error("AllPosts :: getPosts :: error", err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredPosts = posts.filter((post) =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full py-8">
            <Container>
                {/* Header & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-white/5">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            All Stories
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Browse through our full archive of published stories ({posts.length})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
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
                                placeholder="Search stories..."
                                className="neu-input w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>

                        <Link
                            to="/add-post"
                            className="neu-btn-primary px-4 py-2 text-sm whitespace-nowrap"
                        >
                            <span>+ New Story</span>
                        </Link>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center">
                        <NeuLoader text="Fetching published stories..." size="lg" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="py-16 text-center max-w-md mx-auto neu-card p-8 sm:p-10 space-y-4">
                        <div className="neu-surface-sm w-14 h-14 rounded-2xl text-[#FF6B00] dark:text-[#FF7A18] flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Stories Found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {searchTerm 
                                ? `No results matching "${searchTerm}". Try a different keyword.` 
                                : "You haven't created any posts yet."}
                        </p>
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="neu-surface px-4 py-2 text-xs font-bold text-[#FF6B00] dark:text-[#FF7A18] rounded-xl hover:scale-105 transition-all"
                            >
                                Clear Search
                            </button>
                        ) : (
                            <Link
                                to="/add-post"
                                className="neu-btn-primary inline-flex px-5 py-2.5 rounded-xl text-sm"
                            >
                                <span>Create First Post</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

export default AllPosts;