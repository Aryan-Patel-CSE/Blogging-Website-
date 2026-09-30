import React from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/authSlice'
import authservice from '../../appwrite/auth' 

const LogoutBtn = () => {
    const dispatch = useDispatch()

    const logoutHandler =() => {
        authservice.logout()
        .then(() => {
            dispatch(logout())
        })
        .catch((error) => {
            console.error('Error logging out:', error);
        })
    }

  return (
    <div>
      <button className='inline-block px-6 py-2 duration-200 hover:bg-blue-100 rounded-full'  >Logout</button>
    </div>
  )
}

export default LogoutBtn