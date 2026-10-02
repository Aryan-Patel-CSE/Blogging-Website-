import { useState } from 'react';

import appwriteService from '../appwrite/conf';
import { Link } from 'react-router-dom';

const PostCard = ({ $id, title, featuredImage, featuredimage, status }) => {
  const imageId = featuredimage || featuredImage;
  const initialUrl = imageId ? appwriteService.getFilePreview(imageId) : null;
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  const imgSrc = fallbackUrl || initialUrl;

  const handleImageError = () => {
    // If preview failed, try raw getFileView as fallback
    if (imageId && imgSrc && imgSrc.includes('/preview?')) {
      const viewUrl = appwriteService.getFileView(imageId);
      if (viewUrl && viewUrl !== imgSrc) {
        setFallbackUrl(viewUrl);
        return;
      }
    }
    setImageError(true);
  };

  return (
    <Link to={`/post/${$id}`} className="group block h-full">
      <div className="card-shine h-full flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 hover:border-indigo-300 transition-all duration-300">
        {/* Thumbnail Container */}
        <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-indigo-100 via-slate-100 to-indigo-50 overflow-hidden flex items-center justify-center">
          {imgSrc && !imageError ? (
            <img 
              src={imgSrc} 
              alt={title || "Blog post cover"} 
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-2 transition-transform duration-300 group-hover:scale-110">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700/70">Story</span>
            </div>
          )}

          {status && (
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5 backdrop-blur-xs ${
              status === 'active' 
                ? 'bg-emerald-500/95 text-white' 
                : 'bg-slate-700/90 text-white'
            }`}>
              {status === 'active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              )}
              {status}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
              {title}
            </h2>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Read Story</span>
            <span className="text-indigo-600 font-semibold group-hover:translate-x-1.5 transition-transform duration-300 inline-flex items-center gap-1">
              Explore &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;