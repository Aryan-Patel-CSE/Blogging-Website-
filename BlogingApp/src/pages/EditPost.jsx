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
                <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Loading story details...</p>
            </div>
        );
    }

    return post ? (
        <div className='py-8'>
            <Container>
                <div className="mb-8 max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                            <Link to="/all-posts" className="hover:text-indigo-600 transition-colors">Stories</Link>
                            <span>/</span>
                            <span className="text-slate-800">Edit</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Edit Story
                        </h1>
                    </div>
                    <Link
                        to={`/post/${post.$id}`}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
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