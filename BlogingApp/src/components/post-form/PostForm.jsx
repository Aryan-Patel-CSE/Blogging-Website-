import React,{useCallback} from 'react'
import {useForm} from 'react-hook-form'
import {RTE,Button,Input} from '../index'
import appwriteService from '../../appwrite/config'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const PostForm = ({post}) => {
    const {register,handleSubmit,watch,setValue,control,getValues} = useForm({
        defaultValues:{
            title:post?.title||'',
            slug:post?.slug||'',
            content:post?.content||'',
            status:post?.status||'active',
        }
    })

    const navigate = useNavigate()
    const userData = useSelector(state => state.auth.userData)

    const submit = async (data) => {
        if(post){
            const file = data.image[0]?appwriteService.uploadFile(data.image[0]):null
            if(file) appwriteService.deleteFile(post.featureImg);
            
            const dbPost = await appwriteService.updatePost(post.$id,{
                ...data,
                featureImg:file?file.$id:undefined,
            })
            if(dbPost){
                navigate(`/post/${dbPost.$id}`)
            }
            
        } else{
            const file = await appwriteService.uploadFile(data.image[0]);
            if(file){
                const fileId = file.$id;
                data.featureImg = fileId;
                const dbPost = await appwriteService.createPost({
                    ...data,
                    featureImg:file.$id,
                    userId:userData.$id,
                })
                if(dbPost){
                    navigate(`/post/${dbPost.$id}`)
                }
            }
        }
    }   

    const slugTransform = useCallback((value)=>{
        if(value && typeofvalue === 'string'){
            return value.toLowerCase()
            .trim()
            .replace(/\s+/g,'-')
            .replace(/[^a-zA-Z0-9-]/g,'-')
        }
        return ''
    },[])
    
    return (
      <div>PostForm</div>
    )
}

export default PostForm
