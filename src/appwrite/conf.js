import config from '../conf/config'
import { Client, Databases, Storage, Query, ID } from 'appwrite'

export class Service {
    client = new Client();
    databases;
    bucket;

    constructor() {
        this.client
            .setEndpoint(config.appwriteUrl)
            .setProject(config.appwriteProjectId);
        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
    }

    async createPost({ title, slug, content, featuredImage, featuredimage, status, userId, userid }) {
        try {
            const imageId = featuredimage || featuredImage;
            const uid = userid || userId;
            return await this.databases.createDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                {
                    title,
                    content,
                    featuredimage: imageId,
                    status,
                    userid: uid,
                }
            );
        } catch (error) {
            console.error('Appwrite service :: createPost :: error', error);
            throw error;
        }
    }

    async updatePost(slug, { title, content, featuredImage, featuredimage, status }) {
        try {
            const imageId = featuredimage || featuredImage;
            return await this.databases.updateDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                {
                    title,
                    content,
                    featuredimage: imageId,
                    status
                }
            );
        } catch (error) {
            console.error('Appwrite service :: updatePost :: error', error);
            throw error;
        }
    }

    async deletePost(slug) {
        try {
            await this.databases.deleteDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug
            );
            return true;
        } catch (error) {
            console.error('Appwrite service :: deletePost :: error', error);
            return false;
        }
    }

    async getPost(slug) {
        try {
            const post = await this.databases.getDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug
            );
            if (post) {
                const img = post.featuredimage || post.featuredImage;
                const uid = post.userid || post.userId;
                post.featuredImage = img;
                post.featuredimage = img;
                post.userId = uid;
                post.userid = uid;
            }
            return post;
        } catch (error) {
            console.error('Appwrite service :: getPost :: error', error);
            return null;
        }
    }

    async getPosts(queries = [Query.equal('status', 'active')]) {
        try {
            const res = await this.databases.listDocuments(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                queries
            );
            if (res && res.documents) {
                res.documents = res.documents.map((post) => {
                    const img = post.featuredimage || post.featuredImage;
                    const uid = post.userid || post.userId;
                    post.featuredImage = img;
                    post.featuredimage = img;
                    post.userId = uid;
                    post.userid = uid;
                    return post;
                });
            }
            return res;
        } catch (error) {
            console.error('Appwrite service :: getPosts :: error', error);
            return { documents: [], total: 0 };
        }
    }


    // File upload service
    async uploadFile(file) {
        try {
            return await this.bucket.createFile(
                config.appwriteBucketId,
                ID.unique(),
                file
            );
        } catch (error) {
            console.error('Appwrite service :: uploadFile :: error', error);
            throw error;
        }
    }

    async deleteFile(fileId) {
        if (!fileId) return false;
        try {
            await this.bucket.deleteFile(
                config.appwriteBucketId,
                fileId
            );
            return true;
        } catch (error) {
            console.error('Appwrite service :: deleteFile :: error', error);
            return false;
        }
    }

    getFilePreview(fileId) {
        if (!fileId) return null;
        if (typeof fileId === 'string' && (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('blob:'))) {
            return fileId;
        }
        try {
            const preview = this.bucket.getFilePreview(
                config.appwriteBucketId,
                fileId
            );
            return preview ? preview.toString() : null;
        } catch (error) {
            console.error('Appwrite service :: getFilePreview :: error', error);
            try {
                const view = this.bucket.getFileView(config.appwriteBucketId, fileId);
                return view ? view.toString() : null;
            } catch {
                return null;
            }
        }
    }

    getFileView(fileId) {
        if (!fileId) return null;
        if (typeof fileId === 'string' && (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('blob:'))) {
            return fileId;
        }
        try {
            const view = this.bucket.getFileView(
                config.appwriteBucketId,
                fileId
            );
            return view ? view.toString() : null;
        } catch (error) {
            console.error('Appwrite service :: getFileView :: error', error);
            return null;
        }
    }
}

const service = new Service();

export default service;