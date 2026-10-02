import { Editor } from '@tinymce/tinymce-react';
import { Controller } from 'react-hook-form';
import { useTheme } from '../context/ThemeContext';

const RTE = ({ name, control, label, defaultValue = '' }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className='w-full'>
            {label && (
                <label className='inline-block mb-2 text-sm font-semibold text-slate-700 dark:text-[#EBD3F8]'>
                    {label}
                </label>
            )}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#7A1CAC]/40 shadow-xs">
                <Controller
                    name={name || "content"}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <Editor
                            key={theme}
                            tinymceScriptSrc="/tinymce/tinymce.min.js"
                            value={value !== undefined ? value : defaultValue}
                            init={{
                                license_key: 'gpl',
                                base_url: '/tinymce',
                                suffix: '.min',
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
                                content_style: isDark
                                    ? "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #f8fafc; background-color: #190325; padding: 12px; } a { color: #AD49E1; }"
                                    : "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; padding: 12px; } a { color: #1D4ED8; }",
                                skin: isDark ? "oxide-dark" : "oxide",
                                content_css: isDark ? "dark" : "default",
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
