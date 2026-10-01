import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/conf";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { slug } = useParams();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.auth.userData);
    const currentUserId = userData?.$id || userData?.userData?.$id;
    const authorId = post?.userid || post?.userId;
    const isAuthor = post && currentUserId ? authorId === currentUserId : false;

    useEffect(() => {
        if (slug) {
            appwriteService.getPost(slug)
                .then((fetchedPost) => {
                    if (fetchedPost) {
                        setPost(fetchedPost);
                    } else {
                        navigate("/all-posts");
                    }
                })
                .catch((err) => {
                    console.error("Post :: getPost :: error", err);
                    navigate("/all-posts");
                })
                .finally(() => setLoading(false));
        } else {
            navigate("/");
        }
    }, [slug, navigate]);

    const handleDeletePost = async () => {
        const confirmed = window.confirm("Are you sure you want to delete this story? This action cannot be undone.");
        if (!confirmed) return;

        setDeleting(true);
        try {
            const status = await appwriteService.deletePost(post.$id);
            if (status) {
                const imageId = post.featuredimage || post.featuredImage;
                if (imageId) {
                    await appwriteService.deleteFile(imageId);
                }
                navigate("/all-posts");
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Loading story...</p>
            </div>
        );
    }

    if (!post) return null;

    const imageId = post.featuredimage || post.featuredImage;
    const initialUrl = imageId ? appwriteService.getFilePreview(imageId) : null;

    return (
        <PostContent 
            post={post} 
            imageId={imageId} 
            initialUrl={initialUrl} 
            isAuthor={isAuthor} 
            handleDeletePost={handleDeletePost} 
            deleting={deleting} 
        />
    );
}

function PostContent({ post, imageId, initialUrl, isAuthor, handleDeletePost, deleting }) {
    const [imgSrc, setImgSrc] = useState(initialUrl);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImgSrc(initialUrl);
        setImageError(false);
    }, [initialUrl]);

    const handleImageError = () => {
        if (imageId && imgSrc && imgSrc.includes('/preview?')) {
            const viewUrl = appwriteService.getFileView(imageId);
            if (viewUrl && viewUrl !== imgSrc) {
                setImgSrc(viewUrl);
                return;
            }
        }
        setImageError(true);
    };

    return (
        <div className="py-8 md:py-12">
            <Container>
                <article className="max-w-4xl mx-auto space-y-8">
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between">
                        <Link
                            to="/all-posts"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            &larr; Back to all stories
                        </Link>

                        {isAuthor && (
                            <div className="flex items-center gap-2">
                                <Link to={`/edit-post/${post.$id}`}>
                                    <button className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer">
                                        Edit Story
                                    </button>
                                </Link>
                                <Button
                                    onClick={handleDeletePost}
                                    loading={deleting}
                                    bgColor="bg-rose-500 hover:bg-rose-600"
                                    className="px-4 py-2 text-xs font-bold rounded-xl"
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Article Header */}
                    <header className="space-y-4">
                        <div className="flex items-center gap-2">
                            {post.status && (
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                                    post.status === 'active' 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-slate-100 text-slate-700'
                                }`}>
                                    {post.status}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            {post.title}
                        </h1>
                    </header>

                    {/* Featured Image */}
                    {imgSrc && !imageError && (
                        <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-100">
                            <img
                                src={imgSrc}
                                alt={post.title}
                                onError={handleImageError}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
                        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-2xl leading-relaxed text-slate-800">
                            {parse(post.content || '')}
                        </div>
                    </div>
                </article>
            </Container>
        </div>
    );
}