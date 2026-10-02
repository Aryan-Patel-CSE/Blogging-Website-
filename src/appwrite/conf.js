
import config from '../conf/config'
import { Client, Databases, Storage, Query, ID } from 'appwrite'


/**
 * Safely normalizes media data from the database into an array of media objects.
 * Handles missing, null, undefined, JSON string, or malformed media data.
 *
 * @param {string|Array|null|undefined} rawMedia
 * @returns {Array<{fileId: string, name: string, mimeType: string, type: 'image'|'pdf', size?: number}>}
 */
export function parseMedia(rawMedia) {
    if (!rawMedia) return [];
    let parsed = rawMedia;
    if (typeof rawMedia === 'string') {
        const trimmed = rawMedia.trim();
        if (!trimmed || trimmed === '[]') return [];
        try {
            parsed = JSON.parse(trimmed);
        } catch (e) {
            console.warn('Appwrite service :: parseMedia :: Failed to parse media string', e);
            return [];
        }
    }
    if (!Array.isArray(parsed)) return [];

    return parsed
        .filter((item) => item && typeof item === 'object' && item.fileId)
        .map((item) => {
            const fileName = item.name ? String(item.name) : 'Attachment';
            const mimeType = item.mimeType ? String(item.mimeType) : '';
            const isPdf =
                item.type === 'pdf' ||
                mimeType === 'application/pdf' ||
                fileName.toLowerCase().endsWith('.pdf');

            return {
                fileId: String(item.fileId),
                name: fileName,
                mimeType: mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
                type: isPdf ? 'pdf' : 'image',
                ...(typeof item.size === 'number' ? { size: item.size } : {}),
            };
        });
}

const MEDIA_COMMENT_PREFIX = '<!--INKSPACE_MEDIA:';
const MEDIA_COMMENT_SUFFIX = '-->';

/**
 * Encodes additional media array into an HTML comment block appended to content.
 * Used as a zero-configuration fallback when the Appwrite database collection
 * schema does not have a dedicated 'media' string attribute.
 */
export function embedMediaInContent(content = '', mediaList = []) {
    const cleanContent = stripMediaFromContent(content);
    const validMedia = parseMedia(mediaList);
    if (!validMedia || validMedia.length === 0) {
        return cleanContent;
    }
    const encoded = encodeURIComponent(JSON.stringify(validMedia));
    return `${cleanContent}\n${MEDIA_COMMENT_PREFIX}${encoded}${MEDIA_COMMENT_SUFFIX}`;
}

/**
 * Removes any INKSPACE_MEDIA comment blocks from content.
 */
export function stripMediaFromContent(content = '') {
    if (!content || typeof content !== 'string') return '';
    return content.replace(/<!--INKSPACE_MEDIA:[\s\S]*?-->/g, '').trimEnd();
}

/**
 * Extracts and decodes media array from content comment blocks if present.
 */
export function extractMediaFromContent(content = '') {
    if (!content || typeof content !== 'string') return { content: '', media: [] };
    const match = content.match(/<!--INKSPACE_MEDIA:([\s\S]*?)-->/);
    if (match && match[1]) {
        try {
            const decoded = decodeURIComponent(match[1].trim());
            const parsed = parseMedia(decoded);
            const cleanContent = content.replace(/<!--INKSPACE_MEDIA:[\s\S]*?-->/g, '').trimEnd();
            return { content: cleanContent, media: parsed };
        } catch (e) {
            console.warn('Appwrite service :: extractMediaFromContent :: Failed to parse embedded media', e);
        }
    }
    return { content, media: [] };
}

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

    parseMedia(rawMedia) {
        return parseMedia(rawMedia);
    }

    async createPost({ title, slug, content, featuredImage, featuredimage, status, userId, userid, media = [] }) {
        const imageId = featuredimage || featuredImage;
        const uid = userid || userId;
        const validMedia = parseMedia(media);
        const serializedMedia = JSON.stringify(validMedia);

        // 1. First attempt: create document with native 'media' attribute
        try {
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
                    media: serializedMedia,
                }
            );
        } catch (error) {
            const isUnknownMediaAttr =
                error?.message &&
                error.message.toLowerCase().includes('unknown attribute') &&
                error.message.toLowerCase().includes('media');

            // 2. Schema Fallback: If Appwrite collection doesn't have the 'media' attribute,
            // embed media metadata seamlessly into post content so post creation succeeds!
            if (isUnknownMediaAttr) {
                console.info(
                    "Appwrite schema missing 'media' attribute. Seamlessly storing attachments in post content."
                );
                const contentWithMedia =
                    validMedia.length > 0 ? embedMediaInContent(content, validMedia) : content;

                return await this.databases.createDocument(
                    config.appwriteDatabaseId,
                    config.appwriteTableId,
                    slug,
                    {
                        title,
                        content: contentWithMedia,
                        featuredimage: imageId,
                        status,
                        userid: uid,
                    }
                );
            }

            console.error('Appwrite service :: createPost :: error', error);
            throw error;
        }
    }

    async updatePost(slug, { title, content, featuredImage, featuredimage, status, media }) {
        const imageId = featuredimage || featuredImage;
        const validMedia = media !== undefined ? parseMedia(media) : undefined;
        const payload = {
            title,
            content,
            featuredimage: imageId,
            status,
        };

        if (validMedia !== undefined) {
            payload.media = JSON.stringify(validMedia);
        }

        try {
            return await this.databases.updateDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                payload
            );
        } catch (error) {
            const isUnknownMediaAttr =
                error?.message &&
                error.message.toLowerCase().includes('unknown attribute') &&
                error.message.toLowerCase().includes('media');

            // Schema Fallback on update
            if (isUnknownMediaAttr) {
                console.info(
                    "Appwrite schema missing 'media' attribute on update. Embedding attachments in content."
                );
                delete payload.media;
                if (validMedia !== undefined) {
                    payload.content =
                        validMedia.length > 0
                            ? embedMediaInContent(content, validMedia)
                            : stripMediaFromContent(content);
                }

                return await this.databases.updateDocument(
                    config.appwriteDatabaseId,
                    config.appwriteTableId,
                    slug,
                    payload
                );
            }

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

                // Check native media attribute first, then fallback to embedded content
                const directMedia = parseMedia(post.media);
                const { content: cleanContent, media: embeddedMedia } = extractMediaFromContent(post.content);
                post.content = cleanContent;
                post.media = directMedia.length > 0 ? directMedia : embeddedMedia;
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

                    const directMedia = parseMedia(post.media);
                    const { content: cleanContent, media: embeddedMedia } = extractMediaFromContent(post.content);
                    post.content = cleanContent;
                    post.media = directMedia.length > 0 ? directMedia : embeddedMedia;
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
