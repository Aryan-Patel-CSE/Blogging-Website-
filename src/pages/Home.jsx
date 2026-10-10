import { useEffect, useState } from 'react';
import appwriteService from "../appwrite/conf";
import { Container, PostCard, NeuLoader } from '../components';
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

    // Loading State
    if (loading) {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center">
                <NeuLoader text="Curating latest stories..." size="lg" />
            </div>
        );
    }

    // Guest Banner (if not logged in and no posts accessible)
    if (!authStatus && posts.length === 0) {
        return (
            <div className="w-full py-12 md:py-16">
                <Container>
                    <div className="neu-card relative overflow-hidden p-8 md:p-14 border border-slate-200/50 dark:border-white/5">
                        {/* Decorative Background Shapes */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#FF6B00]/15 dark:bg-[#FF7A18]/15 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold tracking-wider uppercase neu-surface-sm text-[#FF6B00] dark:text-[#FF7A18] rounded-full mb-6">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Discover &amp; Share
                            </span>

                            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white mb-4">
                                Where great ideas meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FF8533] to-amber-500">curious minds.</span>
                            </h1>

                            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                                Join our thriving community of writers and thinkers. Publish your insights, discover new perspectives, and engage with content that matters.
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <Link
                                    to="/signup"
                                    className="neu-btn-primary px-6 py-3 text-sm rounded-xl"
                                >
                                    <span>Create Free Account</span>
                                    <span className="action-icon">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </span>
                                </Link>
                                <Link
                                    to="/login"
                                    className="neu-surface px-6 py-3 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] transition-all"
                                >
                                    Login to Explore
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
                    <div className="max-w-md mx-auto neu-card p-8 sm:p-10 space-y-4">
                        <div className="neu-surface-sm w-16 h-16 rounded-2xl text-[#FF6B00] dark:text-[#FF7A18] flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Stories Published Yet</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Be the first one to share your thoughts, expertise, and stories with the world.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/add-post"
                                className="neu-btn-primary px-5 py-2.5 rounded-xl text-sm"
                            >
                                <span>Write Your First Story</span>
                                <span className="action-icon">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                </span>
                            </Link>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Has posts
    return (
        <div className="w-full py-8">
            <Container>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50 dark:border-white/5">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Latest Stories
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Explore newly published insights and ideas
                        </p>
                    </div>
                    {authStatus && (
                        <Link
                            to="/add-post"
                            className="hidden sm:inline-flex neu-btn-read-story text-xs"
                        >
                            <span>Create Story</span>
                            <span className="neu-btn-read-story__icon">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </span>
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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