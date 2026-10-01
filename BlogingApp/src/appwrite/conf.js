import config from '../conf/config'
import { Client, Databases, Storage, Query , ID } from 'appwrite'

export class Service{
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

    // yaha par datat abse me sab small hai and yaha image and id capital me hai tho ckeck kar lene
    async createPost({title,slug,content,featuredImage,status,userId}){
        try{
           return await this.databases.createDocument(
            config.appwriteDatabaseId,
            config.appwriteTableId,
            slug,
            {
                title,
                content,
                featuredImage,
                status,
                userId,
            }
           )
        }catch(error){
            console.error('Error creating post:', error);
            throw error;
        }

    }

    async updatePost(slug, {title,content,featuredImage,status}){
        try{
            return await this.databases.updateDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug,
                {
                    title,
                    content,
                    featuredImage,
                    status
                }
            )
        }
        catch(error){
            console.error('Error updating post:', error);
            throw error;
        }
    }

    async deletePost(slug){
        try{
             await this.databases.deleteDocument(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                slug
            )
            return true
        }catch(error){
            console.error('Error deleting post:', error);
            throw false;
        }
    }

    async getPost(slug){
        try{
                return await this.databases.getDocument(
                    config.appwriteDatabaseId,
                    config.appwriteTableId,
                    slug
                );
            
        }catch(error){
            console.error('Error fetching posts:', error);
            throw false;
        }
    }

    async getPosts(queries=[Query.equal('status','active')]){
        try{
            return await this.databases.listDocuments(
                config.appwriteDatabaseId,
                config.appwriteTableId,
                queries
            );
        }catch(error){
            console.error('Error fetching posts:', error);
            throw false;
        }
    }

    //file uplaod service
    async uploadFile(file){
        try{
            return await this.bucket.createFile(
                config.appwriteBucketId,
                ID.unique(),
                file
            );
        }
        catch(error){
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async deleteFile(fileId){
        try{
            return await this.bucket.deleteFile(
                config.appwriteBucketId,
                fileId
            );
        }
        catch(error){
            console.error('Error deleting file:', error);
            throw error;
        }  
    }

    getFilePreview(fileId){
            return this.bucket.getFilePreview(
                config.appwriteBucketId,
                fileId
            );
        }
}

const service = new Service();

export default service;