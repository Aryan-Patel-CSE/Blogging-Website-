import { Container, PostForm } from '../components';


function AddPost() {
  return (
    <div className='py-8'>
      <Container>
        <div className="mb-8 max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Create a New Story
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#EBD3F8]/70 mt-1">
            Write and publish your article to the InkSpace community.
          </p>
        </div>
        <PostForm />
      </Container>
    </div>
  );
}

export default AddPost;