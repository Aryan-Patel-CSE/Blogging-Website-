import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/conf";
import { CommentSystem, Container, NeuLoader } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";
import { isAdminUser } from "../utils/authHelper";
import { useSavedPosts } from "../hooks/useSavedPosts";

function formatFileSize(bytes) {
    if (!bytes || typeof bytes !== "number") return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Post() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const { slug } = useParams();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.auth.userData);
    const currentUserId = userData?.$id || userData?.userData?.$id;
    const authorId = post?.userid || post?.userId;
    const isAdmin = isAdminUser(userData);
    const isAuthor = Boolean(post && currentUserId && authorId === currentUserId);
    const canManagePost = isAuthor || isAdmin;
    const storedAuthorName =
        (typeof post?.author === "string" ? post.author : post?.author?.name) ||
        (typeof post?.authorName === "string" ? post.authorName : '') ||
        (typeof post?.authorname === "string" ? post.authorname : '') ||
        (typeof post?.username === "string" ? post.username : '') ||
        (typeof post?.name === "string" ? post.name : '');
    const authorName =
        storedAuthorName ||
        (authorId === currentUserId ? userData?.name || userData?.userData?.name : '') ||
        'InkSpace author';

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
            // Delete post record first
            const status = await appwriteService.deletePost(post.$id);
            if (status) {
                // Collect all associated media files and cover image
                // Ensure each file is only deleted once and retained files are protected
                const filesToDelete = new Set();
                const coverId = post.featuredimage || post.featuredImage;
                if (coverId) {
                    filesToDelete.add(coverId);
                }
                if (Array.isArray(post.media)) {
                    post.media.forEach((item) => {
                        if (item?.fileId) {
                            filesToDelete.add(item.fileId);
                        }
                    });
                }

                if (filesToDelete.size > 0) {
                    await Promise.allSettled(
                        Array.from(filesToDelete).map((id) => appwriteService.deleteFile(id))
                    );
                }
                navigate("/all-posts");
            } else {
                alert("Failed to delete post record.");
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
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-16">
                <NeuLoader text="Loading story..." size="md" />
            </div>
        );
    }

    if (!post) return null;

    const imageId = post.featuredimage || post.featuredImage;
    const initialUrl = imageId ? appwriteService.getFilePreview(imageId) : null;

    return (
        <PostContent
            key={post.$id || imageId}
            post={post}
            imageId={imageId}
            initialUrl={initialUrl}
            canManagePost={canManagePost}
            isAdmin={isAdmin}
            authorName={authorName}
            handleDeletePost={handleDeletePost}
            deleting={deleting}
            postId={post.$id || slug}
            postAuthorId={post?.userid || post?.userId}
        />
    );
}

