import { useEffect, useState } from 'react';
import appwriteService from "../appwrite/conf";
import { Container, PostCard } from '../components';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const authStatus = useSelector((state) => state.auth.status);

    useEffect(() => {
        let isMounted = true;
        appwriteService.getPosts()
            .then((res) => {

                if (isMounted && res?.documents) {
                    setPosts(res.documents);
                }
            })
            .catch((err) => {
                console.error("Home :: getPosts :: error", err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Loading Skeleton
    if (loading) {
        return (
            <div className="w-full py-8">
                <Container>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="bg-white dark:bg-[#2E073F] rounded-2xl border border-slate-200/80 dark:border-[#7A1CAC]/40 p-4 space-y-4 animate-pulse">
                                <div className="aspect-[16/10] bg-slate-200 dark:bg-[#3b0d52] rounded-xl"></div>
                                <div className="h-5 bg-slate-200 dark:bg-[#3b0d52] rounded-md w-3/4"></div>
                                <div className="h-4 bg-slate-100 dark:bg-[#240632] rounded-md w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </Container>
            </div>
        );
    }

    // Guest Banner (if not logged in and no posts accessible)
    if (!authStatus && posts.length === 0) {
        return (
            <div className="w-full py-12 md:py-16">
                <Container>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2E073F] via-[#4e126c] to-[#190325] text-white p-8 md:p-14 shadow-2xl border border-[#7A1CAC]/40">
                        {/* Decorative Background Shapes */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#AD49E1]/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-[#7A1CAC]/25 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full text-[#EBD3F8] mb-6 border border-white/15">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Discover & Share
                            </span>

                            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-4">
                                Where great ideas meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EBD3F8] via-[#AD49E1] to-white">curious minds.</span>
                            </h1>

                            <p className="text-[#EBD3F8]/90 text-base md:text-lg mb-8 leading-relaxed">
                                Join our thriving community of writers and readers. Publish your insights, discover new perspectives, and engage with content that matters.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/login"
                                    className="px-6 py-3 rounded-xl bg-white text-[#2E073F] font-bold text-sm hover:bg-[#EBD3F8] active:scale-[0.98] transition-all shadow-lg"
                                >
                                    Login to Explore
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-6 py-3 rounded-xl bg-[#7A1CAC] hover:bg-[#AD49E1] text-white font-semibold text-sm border border-[#AD49E1]/40 backdrop-blur-sm transition-all shadow-md shadow-[#7A1CAC]/30"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Logged in with 0 posts
    if (posts.length === 0) {
        return (
            <div className="w-full py-16 text-center">
                <Container>
                    <div className="max-w-md mx-auto bg-white dark:bg-[#2E073F] rounded-3xl border border-slate-200/90 dark:border-[#7A1CAC]/40 p-8 sm:p-10 shadow-sm space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#EBD3F8]/50 dark:bg-[#7A1CAC]/30 text-[#7A1CAC] dark:text-[#AD49E1] flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Stories Published Yet</h2>
                        <p className="text-sm text-slate-600 dark:text-[#EBD3F8]/70">
                            Be the first one to share your thoughts, expertise, and stories with the world.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/add-post"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A1CAC] hover:bg-[#AD49E1] text-white font-semibold text-sm shadow-sm transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Write Your First Story
                            </Link>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Has posts
    return (
        <div className='w-full py-8'>
            <Container>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80 dark:border-[#7A1CAC]/30">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Latest Stories
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-[#EBD3F8]/70 mt-1">
                            Explore newly published insights and ideas
                        </p>
                    </div>
                    {authStatus && (
                        <Link
                            to="/add-post"
                            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#7A1CAC] bg-[#EBD3F8]/60 hover:bg-[#EBD3F8] dark:text-[#EBD3F8] dark:bg-[#7A1CAC]/40 dark:hover:bg-[#7A1CAC]/60 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create Story
                        </Link>
                    )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {posts.map((post) => (
                        <div key={post.$id} className="h-full">
                            <PostCard {...post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    );
}

export default Home;