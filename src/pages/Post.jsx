import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/conf";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

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
            key={post.$id || imageId}
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
    const [selectedImage, setSelectedImage] = useState(null);

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

                    {/* Featured Image Cover */}
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

                    {/* Article Body Content */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
                        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-2xl leading-relaxed text-slate-800">
                            {parse(post.content || '')}
                        </div>
                    </div>

                    {/* Additional Photo Gallery (if images present) */}
                    {imageMedia.length > 0 && (
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Photo Gallery</h2>
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                                        {imageMedia.length}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400">Click to expand</span>
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
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Attachments & Documents</h2>
                                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
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
                                            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all shadow-xs gap-3 group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                                                    PDF
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
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
                                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
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
                                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
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
                </article>
            </Container>

            {/* Lightbox Modal for Gallery Images */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                            <p className="text-sm font-semibold text-slate-800 truncate pr-4">
                                {selectedImage.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={appwriteService.getFileView(selectedImage.fileId) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                                >
                                    Open Full Size &rarr;
                                </a>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    aria-label="Close modal"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-4 bg-slate-900 flex items-center justify-center max-h-[75vh] overflow-auto">
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
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-indigo-400 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
        >
            {!hasError && src ? (
                <img
                    src={src}
                    alt={item.name}
                    onError={handleError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400 text-xs">
                    <svg className="w-8 h-8 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
