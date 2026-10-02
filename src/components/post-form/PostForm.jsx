import { useCallback, useState, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { RTE, Button, Input, Select } from '../index';
import appwriteService from '../../appwrite/conf';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MEDIA_LIMITS = {
    MAX_EXTRA_FILES: 8,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB per file
    MAX_FILE_SIZE_LABEL: '10 MB',
    ACCEPTED_INPUT_TYPES: 'image/png, image/jpeg, image/jpg, image/gif, image/webp, application/pdf',
};

const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PostForm = ({ post }) => {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || '',
            slug: post?.$id || post?.slug || '',
            content: post?.content || '',
            status: post?.status || 'active',
        }
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [mediaError, setMediaError] = useState('');
    const multiFileInputId = useId();

    // Featured Cover Image state
    const [selectedFile, setSelectedFile] = useState(null);
    const existingImage = post?.featuredimage || post?.featuredImage;
    const [previewUrl, setPreviewUrl] = useState(
        existingImage ? appwriteService.getFilePreview(existingImage) : null
    );

    // Additional Media: Saved (edit mode) & Staged (newly selected)
    const [savedMedia] = useState(() => {
        return Array.isArray(post?.media) ? post.media : [];
    });
    const [removedSavedMediaIds, setRemovedSavedMediaIds] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]);

    // Calculate active total extra files
    const retainedSavedMedia = savedMedia.filter((item) => !removedSavedMediaIds.includes(item.fileId));
    const totalExtraFilesCount = retainedSavedMedia.length + stagedFiles.length;

    // Revoke object URLs on unmount or when staged files change
    useEffect(() => {
        return () => {
            stagedFiles.forEach((item) => {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
        };
    }, [stagedFiles]);

    const handleCoverImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAdditionalFilesChange = (e) => {
        setMediaError('');
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (totalExtraFilesCount + files.length > MEDIA_LIMITS.MAX_EXTRA_FILES) {
            const availableSlots = Math.max(0, MEDIA_LIMITS.MAX_EXTRA_FILES - totalExtraFilesCount);
            setMediaError(
                `Limit exceeded: You can only attach up to ${MEDIA_LIMITS.MAX_EXTRA_FILES} extra files in total. You have ${availableSlots} slot(s) remaining.`
            );
            e.target.value = '';
            return;
        }

        const validNewFiles = [];

        for (const file of files) {
            // Validate file size
            if (file.size > MEDIA_LIMITS.MAX_FILE_SIZE_BYTES) {
                setMediaError(`"${file.name}" exceeds the ${MEDIA_LIMITS.MAX_FILE_SIZE_LABEL} limit (${formatBytes(file.size)}).`);
                e.target.value = '';
                return;
            }

            // Validate file type
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name);

            if (!isPdf && !isImage) {
                setMediaError(`"${file.name}" is not supported. Please upload PNG, JPG, WebP, GIF, or PDF files only.`);
                e.target.value = '';
                return;
            }

            validNewFiles.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                type: isPdf ? 'pdf' : 'image',
                mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
                previewUrl: isPdf ? null : URL.createObjectURL(file),
            });
        }

        setStagedFiles((prev) => [...prev, ...validNewFiles]);
        e.target.value = '';
    };

    const handleRemoveStagedFile = (id) => {
        setMediaError('');
        setStagedFiles((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target && target.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((item) => item.id !== id);
        });
    };

    const handleToggleRemoveSavedMedia = (fileId) => {
        setMediaError('');
        setRemovedSavedMediaIds((prev) => {
            if (prev.includes(fileId)) {
                // Restore item
                return prev.filter((id) => id !== fileId);
            } else {
                // Mark for removal
                return [...prev, fileId];
            }
        });
    };

    const submit = async (data) => {
        setFormError('');
        setMediaError('');
        setLoading(true);

        const newlyUploadedIds = [];

        try {
            const coverFileToUpload = (data.image && data.image[0]) || selectedFile;

            if (post) {
                // ==================== EDIT POST ====================
                let finalCoverId = post.featuredimage || post.featuredImage;
                let oldCoverId = null;

                // 1. Upload new cover image if user selected one
                if (coverFileToUpload) {
                    const uploadedCover = await appwriteService.uploadFile(coverFileToUpload);
                    if (uploadedCover) {
                        newlyUploadedIds.push(uploadedCover.$id);
                        oldCoverId = finalCoverId;
                        finalCoverId = uploadedCover.$id;
                    }
                }

                // 2. Upload newly staged extra media files
                const newUploadedMediaItems = [];
                for (const staged of stagedFiles) {
                    const uploaded = await appwriteService.uploadFile(staged.file);
                    if (uploaded) {
                        newlyUploadedIds.push(uploaded.$id);
                        newUploadedMediaItems.push({
                            fileId: uploaded.$id,
                            name: staged.name,
                            mimeType: staged.mimeType,
                            type: staged.type,
                        });
                    }
                }

                // 3. Assemble final media array (retained saved + newly uploaded)
                const currentRetainedSaved = savedMedia.filter(
                    (item) => !removedSavedMediaIds.includes(item.fileId)
                );
                const finalMedia = [...currentRetainedSaved, ...newUploadedMediaItems];

                // 4. Update the post record in the database FIRST
                let dbPost;
                try {
                    dbPost = await appwriteService.updatePost(post.$id, {
                        title: data.title,
                        content: data.content,
                        featuredimage: finalCoverId,
                        status: data.status,
                        media: finalMedia,
                    });
                } catch (updateError) {
                    // Update failed! Clean up newly uploaded files immediately
                    if (newlyUploadedIds.length > 0) {
                        await appwriteService.deleteFiles(newlyUploadedIds);
                    }
                    throw updateError;
                }

                // 5. Only AFTER post record update succeeds, safely delete removed files from storage
                const filesToDelete = new Set();
                if (
                    oldCoverId &&
                    oldCoverId !== finalCoverId &&
                    !finalMedia.some((m) => m.fileId === oldCoverId)
                ) {
                    filesToDelete.add(oldCoverId);
                }

                removedSavedMediaIds.forEach((id) => {
                    if (id !== finalCoverId && !finalMedia.some((m) => m.fileId === id)) {
                        filesToDelete.add(id);
                    }
                });

                if (filesToDelete.size > 0) {
                    await appwriteService.deleteFiles(Array.from(filesToDelete));
                }

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            } else {
                // ==================== CREATE POST ====================
                if (!coverFileToUpload) {
                    setFormError('Please select a featured cover image for your story.');
                    setLoading(false);
                    return;
                }

                // 1. Upload featured cover image
                const uploadedCover = await appwriteService.uploadFile(coverFileToUpload);
                if (uploadedCover) {
                    newlyUploadedIds.push(uploadedCover.$id);
                }

                // 2. Upload staged extra media files
                const newUploadedMediaItems = [];
                for (const staged of stagedFiles) {
                    const uploaded = await appwriteService.uploadFile(staged.file);
                    if (uploaded) {
                        newlyUploadedIds.push(uploaded.$id);
                        newUploadedMediaItems.push({
                            fileId: uploaded.$id,
                            name: staged.name,
                            mimeType: staged.mimeType,
                            type: staged.type,
                        });
                    }
                }

                // 3. Create post record in Appwrite Database
                const currentUserId = userData?.$id || userData?.userData?.$id;
                let dbPost;
                try {
                    dbPost = await appwriteService.createPost({
                        title: data.title,
                        slug: data.slug,
                        content: data.content,
                        featuredimage: uploadedCover.$id,
                        status: data.status,
                        userid: currentUserId,
                        media: newUploadedMediaItems,
                    });
                } catch (createError) {
                    // Create post failed! Clean up newly uploaded files from storage
                    if (newlyUploadedIds.length > 0) {
                        await appwriteService.deleteFiles(newlyUploadedIds);
                    }
                    throw createError;
                }

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            const msg = error?.message || 'Failed to save post. Please check your inputs and try again.';
            const lowerMsg = msg.toLowerCase();

            if (lowerMsg.includes('permission') || error?.code === 401 || error?.code === 403) {
                setFormError(
                    'Appwrite Permission Error: In Appwrite Console under Storage -> Bucket -> Settings -> Permissions, ensure "Users" (and "Any" if public) have Read & Create permissions.'
                );
            } else if (
                lowerMsg.includes('attribute') &&
                (lowerMsg.includes('media') || lowerMsg.includes('not found') || lowerMsg.includes('unknown'))
            ) {
                setFormError(
                    'Appwrite Schema Error: Attribute "media" not found in your collection schema. In Appwrite Console -> Databases -> your collection -> Attributes, add an optional String attribute named "media" (size: 10000 or more).'
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

    return (
        <form onSubmit={handleSubmit(submit)} className="max-w-5xl mx-auto space-y-6">
            {formError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
                    <svg className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="flex-1 font-medium leading-relaxed">{formError}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Title & Slug */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <Input
                            label="Post Title"
                            placeholder="Enter a compelling title..."
                            className="text-base"
                            {...register("title", { required: "Title is required" })}
                        />

                        <Input
                            label="URL Slug"
                            placeholder="post-url-slug"
                            {...register("slug", { required: "Slug is required" })}
                            onInput={(e) => {
                                setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                            }}
                        />
                    </div>

                    {/* Article Content RTE */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                        <RTE 
                            label="Article Content" 
                            name="content" 
                            control={control} 
                            defaultValue={getValues("content")} 
                        />
                    </div>

                    {/* Optional Additional Media: Extra Images & PDF Attachments */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                    </svg>
                                    Additional Media & Attachments
                                    <span className="text-xs font-normal text-slate-400">(Optional)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Upload extra gallery photos or PDF documents for readers to view and download.
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
                                {totalExtraFilesCount} / {MEDIA_LIMITS.MAX_EXTRA_FILES} files
                            </span>
                        </div>

                        {mediaError && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <span>{mediaError}</span>
                            </div>
                        )}

                        {/* File Picker Zone */}
                        <div>
                            <input
                                id={multiFileInputId}
                                type="file"
                                multiple
                                accept={MEDIA_LIMITS.ACCEPTED_INPUT_TYPES}
                                onChange={handleAdditionalFilesChange}
                                className="hidden"
                                disabled={totalExtraFilesCount >= MEDIA_LIMITS.MAX_EXTRA_FILES}
                            />
                            <label
                                htmlFor={multiFileInputId}
                                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                                    totalExtraFilesCount >= MEDIA_LIMITS.MAX_EXTRA_FILES
                                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                                        : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer bg-slate-50/50'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-slate-700">
                                    {totalExtraFilesCount >= MEDIA_LIMITS.MAX_EXTRA_FILES
                                        ? `Maximum limit reached (${MEDIA_LIMITS.MAX_EXTRA_FILES} files)`
                                        : 'Click to select additional images or PDFs'}
                                </span>
                                <span className="text-xs text-slate-400 mt-1">
                                    PNG, JPG, WebP, GIF, or PDF (Max 10MB each)
                                </span>
                            </label>
                        </div>

                        {/* Saved Media (in Edit mode) */}
                        {savedMedia.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <span>Existing Attachments</span>
                                    <span className="text-[10px] font-normal text-slate-400">
                                        ({savedMedia.length} saved)
                                    </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {savedMedia.map((item) => {
                                        const isMarkedForRemoval = removedSavedMediaIds.includes(item.fileId);
                                        const isImage = item.type === 'image';
                                        const preview = isImage ? appwriteService.getFilePreview(item.fileId) : null;

                                        return (
                                            <div
                                                key={item.fileId}
                                                className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                    isMarkedForRemoval
                                                        ? 'bg-rose-50/70 border-rose-200 opacity-60'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                                                    {isImage && preview ? (
                                                        <img src={preview} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-rose-500">
                                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2V13H9c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1zm6 3h-2v-6h2c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5zm-3.5 0h-2v-6h2c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1z"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold truncate ${isMarkedForRemoval ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                                        {item.name || 'Attachment'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                                            isImage ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {item.type}
                                                        </span>
                                                        {isMarkedForRemoval && (
                                                            <span className="text-[10px] text-rose-600 font-semibold">
                                                                Will be removed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleRemoveSavedMedia(item.fileId)}
                                                    className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                                        isMarkedForRemoval
                                                            ? 'text-indigo-600 hover:bg-indigo-50'
                                                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                    }`}
                                                    title={isMarkedForRemoval ? "Undo removal" : "Remove attachment"}
                                                >
                                                    {isMarkedForRemoval ? (
                                                        <span className="text-xs font-bold underline">Undo</span>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Staged New Files */}
                        {stagedFiles.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                    <span>New Files Ready to Upload</span>
                                    <span className="text-[10px] font-normal text-emerald-700">
                                        ({stagedFiles.length} newly selected)
                                    </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {stagedFiles.map((staged) => (
                                        <div
                                            key={staged.id}
                                            className="relative flex items-center gap-3 p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/30 shadow-2xs"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden flex items-center justify-center border border-emerald-100">
                                                {staged.previewUrl ? (
                                                    <img src={staged.previewUrl} alt={staged.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-rose-500">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2V13H9c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1zm6 3h-2v-6h2c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5zm-3.5 0h-2v-6h2c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1z"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 truncate" title={staged.name}>
                                                    {staged.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                                        staged.type === 'image' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {staged.type}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatBytes(staged.size)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStagedFile(staged.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                                title="Remove file"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Settings Area */}
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                            Publication Settings
                        </h3>

                        <Select
                            options={["active", "inactive"]}
                            label="Status"
                            {...register("status", { required: true })}
                        />

                        {/* Featured Cover Image (Required for post cover) */}
                        <div>
                            {(() => {
                                const imageRegister = register("image", { required: !post && !existingImage && !selectedFile });
                                return (
                                    <Input
                                        label="Featured Cover Image"
                                        type="file"
                                        accept="image/png, image/jpg, image/jpeg, image/gif, image/webp"
                                        {...imageRegister}
                                        onChange={(e) => {
                                            imageRegister.onChange(e);
                                            handleCoverImageChange(e);
                                        }}
                                    />
                                );
                            })()}
                            {previewUrl && (
                                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="Cover Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/60 text-white backdrop-blur-xs">
                                        Cover Image
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button 
                                type="submit" 
                                loading={loading}
                                className="w-full py-3 text-base font-semibold shadow-md"
                                bgColor={post ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}
                            >
                                {post ? (loading ? "Updating Post..." : "Update Story") : (loading ? "Publishing..." : "Publish Story")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default PostForm;

