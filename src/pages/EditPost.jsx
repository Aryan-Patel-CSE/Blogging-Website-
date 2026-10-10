import { useEffect, useState } from 'react';
import { Container, PostForm, NeuLoader } from '../components';
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
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-16">
                <NeuLoader text="Loading story details..." size="md" />
            </div>
        );
    }

    return post ? (
        <div className="py-8">
            <Container>
                <div className="mb-8 max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                            <Link to="/all-posts" className="hover:text-[#FF6B00] dark:hover:text-[#FF7A18] transition-colors">Stories</Link>
                            <span>/</span>
                            <span className="text-slate-800 dark:text-slate-100">Edit</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Edit Story
                        </h1>
                    </div>
                    <Link
                        to={`/post/${post.$id}`}
                        className="neu-surface-sm px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#FF6B00] dark:hover:text-[#FF7A18] rounded-xl transition-all"
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