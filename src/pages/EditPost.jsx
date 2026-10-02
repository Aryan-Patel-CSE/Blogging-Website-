import { useEffect, useState } from 'react';
import { Container, PostForm } from '../components';
import appwriteService from "../appwrite/conf";
import { useNavigate, useParams, Link } from 'react-router-dom';

function EditPost() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (slug) {
            appwriteService.getPost(slug)
                .then((fetchedPost) => {

                    if (fetchedPost) {
                        setPost(fetchedPost);
                    } else {
                        navigate('/all-posts');
                    }
                })
                .catch((err) => {
                    console.error("EditPost :: getPost :: error", err);
                    navigate('/all-posts');
                })
                .finally(() => setLoading(false));
        } else {
            navigate('/');
        }
    }, [slug, navigate]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-[#DBEAFE] dark:border-[#7A1CAC]/40 border-t-[#1D4ED8] dark:border-t-[#AD49E1] rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500 dark:text-[#EBD3F8]/70">Loading story details...</p>
            </div>
        );
    }

    return post ? (
        <div className='py-8'>
            <Container>
                <div className="mb-8 max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#EBD3F8]/70 mb-2">
                            <Link to="/all-posts" className="hover:text-[#1D4ED8] dark:hover:text-[#AD49E1] transition-colors">Stories</Link>
                            <span>/</span>
                            <span className="text-slate-800 dark:text-[#EBD3F8]">Edit</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Edit Story
                        </h1>
                    </div>
                    <Link
                        to={`/post/${post.$id}`}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#240632] text-slate-700 dark:text-[#EBD3F8] hover:bg-slate-200 dark:hover:bg-[#360a4a] border border-transparent dark:border-[#7A1CAC]/40 transition-colors"
                    >
                        View Live Post &rarr;
                    </Link>
                </div>
                <PostForm post={post} />
            </Container>
        </div>
    ) : null;
}

export default EditPost;