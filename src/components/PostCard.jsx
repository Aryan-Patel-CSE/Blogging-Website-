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
    <Link to={`/post/${$id}`} className="group block h-full">
      <div className='h-full flex flex-col bg-white dark:bg-[#2E073F] rounded-2xl border border-slate-200/90 dark:border-[#7A1CAC]/40 overflow-hidden shadow-xs hover:shadow-xl dark:hover:shadow-[#AD49E1]/20 hover:-translate-y-1 hover:border-[#AD49E1] dark:hover:border-[#AD49E1] transition-all duration-300'>
        {/* Thumbnail Container */}
        <div className='relative w-full aspect-[16/10] bg-gradient-to-br from-[#EBD3F8]/30 via-slate-100 to-[#EBD3F8]/10 dark:from-[#240632] dark:via-[#2E073F] dark:to-[#3b0d52] overflow-hidden flex items-center justify-center'>
          {imgSrc && !imageError ? (
            <img 
              src={imgSrc} 
              alt={title || "Blog post cover"} 
              onError={handleImageError}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out'
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#7A1CAC]/10 dark:bg-[#AD49E1]/20 flex items-center justify-center text-[#7A1CAC] dark:text-[#AD49E1] mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A1CAC]/80 dark:text-[#EBD3F8]/80">Story</span>
            </div>
          )}

          {status && (
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs ${
              status === 'active'
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-700 text-white'
            }`}>
              {status}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className='p-5 flex-1 flex flex-col justify-between'>
          <div>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#7A1CAC] dark:group-hover:text-[#AD49E1] transition-colors line-clamp-2 leading-snug'>
              {title}
            </h2>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#7A1CAC]/30 flex items-center justify-between text-xs text-slate-500 dark:text-[#EBD3F8]/70">
            <span>Read Story</span>
            <span className="text-[#7A1CAC] dark:text-[#AD49E1] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Explore &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;