function PostContent({ post, imageId, initialUrl, canManagePost, isAdmin, authorName, handleDeletePost, deleting, postId, postAuthorId }) {
    const [imgSrc, setImgSrc] = useState(initialUrl);
    const [imageError, setImageError] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [reaction, setReaction] = useState(null);
    const [shareMessage, setShareMessage] = useState("");
    const { isSaved, toggleSave } = useSavedPosts();
    const isStorySaved = isSaved(post?.$id || postId);

    const handleSaveStory = () => {
        toggleSave({
            $id: post?.$id || postId,
            title: post?.title,
            featuredImage: imageId,
            featuredimage: imageId,
            status: post?.status,
            author: authorName,
            authorName: authorName,
        });
        setShareMessage(isStorySaved ? "Removed from saved stories." : "Story saved to your reading list!");
    };

    const handleLike = () => {
        if (reaction === "like") {
            setReaction(null);
            setLikeCount((count) => Math.max(0, count - 1));
            return;
        }

        setReaction("like");
        setLikeCount((count) => count + 1);
        if (reaction === "dislike") {
            setDislikeCount((count) => Math.max(0, count - 1));
        }
    };

    const handleDislike = () => {
        if (reaction === "dislike") {
            setReaction(null);
            setDislikeCount((count) => Math.max(0, count - 1));
        } else {
            setReaction("dislike");
            if (reaction === "like") {
                setLikeCount((count) => Math.max(0, count - 1));
            }
            setDislikeCount((count) => count + 1);
        }
    };

    const copyPostLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareMessage("Link copied!");
        } catch (error) {
            console.error("Post :: copyPostLink :: error", error);
            setShareMessage("Unable to copy the link. Please copy it from your browser's address bar.");
        }
    };

    const handleShare = async () => {
        setShareMessage("");
        const shareData = {
            title: post.title,
            text: `Read "${post.title}" on InkSpace`,
            url: window.location.href,
        };

        if (typeof navigator.share === "function") {
            try {
                await navigator.share(shareData);
                setShareMessage("Thanks for sharing!");
                return;
            } catch (error) {
                if (error?.name !== "AbortError") {
                    console.error("Post :: sharePost :: error", error);
                }
            }
        }

        await copyPostLink();
    };

    useEffect(() => {
        if (!shareMessage) return;

        const timeoutId = window.setTimeout(() => setShareMessage(""), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [shareMessage]);

    // Close lightbox on Escape key
    useEffect(() => {
        if (!selectedImage) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setSelectedImage(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImage]);

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

    const mediaList = Array.isArray(post.media) ? post.media : [];
    const imageMedia = mediaList.filter((item) => item.type === "image");
    const pdfMedia = mediaList.filter((item) => item.type === "pdf");

    return (
        <div className="py-8 md:py-12">
            <Container>
                <article className="max-w-4xl mx-auto space-y-8">
                    {/* Top Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            to="/all-posts"
                            className="neu-btn-read-story text-xs"
                        >
                            <span>&larr; Back to all stories</span>
                        </Link>

                        <div className="flex items-center gap-2.5">
                            {/* Save / Bookmark Button */}
                            <button
                                type="button"
                                onClick={handleSaveStory}
                                aria-label={isStorySaved ? "Remove from saved stories" : "Save story"}
                                className={`neu-surface-sm px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${
                                    isStorySaved
                                        ? 'text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-xs'
                                        : 'text-slate-700 dark:text-slate-200 hover:text-[var(--accent-primary)]'
                                }`}
                                title={isStorySaved ? "Saved to reading list" : "Save this story"}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill={isStorySaved ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth={isStorySaved ? "0" : "2"}
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span>{isStorySaved ? "Saved" : "Save Story"}</span>
                            </button>

                            {canManagePost && (
                            <div className="flex items-center gap-2.5">
                                {isAdmin && (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 1.5 17 4v5.1c0 4.4-2.9 7.5-7 9.4-4.1-1.9-7-5-7-9.4V4l7-2.5Zm0 4a2.1 2.1 0 0 0-2.1 2.1v1.1a1 1 0 0 0-.8 1v3.1a1 1 0 0 0 1 1h3.8a1 1 0 0 0 1-1V9.7a1 1 0 0 0-.8-1V7.6A2.1 2.1 0 0 0 10 5.5Zm-.8 3.1V7.6a.8.8 0 0 1 1.6 0v1h-1.6Z" clipRule="evenodd" />
                                        </svg>
                                        Admin
                                    </span>
                                )}
                                <Link to={`/edit-post/${post.$id}`}>
                                    <button className="neu-surface-sm px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] rounded-xl cursor-pointer">
                                        Edit Story
                                    </button>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleDeletePost}
                                    disabled={deleting}
                                    className="neu-btn-delete disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Delete this story"
                                >
                                    {deleting ? (
                                        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <span className="bin-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                                                <path
                                                    className="bin-lid"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
                                                />
                                                <path
                                                    className="bin-body"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 4v6m4-6v6"
                                                />
                                            </svg>
                                        </span>
                                    )}
                                     <span>{deleting ? "Deleting..." : "Delete"}</span>
                                </button>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Article Header */}
                    <header className="space-y-4">
                        <div className="flex items-center gap-2">
                            {post.status && (
                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider shadow-xs ${
                                    post.status === 'active'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                        : 'neu-surface-sm text-slate-700 dark:text-slate-300'
                                }`}>
                                    {post.status}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            {post.title}
                        </h1>
                    </header>

                    {/* Featured Image Cover */}
                    {imgSrc && !imageError && (
                        <div className="neu-card w-full aspect-[21/9] overflow-hidden">
                            <img
                                src={imgSrc}
                                alt={post.title}
                                onError={handleImageError}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Body Content */}
                    <div className="neu-card p-6 sm:p-10 border border-slate-200/50 dark:border-white/5">
                        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[#FF6B00] dark:prose-a:text-[#FF7A18] prose-img:rounded-2xl leading-relaxed text-slate-800 dark:text-slate-100">
                            {parse(post.content || '')}
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                    <div className="post-reaction" role="group" aria-label="React to or share this post">
                        <button
                            type="button"
                            onClick={handleLike}
                            aria-label={`${reaction === "like" ? "Unlike" : "Like"} this post`}
                            aria-pressed={reaction === "like"}
                            className={`post-reaction__button post-reaction__like${reaction === "like" ? " is-active" : ""}`}
                        >
                            <span className={`post-reaction__icon${reaction === "like" ? " post-reaction__icon--liked" : ""}`} aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill={reaction === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.5l4.2-7.3A2 2 0 0 1 15 5v.88Z" />
                                </svg>
                                {reaction === "like" && (
                                    <>
                                        <i className="post-reaction__spark post-reaction__spark--one" />
                                        <i className="post-reaction__spark post-reaction__spark--two" />
                                        <i className="post-reaction__spark post-reaction__spark--three" />
                                        <i className="post-reaction__spark post-reaction__spark--four" />
                                    </>
                                )}
                            </span>
                            <span key={likeCount} className="post-reaction__count" aria-live="polite">{likeCount}</span>
                        </button>

                        <span className="post-reaction__divider" aria-hidden="true" />

                        <button
                            type="button"
                            onClick={handleDislike}
                            aria-label={`${reaction === "dislike" ? "Remove dislike from" : "Dislike"} this post`}
                            aria-pressed={reaction === "dislike"}
                            className={`post-reaction__button post-reaction__dislike${reaction === "dislike" ? " is-active" : ""}`}
                        >
                            <span className={`post-reaction__icon${reaction === "dislike" ? " post-reaction__icon--disliked" : ""}`} aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill={reaction === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 7.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5l-4.2 7.3A2 2 0 0 1 9 19v-.88Z" />
                                </svg>
                                {reaction === "dislike" && (
                                    <>
                                        <i className="post-reaction__spark post-reaction__spark--one" />
                                        <i className="post-reaction__spark post-reaction__spark--two" />
                                        <i className="post-reaction__spark post-reaction__spark--three" />
                                        <i className="post-reaction__spark post-reaction__spark--four" />
                                    </>
                                )}
                            </span>
                            <span key={dislikeCount} className="post-reaction__count" aria-live="polite">{dislikeCount}</span>
                        </button>

                        <span className="post-reaction__divider" aria-hidden="true" />

                        <button
                            type="button"
                            onClick={handleSaveStory}
                            aria-label={isStorySaved ? "Remove from saved stories" : "Save this story"}
                            aria-pressed={isStorySaved}
                            className={`post-reaction__button${isStorySaved ? " is-active text-[var(--accent-primary)]" : ""}`}
                        >
                            <span className={`post-reaction__icon${isStorySaved ? " text-[var(--accent-primary)]" : ""}`} aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill={isStorySaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </span>
                            <span className="text-sm font-semibold">{isStorySaved ? "Saved" : "Save"}</span>
                        </button>

                        <span className="post-reaction__divider" aria-hidden="true" />

                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label="Share this post"
                            className="post-reaction__button"
                        >
                            <span className="post-reaction__icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" />
                                </svg>
                            </span>
                            <span className="text-sm font-semibold">Share</span>
                        </button>
                    </div>
                    {shareMessage && <p className="text-xs font-medium text-slate-500 dark:text-[#EBD3F8]/70" role="status" aria-live="polite">{shareMessage}</p>}
                    </div>

                    <CommentSystem postId={postId} postAuthorId={postAuthorId} />

                    {/* Additional Photo Gallery (if images present) */}
                    {imageMedia.length > 0 && (
                        <section className="neu-card p-6 sm:p-8 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="neu-surface-sm w-9 h-9 rounded-xl flex items-center justify-center text-[#FF6B00] dark:text-[#FF7A18]">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Photo Gallery</h2>
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#FF6B00]/15 text-[#FF6B00] dark:text-[#FF7A18]">
                                        {imageMedia.length}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Click to expand</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {imageMedia.map((item, index) => (
                                    <GalleryCard
                                        key={item.fileId || index}
                                        item={item}
                                        onSelect={() => setSelectedImage(item)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* PDF Attachments & Documents (if PDFs present) */}
                    {pdfMedia.length > 0 && (
                        <section className="neu-card p-6 sm:p-8 space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-slate-200/50 dark:border-white/5 pb-4">
                                <div className="neu-surface-sm w-9 h-9 rounded-xl flex items-center justify-center text-rose-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attachments & Documents</h2>
                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                    {pdfMedia.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {pdfMedia.map((item, index) => {
                                    const viewUrl = appwriteService.getFileView(item.fileId);
                                    const downloadUrl = appwriteService.getFileDownload(item.fileId) || viewUrl;

                                    return (
                                        <div
                                            key={item.fileId || index}
                                            className="neu-surface-sm flex items-center justify-between p-3.5 rounded-2xl gap-3 group hover:border-[#FF6B00]/40 dark:hover:border-[#FF7A18]/40"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="neu-inset-sm w-10 h-10 rounded-xl text-rose-500 flex items-center justify-center font-black text-xs flex-shrink-0">
                                                    PDF
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#FF6B00] dark:group-hover:text-[#FF7A18] transition-colors" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        {item.size ? formatFileSize(item.size) : 'PDF Document'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {viewUrl && (
                                                    <a
                                                        href={viewUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`View document ${item.name} in new tab`}
                                                        className="neu-surface-sm px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] rounded-lg cursor-pointer"
                                                    >
                                                        View
                                                    </a>
                                                )}
                                                {downloadUrl && (
                                                    <a
                                                        href={downloadUrl}
                                                        download={item.name}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Download document ${item.name}`}
                                                        className="neu-btn-primary px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <footer className="neu-card flex items-center gap-3.5 p-5">
                        <div className="neu-surface-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-[#FF6B00] dark:text-[#FF7A18]" aria-hidden="true">
                            {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Written by
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                {authorName}
                            </p>
                        </div>
                    </footer>
                </article>
            </Container>

            {/* Lightbox Modal for Gallery Images */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#2E073F] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#7A1CAC]/50 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#7A1CAC]/40 bg-white dark:bg-[#2E073F]">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate pr-4">
                                {selectedImage.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={appwriteService.getFileView(selectedImage.fileId) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#1D4ED8] dark:text-[#AD49E1] hover:text-[#3B82F6] dark:hover:text-[#EBD3F8] px-2 py-1 rounded-md hover:bg-[#DBEAFE]/40 dark:hover:bg-[#240632] transition-colors"
                                >
                                    Open Full Size &rarr;
                                </a>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    aria-label="Close modal"
                                    className="p-1 rounded-lg text-slate-400 dark:text-[#EBD3F8]/70 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#240632] transition-colors cursor-pointer"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-4 bg-black/90 dark:bg-[#190325] flex items-center justify-center max-h-[75vh] overflow-auto">
                            <img
                                src={appwriteService.getFilePreview(selectedImage.fileId) || appwriteService.getFileView(selectedImage.fileId)}
                                alt={selectedImage.name}
                                className="max-w-full max-h-[70vh] object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GalleryCard({ item, onSelect }) {
    const previewUrl = appwriteService.getFilePreview(item.fileId);
    const [src, setSrc] = useState(previewUrl);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        const viewUrl = appwriteService.getFileView(item.fileId);
        if (viewUrl && viewUrl !== src) {
            setSrc(viewUrl);
        } else {
            setHasError(true);
        }
    };

    return (
        <div
            onClick={onSelect}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#240632] border border-slate-200 dark:border-[#7A1CAC]/40 hover:border-[#1D4ED8] dark:hover:border-[#AD49E1] cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
        >
            {!hasError && src ? (
                <img
                    src={src}
                    alt={item.name}
                    onError={handleError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400 dark:text-[#EBD3F8]/60 text-xs">
                    <svg className="w-8 h-8 mb-1 text-slate-300 dark:text-[#7A1CAC]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{item.name}</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className="text-xs text-white font-medium truncate w-full">
                    {item.name}
                </p>
            </div>
        </div>
    );
}
