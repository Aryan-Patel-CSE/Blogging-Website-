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

    parseMedia(media) {
        if (!media) return [];
        if (Array.isArray(media)) {
            return media.filter(
                (item) => item && typeof item === 'object' && typeof item.fileId === 'string'
            );
        }
        if (typeof media === 'string') {
            try {
                const parsed = JSON.parse(media);
                if (Array.isArray(parsed)) {
                    return parsed.filter(
                        (item) => item && typeof item === 'object' && typeof item.fileId === 'string'
                    );
                }
            } catch (e) {
                console.warn('Appwrite service :: parseMedia :: failed to parse media JSON', e);
            }
        }
        return [];
    }

    formatMediaForSave(media) {
        if (!media) return JSON.stringify([]);
        if (typeof media === 'string') {
            try {
                const parsed = JSON.parse(media);
                if (Array.isArray(parsed)) {
                    return JSON.stringify(parsed);
                }
            } catch {
                return JSON.stringify([]);
            }
        }
        if (Array.isArray(media)) {
            const sanitized = media
                .filter((item) => item && typeof item === 'object' && item.fileId)
                .map((item) => ({
                    fileId: String(item.fileId),
                    name: String(item.name || 'attachment'),
                    mimeType: String(item.mimeType || (item.type === 'pdf' ? 'application/pdf' : 'image/jpeg')),
                    type: item.type === 'pdf' ? 'pdf' : 'image',
                }));
            return JSON.stringify(sanitized);
        }
        return JSON.stringify([]);
    }

    async createPost({ title, slug, content, featuredImage, featuredimage, status, userId, userid, media }) {
        try {
            const imageId = featuredimage || featuredImage;
            const uid = userid || userId;
            const payload = {
                title,
                content,
                featuredimage: imageId,
                status,
                userid: uid,
            };
            if (media !== undefined) {
                payload.media = this.formatMediaForSave(media);
            }
            return await this.databases.createDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                payload
            );
        } catch (error) {
            console.error('Appwrite service :: createPost :: error', error);
            throw error;
        }
    }

    async updatePost(slug, { title, content, featuredImage, featuredimage, status, media }) {
        try {
            const imageId = featuredimage || featuredImage;
            const payload = {
                title,
                content,
                featuredimage: imageId,
                status
            };
            if (media !== undefined) {
                payload.media = this.formatMediaForSave(media);
            }
            return await this.databases.updateDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                payload
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
                post.media = this.parseMedia(post.media);
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
                    post.media = this.parseMedia(post.media);
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

    async deleteFiles(fileIds = []) {
        if (!fileIds || !fileIds.length) return [];
        const uniqueIds = Array.from(new Set(fileIds.filter(Boolean)));
        return await Promise.allSettled(
            uniqueIds.map((id) => this.deleteFile(id))
        );
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

    getFileDownload(fileId) {
        if (!fileId) return null;
        if (typeof fileId === 'string' && (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('blob:'))) {
            return fileId;
        }
        try {
            const download = this.bucket.getFileDownload(
                config.appwriteBucketId,
                fileId
            );
            return download ? download.toString() : null;
        } catch (error) {
            console.error('Appwrite service :: getFileDownload :: error', error);
            return this.getFileView(fileId);
        }
    }
}

const service = new Service();

export default service;