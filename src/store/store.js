import {configureStore} from '@reduxjs/toolkit';
import authSlice from './authSlice';
import savedPostsSlice from './savedPostsSlice';

const store = configureStore({
    reducer:{
        auth: authSlice,
        savedPosts: savedPostsSlice,
    }
});

export default store;