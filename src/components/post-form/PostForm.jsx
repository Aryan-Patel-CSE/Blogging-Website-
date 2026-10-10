import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { RTE, Input, Select } from '../index';
import appwriteService from '../../appwrite/conf';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Configurable constants for media attachments
const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
];
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf'];

const MAX_MEDIA_FILES = 10;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES =
    'image/png, image/jpg, image/jpeg, image/gif, image/webp, application/pdf';

function formatFileSize(bytes) {
    if (!bytes || typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaType(file) {
    if (!file) return null;
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();

    if (ALLOWED_IMAGE_TYPES.includes(type) || ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
        return 'image';
    }
    if (ALLOWED_DOCUMENT_TYPES.includes(type) || ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
        return 'pdf';
    }
    return null;
}

const PostForm = ({ post }) => {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || '',
            slug: post?.$id || post?.slug || '',
            content: post?.content || '',
            status: post?.status || 'active',
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [mediaError, setMediaError] = useState('');

    // Featured Cover Image State
    const [selectedFile, setSelectedFile] = useState(null);
    const existingImage = post?.featuredimage || post?.featuredImage;
    const [previewUrl, setPreviewUrl] = useState(
        existingImage ? appwriteService.getFilePreview(existingImage) : null
    );

    // Additional Media State: saved existing items & new pending items
    const [savedMedia, setSavedMedia] = useState(
        Array.isArray(post?.media) ? post.media : []
    );
    const [pendingFiles, setPendingFiles] = useState([]);

    // Keep ref to pending files and cover preview to revoke blob URLs on unmount
    const pendingFilesRef = useRef(pendingFiles);
    pendingFilesRef.current = pendingFiles;
    const previewUrlRef = useRef(previewUrl);
    previewUrlRef.current = previewUrl;

    useEffect(() => {
        return () => {
            pendingFilesRef.current.forEach((item) => {
                if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
            if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const mediaType = getMediaType(file);
            if (mediaType !== 'image') {
                setFormError(`Cover image "${file.name}" has an unsupported format. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.`);
                e.target.value = '';
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFormError(`Cover image "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit (${formatFileSize(file.size)}).`);
                e.target.value = '';
                return;
            }

            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFormError('');
        }
    };

    const handleAdditionalMediaChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Reset the input value so the same file could be selected again if removed
        e.target.value = '';

        const errors = [];
        const newItems = [];
        const currentCount = savedMedia.length + pendingFiles.length;
        const availableSlots = MAX_MEDIA_FILES - currentCount;

        if (availableSlots <= 0) {
            setMediaError(`Maximum limit of ${MAX_MEDIA_FILES} additional files reached. Remove existing items before adding more.`);
            return;
        }

        for (const file of files) {
            if (newItems.length >= availableSlots) {
                errors.push(`Reached maximum limit of ${MAX_MEDIA_FILES} additional files.`);
                break;
            }

            const mediaType = getMediaType(file);
            if (!mediaType) {
                errors.push(`"${file.name}" is not supported. Only PNG, JPG, JPEG, GIF, WEBP, and PDF files are allowed.`);
                continue;
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                errors.push(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit (${formatFileSize(file.size)}).`);
                continue;
            }

            // Check for duplicates
            const isDuplicatePending = pendingFiles.some(
                (p) => p.name === file.name && p.size === file.size
            );
            const isDuplicateSaved = savedMedia.some((s) => s.name === file.name);
            if (isDuplicatePending || isDuplicateSaved) {
                errors.push(`"${file.name}" is already attached or selected.`);
                continue;
            }

            const objectUrl = mediaType === 'image' ? URL.createObjectURL(file) : null;
            newItems.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                file,
                previewUrl: objectUrl,
                type: mediaType,
                name: file.name,
                size: file.size,
                mimeType: file.type || (mediaType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
            });
        }

        if (errors.length > 0) {
            setMediaError(errors.join(' '));
        } else {
            setMediaError('');
        }

        if (newItems.length > 0) {
            setPendingFiles((prev) => [...prev, ...newItems]);
        }
    };

    const handleRemoveSavedMedia = (fileId) => {
        setSavedMedia((prev) => prev.filter((item) => item.fileId !== fileId));
        setMediaError('');
    };

    const handleRemovePendingFile = (id) => {
        setPendingFiles((prev) => {
            const item = prev.find((p) => p.id === id);
            if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
        setMediaError('');
    };

    const submit = async (data) => {
        setFormError('');
        setMediaError('');
        setLoading(true);

        const newlyUploadedFileIds = [];
        let postRecordSaved = false;

        try {
            const fileToUpload = (data.image && data.image[0]) || selectedFile;

            if (post) {
                // EDITING EXISTING STORY
                let finalCoverId = post.featuredimage || post.featuredImage;

                // 1. Upload new cover image if one was selected
                if (fileToUpload) {
                    const uploadedCover = await appwriteService.uploadFile(fileToUpload);
                    if (uploadedCover?.$id) {
                        finalCoverId = uploadedCover.$id;
                        newlyUploadedFileIds.push(uploadedCover.$id);
                    }
                }

                // 2. Upload any pending additional media files
                const newlyUploadedMediaItems = [];
                for (const item of pendingFiles) {
                    const uploadedMedia = await appwriteService.uploadFile(item.file);
                    if (uploadedMedia?.$id) {
                        newlyUploadedFileIds.push(uploadedMedia.$id);
                        newlyUploadedMediaItems.push({
                            fileId: uploadedMedia.$id,
                            name: item.name,
                            mimeType: item.mimeType,
                            type: item.type,
                            ...(typeof item.size === 'number' ? { size: item.size } : {}),
                        });
                    }
                }

                // 3. Combine retained savedMedia + newly uploaded media
                const finalMedia = [
                    ...savedMedia.map((m) => ({
                        fileId: m.fileId,
                        name: m.name,
                        mimeType: m.mimeType,
                        type: m.type,
                        ...(typeof m.size === 'number' ? { size: m.size } : {}),
                    })),
                    ...newlyUploadedMediaItems,
                ];

                // 4. Update the post record BEFORE deleting files that the user removed
                const dbPost = await appwriteService.updatePost(post.$id, {
                    title: data.title,
                    content: data.content,
                    featuredimage: finalCoverId,
                    status: data.status,
                    media: finalMedia,
                });

                postRecordSaved = true;

                // 5. Update succeeded! Now delete files that the user removed.
                // Avoid deleting retained files or deleting the same file twice.
                const retainedFileIds = new Set([
                    finalCoverId,
                    ...finalMedia.map((m) => m.fileId),
                ]);

                const filesToDelete = new Set();

                // If cover was replaced, queue old cover for deletion (if not retained elsewhere)
                const oldCover = post.featuredimage || post.featuredImage;
                if (fileToUpload && oldCover && !retainedFileIds.has(oldCover)) {
                    filesToDelete.add(oldCover);
                }

                // Check original post.media for items removed by author
                const originalMedia = post.media || [];
                for (const item of originalMedia) {
                    if (item?.fileId && !retainedFileIds.has(item.fileId)) {
                        filesToDelete.add(item.fileId);
                    }
                }

                // Safely delete removed files without failing navigation
                if (filesToDelete.size > 0) {
                    await Promise.allSettled(
                        Array.from(filesToDelete).map((id) => appwriteService.deleteFile(id))
                    );
                }

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            } else {
                // CREATING NEW STORY
                if (!fileToUpload) {
                    setFormError('Please select a featured cover image for your story.');
                    setLoading(false);
                    return;
                }

                // 1. Upload featured cover
                const uploadedCover = await appwriteService.uploadFile(fileToUpload);
                if (!uploadedCover?.$id) {
                    throw new Error('Failed to upload featured cover image.');
                }
                newlyUploadedFileIds.push(uploadedCover.$id);

                // 2. Upload pending media files
                const newlyUploadedMediaItems = [];
                for (const item of pendingFiles) {
                    const uploadedMedia = await appwriteService.uploadFile(item.file);
                    if (uploadedMedia?.$id) {
                        newlyUploadedFileIds.push(uploadedMedia.$id);
                        newlyUploadedMediaItems.push({
                            fileId: uploadedMedia.$id,
                            name: item.name,
                            mimeType: item.mimeType,
                            type: item.type,
                            ...(typeof item.size === 'number' ? { size: item.size } : {}),
                        });
                    }
                }

                // 3. Create post record
                const currentUserId = userData?.$id || userData?.userData?.$id;
                const currentUserName = userData?.name || userData?.userData?.name || '';
                const dbPost = await appwriteService.createPost({
                    title: data.title,
                    slug: data.slug,
                    content: data.content,
                    featuredimage: uploadedCover.$id,
                    status: data.status,
                    userid: currentUserId,
                    authorName: currentUserName,
                    media: newlyUploadedMediaItems,
                });

                postRecordSaved = true;

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            }
        } catch (error) {
            console.error('Error submitting post:', error);

            // If update/create failed after new uploads, attempt to clean up those new uploads
            if (!postRecordSaved && newlyUploadedFileIds.length > 0) {
                try {
                    await Promise.allSettled(
                        newlyUploadedFileIds.map((id) => appwriteService.deleteFile(id))
                    );
                } catch (cleanupErr) {
                    console.warn('Failed to clean up newly uploaded files after error', cleanupErr);
                }
            }

            const msg = error?.message || 'Failed to save post. Please check your inputs and try again.';
            if (msg.toLowerCase().includes('permission') || error?.code === 401) {
                setFormError(
                    'Storage Permission Error: In Appwrite Console under Storage -> Bucket -> Settings -> Permissions, ensure "Users" and "Any" have Read & Create permissions.'
                );
            } else if (msg.toLowerCase().includes('media') && msg.toLowerCase().includes('attribute')) {
                setFormError(
                    "Appwrite Database Schema Error: The 'media' attribute is missing in your Posts collection. In Appwrite Console -> Databases -> Posts collection -> Attributes -> Add String attribute 'media' (Size: 65535, Required: false)."
                );
            } else {
                setFormError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === 'string') {
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        }
        return '';
    }, []);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'title' && value.title) {
                setValue('slug', slugTransform(value.title), { shouldValidate: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    const totalAttachedMediaCount = savedMedia.length + pendingFiles.length;

    return (
        <form onSubmit={handleSubmit(submit)} className="max-w-5xl mx-auto space-y-6">
            {formError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formError}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="neu-card p-6 space-y-4">
                        <Input
                            label="Post Title"
                            placeholder="Enter a compelling title..."
                            className="text-base"
                            {...register('title', { required: 'Title is required' })}
                        />

                        <Input
                            label="URL Slug"
                            placeholder="post-url-slug"
                            {...register('slug', { required: 'Slug is required' })}
                            onInput={(e) => {
                                setValue('slug', slugTransform(e.currentTarget.value), { shouldValidate: true });
                            }}
                        />
                    </div>

                    <div className="neu-card p-6">
                        <RTE
                            label="Article Content"
                            name="content"
                            control={control}
                            defaultValue={getValues('content')}
                        />
                    </div>

                    {/* Additional Media & Attachments Section */}
                    <div className="neu-card p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/50 dark:border-white/5 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#FF6B00] dark:text-[#FF7A18]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                        />
                                    </svg>
                                    Additional Media & Documents
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Upload extra images or PDF attachments (optional, up to {MAX_MEDIA_FILES} files, max {MAX_FILE_SIZE_MB}MB each)
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full neu-surface-sm text-slate-700 dark:text-slate-200 self-start sm:self-auto">
                                {totalAttachedMediaCount} / {MAX_MEDIA_FILES} files
                            </span>
                        </div>

                        {mediaError && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <div className="flex-1">
                                    <span>{mediaError}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMediaError('')}
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-bold text-sm ml-2 cursor-pointer"
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        {/* File Picker / Dropzone */}
                        {totalAttachedMediaCount < MAX_MEDIA_FILES && (
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-[#7A1CAC]/40 hover:border-[#1D4ED8] dark:hover:border-[#AD49E1] rounded-2xl cursor-pointer bg-slate-50/60 dark:bg-[#240632]/60 hover:bg-[#DBEAFE]/20 dark:hover:bg-[#360a4a]/40 transition-all duration-200 group">
                                <div className="w-12 h-12 rounded-2xl bg-[#DBEAFE]/50 dark:bg-[#240632] group-hover:bg-[#DBEAFE] dark:group-hover:bg-[#360a4a] flex items-center justify-center text-[#1D4ED8] dark:text-[#AD49E1] mb-2 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[#1D4ED8] dark:group-hover:text-[#AD49E1] transition-colors">
                                    Click to select multiple images or PDFs
                                </p>
                                <p className="text-xs text-slate-400 dark:text-[#EBD3F8]/60 mt-1">
                                    Supports PNG, JPG, JPEG, GIF, WEBP, and PDF (Max {MAX_FILE_SIZE_MB}MB each)
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept={ACCEPTED_MEDIA_TYPES}
                                    className="hidden"
                                    onChange={handleAdditionalMediaChange}
                                />
                            </label>
                        )}

                        {/* Attached Media List */}
                        {totalAttachedMediaCount > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#EBD3F8]/60">
                                    Attached Media ({totalAttachedMediaCount})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Saved Media Items */}
                                    {savedMedia.map((item) => (
                                        <SavedMediaItem
                                            key={item.fileId}
                                            item={item}
                                            onRemove={() => handleRemoveSavedMedia(item.fileId)}
                                        />
                                    ))}

                                    {/* Newly Selected Pending Media Items */}
                                    {pendingFiles.map((item) => (
                                        <PendingMediaItem
                                            key={item.id}
                                            item={item}
                                            onRemove={() => handleRemovePendingFile(item.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Settings Area */}
                <div className="space-y-5">
                    <div className="neu-card p-6 space-y-5">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-white/5 pb-3">
                            Publication Settings
                        </h3>

                        <Select
                            options={['active', 'inactive']}
                            label="Status"
                            {...register('status', { required: true })}
                        />

                        {/* Required Featured Image Picker */}
                        <div>
                            {(() => {
                                const imageRegister = register('image', {
                                    required: !post && !existingImage && !selectedFile,
                                });
                                return (
                                    <Input
                                        label="Featured Cover Image *"
                                        type="file"
                                        accept="image/png, image/jpg, image/jpeg, image/gif, image/webp"
                                        {...imageRegister}
                                        onChange={(e) => {
                                            imageRegister.onChange(e);
                                            handleImageChange(e);
                                        }}
                                    />
                                );
                            })()}
                            {previewUrl && (
                                <div className="mt-3 relative rounded-xl overflow-hidden neu-inset-sm aspect-video flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Prominent Primary Action Button (Ref: marcelodolza/fat-zebra-11) */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="neu-btn-primary w-full py-3.5 text-base font-bold rounded-2xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{post ? 'Updating Post...' : 'Publishing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{post ? 'Update Story' : 'Publish Story'}</span>
                                        <span className="action-icon">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

function SavedMediaItem({ item, onRemove }) {
    const [imgSrc, setImgSrc] = useState(
        item.type === 'image' ? appwriteService.getFilePreview(item.fileId) : null
    );

    const handleImgError = () => {
        const viewUrl = appwriteService.getFileView(item.fileId);
        if (viewUrl && viewUrl !== imgSrc) {
            setImgSrc(viewUrl);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#7A1CAC]/30 bg-white dark:bg-[#240632] hover:border-slate-300 dark:hover:border-[#AD49E1] transition-all shadow-xs gap-3">
            <div className="flex items-center gap-3 min-w-0">
                {item.type === 'image' ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#190325] border border-slate-200 dark:border-[#7A1CAC]/40 flex-shrink-0 flex items-center justify-center">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={item.name}
                                onError={handleImgError}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-[10px] text-slate-400 dark:text-[#EBD3F8]/60">IMG</span>
                        )}
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center flex-shrink-0 font-bold text-xs">
                        <span>PDF</span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={item.name}>
                        {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            Saved
                        </span>
                        {item.size && (
                            <span className="text-[11px] text-slate-400 dark:text-[#EBD3F8]/60">
                                {formatFileSize(item.size)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                title="Remove attached file"
                aria-label={`Remove ${item.name}`}
                className="p-1.5 rounded-lg text-slate-400 dark:text-[#EBD3F8]/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex-shrink-0"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            </button>
        </div>
    );
}

function PendingMediaItem({ item, onRemove }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-[#1D4ED8]/30 dark:border-[#7A1CAC]/40 bg-[#DBEAFE]/20 dark:bg-[#240632] hover:border-[#3B82F6] dark:hover:border-[#AD49E1] transition-all shadow-xs gap-3">
            <div className="flex items-center gap-3 min-w-0">
                {item.type === 'image' && item.previewUrl ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#190325] border border-[#1D4ED8]/40 flex-shrink-0">
                        <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex flex-col items-center justify-center flex-shrink-0 font-bold text-xs">
                        <span>PDF</span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={item.name}>
                        {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#DBEAFE] dark:bg-[#7A1CAC]/40 text-[#1D4ED8] dark:text-[#EBD3F8]">
                            New Upload
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-[#EBD3F8]/60">
                            {formatFileSize(item.size)}
                        </span>
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                title="Remove pending file"
                aria-label={`Remove ${item.name}`}
                className="p-1.5 rounded-lg text-slate-400 dark:text-[#EBD3F8]/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex-shrink-0"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export default PostForm;
