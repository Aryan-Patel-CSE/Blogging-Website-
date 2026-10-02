import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/conf";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

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
            // 1. Delete the post database record FIRST
            const status = await appwriteService.deletePost(post.$id);
            if (status) {
                // 2. Only after database record deletion succeeds, delete all associated media files
                const fileIdsToDelete = new Set();
                const coverId = post.featuredimage || post.featuredImage;
                if (coverId && typeof coverId === 'string') {
                    fileIdsToDelete.add(coverId);
                }

                if (Array.isArray(post.media)) {
                    post.media.forEach((item) => {
                        if (item?.fileId && typeof item.fileId === 'string') {
                            fileIdsToDelete.add(item.fileId);
                        }
                    });
                }

                if (fileIdsToDelete.size > 0) {
                    await appwriteService.deleteFiles(Array.from(fileIdsToDelete));
                }

                navigate("/all-posts");
            } else {
                alert("Failed to delete post record. Files were left untouched.");
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
    const [fallbackUrl, setFallbackUrl] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const imgSrc = fallbackUrl || initialUrl;

    // Normalize and filter media
    const mediaList = Array.isArray(post.media) ? post.media : [];
    const galleryImages = mediaList.filter(
        (item) => item?.type === 'image' || (!item?.type && !item?.name?.toLowerCase().endsWith('.pdf'))
    );
    const pdfDocuments = mediaList.filter(
        (item) => item?.type === 'pdf' || item?.name?.toLowerCase().endsWith('.pdf')
    );

    const handleImageError = () => {
        if (imageId && imgSrc && imgSrc.includes('/preview?')) {
            const viewUrl = appwriteService.getFileView(imageId);
            if (viewUrl && viewUrl !== imgSrc) {
                setFallbackUrl(viewUrl);
                return;
            }
        }
        setImageError(true);
    };

    // Lightbox handlers
    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextLightboxImage = useCallback(() => {
        if (galleryImages.length > 0) {
            setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
        }
    }, [galleryImages.length]);

    const prevLightboxImage = useCallback(() => {
        if (galleryImages.length > 0) {
            setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
        }
    }, [galleryImages.length]);

    // Keyboard navigation for Lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextLightboxImage();
            if (e.key === "ArrowLeft") prevLightboxImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, nextLightboxImage, prevLightboxImage]);

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

                    {/* Featured Cover Image */}
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

                    {/* Optional Story Gallery Section */}
                    {galleryImages.length > 0 && (
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Photo Gallery</h2>
                                        <p className="text-xs text-slate-500">Click any image to view full screen</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {galleryImages.length} {galleryImages.length === 1 ? 'photo' : 'photos'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {galleryImages.map((image, index) => {
                                    const preview = appwriteService.getFilePreview(image.fileId);
                                    return (
                                        <button
                                            key={image.fileId || index}
                                            type="button"
                                            onClick={() => openLightbox(index)}
                                            className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 focus:outline-none focus:ring-3 focus:ring-indigo-400 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200"
                                        >
                                            <img
                                                src={preview}
                                                alt={image.name || `Gallery photo ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-200 flex items-center justify-center shadow-md">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                            {image.name && (
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[11px] text-white truncate font-medium">{image.name}</p>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Optional PDF Attachments Section */}
                    {pdfDocuments.length > 0 && (
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Documents & Attachments</h2>
                                        <p className="text-xs text-slate-500">Download or view attached files for this story</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {pdfDocuments.length} {pdfDocuments.length === 1 ? 'file' : 'files'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {pdfDocuments.map((doc, index) => {
                                    const viewUrl = appwriteService.getFileView(doc.fileId);
                                    const downloadUrl = appwriteService.getFileDownload(doc.fileId);

                                    return (
                                        <div
                                            key={doc.fileId || index}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 flex items-center justify-center">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2V13H9c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1zm6 3h-2v-6h2c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5zm-3.5 0h-2v-6h2c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1z"/>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                                                        {doc.name || 'Document.pdf'}
                                                    </p>
                                                    <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                                                        PDF Attachment
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {viewUrl && (
                                                    <a
                                                        href={viewUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                                                        title="Open in new tab"
                                                    >
                                                        <span>View</span>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                                        </svg>
                                                    </a>
                                                )}
                                                {downloadUrl && (
                                                    <a
                                                        href={downloadUrl}
                                                        download={doc.name || "download.pdf"}
                                                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 shadow-2xs"
                                                        title="Download attachment"
                                                    >
                                                        <span>Download</span>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                                        </svg>
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

            {/* Interactive Image Lightbox Modal */}
            {lightboxIndex !== null && galleryImages[lightboxIndex] && (
                <div 
                    role="dialog" 
                    aria-modal="true" 
                    aria-label="Image Preview"
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
                        title="Close preview (Esc)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>

                    {/* Previous Button */}
                    {galleryImages.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                prevLightboxImage();
                            }}
                            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
                            title="Previous image (Left arrow)"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    )}

                    {/* Next Button */}
                    {galleryImages.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                nextLightboxImage();
                            }}
                            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
                            title="Next image (Right arrow)"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    )}

                    {/* Image Preview Container */}
                    <div 
                        className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={appwriteService.getFileView(galleryImages[lightboxIndex].fileId) || appwriteService.getFilePreview(galleryImages[lightboxIndex].fileId)}
                            alt={galleryImages[lightboxIndex].name || "Gallery Image"}
                            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                        />
                        <div className="mt-3 flex items-center justify-between w-full text-white/90 text-xs px-2">
                            <span className="font-medium truncate max-w-[70%]">
                                {galleryImages[lightboxIndex].name || `Photo ${lightboxIndex + 1}`}
                            </span>
                            <span className="text-white/60 font-mono">
                                {lightboxIndex + 1} / {galleryImages.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
