import { useState } from 'react';
import appwriteService from '../appwrite/conf';
import { Link } from 'react-router-dom';

const PostCard = ({ $id, title, featuredImage, featuredimage, status }) => {
  const imageId = featuredimage || featuredImage;
  const initialUrl = imageId ? appwriteService.getFilePreview(imageId) : null;
  const [imgSrc, setImgSrc] = useState(initialUrl);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    // If preview failed, try raw getFileView as fallback
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
    <Link to={`/post/${$id}`} className="group block h-full select-none">
      <div className="neu-card h-full flex flex-col overflow-hidden">
        {/* Thumbnail Inset Bevel Container */}
        <div className="neu-card__thumb relative w-full aspect-[16/10] overflow-hidden flex items-center justify-center">
          {imgSrc && !imageError ? (
            <img 
              src={imgSrc} 
              alt={title || "Blog post cover"} 
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 dark:bg-[#FF7A18]/15 flex items-center justify-center text-[#FF6B00] dark:text-[#FF7A18] mb-2 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00] dark:text-[#FF7A18]">
                Story
              </span>
            </div>
          )}

          {status && (
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm ${
              status === 'active'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-white'
            }`}>
              {status}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#FF6B00] dark:group-hover:text-[#FF7A18] transition-colors line-clamp-2 leading-snug">
              {title}
            </h2>
          </div>

          {/* Unified Bar with Integrated Arrow Icon (Ref: AKAspidey01/ugly-horse-68) */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5">
            <div className="neu-read-bar">
              <span>Read Story</span>
              <span className="neu-read-bar__badge">
                <svg className="neu-read-bar__arrow w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;