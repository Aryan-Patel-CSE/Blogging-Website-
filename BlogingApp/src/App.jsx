import React, { useState , useEffect } from 'react'
import { useDispatch } from 'react-redux'
import authservice from './appwrite/auth'
import {login,logout} from './store/authSlice'
import {Header,Footer} from './components'

const App = () => {
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    authservice.getCurrentUser()
    .then((userData) => {
      if(userData) {
        dispatch(login({userData}))
      }
      else{
        dispatch(logout())
      }
    })
    .finally(()=> setLoading(false))
  },[])

  return !loading?(
    <div className='min-h-screen flex flex-wrap content-between items-center bg-gray-500'>
      <div>
        <Header />
        <main>
          {/* <Outlet/> */}
        </main>
        <Footer/>
      </div>
    </div>
  ) : null
}

export default App
