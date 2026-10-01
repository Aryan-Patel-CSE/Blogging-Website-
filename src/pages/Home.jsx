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
                            <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 animate-pulse">
                                <div className="aspect-[16/10] bg-slate-200 rounded-xl"></div>
                                <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                                <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
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
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 md:p-14 shadow-2xl">
                        {/* Decorative Background Shapes */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 max-w-2xl">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full text-indigo-200 mb-6 border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Discover & Share
                            </span>

                            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-4">
                                Where great ideas meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-white">curious minds.</span>
                            </h1>

                            <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                                Join our thriving community of writers and readers. Publish your insights, discover new perspectives, and engage with content that matters.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/login"
                                    className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 active:scale-[0.98] transition-all shadow-lg"
                                >
                                    Login to Explore
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-6 py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-sm border border-indigo-400/30 backdrop-blur-sm transition-all"
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
                    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">No Stories Published Yet</h2>
                        <p className="text-sm text-slate-600">
                            Be the first one to share your thoughts, expertise, and stories with the world.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/add-post"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all"
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
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Latest Stories
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Explore newly published insights and ideas
                        </p>
                    </div>
                    {authStatus && (
                        <Link
                            to="/add-post"
                            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
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