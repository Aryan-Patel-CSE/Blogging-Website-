import { Editor } from '@tinymce/tinymce-react';

import { Controller } from 'react-hook-form';

const RTE = ({ name, control, label, defaultValue = '' }) => {
    return (
        <div className='w-full'>
            {label && (
                <label className='inline-block mb-2 text-sm font-semibold text-slate-700'>
                    {label}
                </label>
            )}
            <div className="rounded-xl overflow-hidden border border-slate-200">
                <Controller
                    name={name || "content"}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Editor
                            apiKey="no-api-key"
                            value={value !== undefined ? value : defaultValue}
                            init={{
                                height: 420,
                                menubar: false,
                                plugins: [
                                    "advlist", "autolink", "lists", "link", "image", "charmap", 
                                    "preview", "anchor", "searchreplace", "visualblocks", "code", 
                                    "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"
                                ],
                                toolbar: 
                                    "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | " +
                                    "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
                                    "link image media | removeformat | help",
                                content_style: 
                                    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; padding: 12px; }",
                                skin: "oxide",
                                promotion: false,
                                branding: false,
                            }}
                            onEditorChange={onChange}
                        />
                    )}
                />
            </div>
        </div>
    );
};

export default RTE;

