import { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RTE, Button, Input, Select } from '../index';
import appwriteService from '../../appwrite/conf';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';


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
    const [selectedFile, setSelectedFile] = useState(null);
    const existingImage = post?.featuredimage || post?.featuredImage;
    const [previewUrl, setPreviewUrl] = useState(
        existingImage ? appwriteService.getFilePreview(existingImage) : null
    );

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submit = async (data) => {
        setFormError('');
        setLoading(true);
        try {
            const fileToUpload = (data.image && data.image[0]) || selectedFile;

            if (post) {
                // Updating existing post
                let fileId = post.featuredimage || post.featuredImage;
                if (fileToUpload) {
                    const uploadedFile = await appwriteService.uploadFile(fileToUpload);
                    if (uploadedFile) {
                        fileId = uploadedFile.$id;
                        // Delete previous image if exists
                        const oldImage = post.featuredimage || post.featuredImage;
                        if (oldImage && oldImage !== fileId) {
                            await appwriteService.deleteFile(oldImage);
                        }
                    }
                }

                const dbPost = await appwriteService.updatePost(post.$id, {
                    title: data.title,
                    content: data.content,
                    featuredimage: fileId,
                    status: data.status,
                });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            } else {
                // Creating new post
                if (!fileToUpload) {
                    setFormError('Please select a featured image for your story.');
                    setLoading(false);
                    return;
                }

                const file = await appwriteService.uploadFile(fileToUpload);
                if (file) {
                    const currentUserId = userData?.$id || userData?.userData?.$id;
                    const dbPost = await appwriteService.createPost({
                        title: data.title,
                        slug: data.slug,
                        content: data.content,
                        featuredimage: file.$id,
                        status: data.status,
                        userid: currentUserId,
                    });

                    if (dbPost) {
                        navigate(`/post/${dbPost.$id}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            const msg = error?.message || 'Failed to save post. Please check your inputs and try again.';
            if (msg.toLowerCase().includes('permission') || error?.code === 401) {
                setFormError('Storage Permission Error: In Appwrite Console under Storage -> Bucket -> Settings -> Permissions, ensure "Users" and "Any" have Read & Create permissions.');
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
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{formError}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-5">
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

                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                        <RTE 
                            label="Article Content" 
                            name="content" 
                            control={control} 
                            defaultValue={getValues("content")} 
                        />
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

                        <div>
                            {(() => {
                                const imageRegister = register("image", { required: !post && !existingImage && !selectedFile });
                                return (
                                    <Input
                                        label="Featured Image"
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
                                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
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

