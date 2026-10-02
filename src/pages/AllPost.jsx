import { useState, useEffect } from 'react';
import { Container, PostCard } from '../components';
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
        <div className='w-full py-8'>
            <Container>
                {/* Header & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-[#7A1CAC]/30">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            All Stories
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-[#EBD3F8]/70 mt-1">
                            Browse through our full archive of published stories ({posts.length})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search stories..."
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-[#7A1CAC]/40 bg-white dark:bg-[#240632] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#7A1CAC] dark:focus:border-[#AD49E1] focus:ring-2 focus:ring-[#AD49E1]/20 transition-all"
                            />
                        </div>

                        <Link
                            to="/add-post"
                            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7A1CAC] hover:bg-[#AD49E1] shadow-sm shadow-[#7A1CAC]/20 transition-colors whitespace-nowrap"
                        >
                            + New Story
                        </Link>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="bg-white dark:bg-[#2E073F] rounded-2xl border border-slate-200/80 dark:border-[#7A1CAC]/30 p-4 space-y-4 animate-pulse">
                                <div className="aspect-[16/10] bg-slate-200 dark:bg-[#240632] rounded-xl"></div>
                                <div className="h-5 bg-slate-200 dark:bg-[#240632] rounded-md w-3/4"></div>
                                <div className="h-4 bg-slate-100 dark:bg-[#240632]/60 rounded-md w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="py-16 text-center max-w-md mx-auto bg-white dark:bg-[#2E073F] rounded-3xl border border-slate-200/90 dark:border-[#7A1CAC]/40 p-8 shadow-sm space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#240632] text-[#7A1CAC] dark:text-[#AD49E1] flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Stories Found</h3>
                        <p className="text-sm text-slate-500 dark:text-[#EBD3F8]/70">
                            {searchTerm 
                                ? `No results matching "${searchTerm}". Try a different keyword.` 
                                : "You haven't created any posts yet."}
                        </p>
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-4 py-2 text-xs font-semibold text-[#7A1CAC] dark:text-[#AD49E1] bg-[#EBD3F8]/50 dark:bg-[#240632] rounded-xl hover:bg-[#EBD3F8] dark:hover:bg-[#360a4a] transition-colors"
                            >
                                Clear Search
                            </button>
                        ) : (
                            <Link
                                to="/add-post"
                                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#7A1CAC] hover:bg-[#AD49E1] text-white font-semibold text-sm transition-colors shadow-sm shadow-[#7A1CAC]/25"
                            >
                                Create First Post
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
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