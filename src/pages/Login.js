import React, { useState } from 'react';



import { useDispatch } from 'react-redux';



import { Link, useNavigate } from 'react-router-dom';



import { loginUser } from '../store/slices/authSlice';



import { FiMail, FiLock, FiShoppingBag, FiGithub } from 'react-icons/fi';



import { FcGoogle } from 'react-icons/fc';



import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';



import { auth, db } from '../firebase/config';



import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';





import { motion } from 'framer-motion';



import toast from 'react-hot-toast';







const Login = () => {



  const dispatch = useDispatch();



  const navigate = useNavigate();



  const [formData, setFormData] = useState({



    email: '',



    password: '',



  });







  const handleSubmit = async (e) => {



    e.preventDefault();



    try {



      await dispatch(loginUser(formData)).unwrap();



      toast.success('Login successful!');



      navigate('/');



    } catch (error) {



      toast.error(error.message || 'Login failed');



    }



  };











  const handleGoogleSignIn = async () => {







    try {







      const provider = new GoogleAuthProvider();







      const result = await signInWithPopup(auth, provider);







      const user = result.user;













      // Check if user exists in Firestore







      const userRef = doc(db, 'users', user.uid );







      const userSnap = await getDoc(userRef);















      if (!userSnap.exists()) {







        // Create new user document if it doesn't exist







        await setDoc(userRef, {







          uid: user.uid,







          email: user.email,







          displayName: user.displayName,







          photoURL: user.photoURL,







          role: 'user',







          createdAt: serverTimestamp(),







          updatedAt: serverTimestamp(),







        });







      }















      toast.success('Login successful!');







      navigate('/');







    } catch (error) {







      toast.error(error.message || 'Failed to sign in with Google');







    }







  };











  return (



    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">



      <motion.div



        initial={{ opacity: 0, y: 20 }}



        animate={{ opacity: 1, y: 0 }}



        transition={{ duration: 0.5 }}



        className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"



      >



        <div>



          <div className="flex justify-center">



            <FiShoppingBag className="h-12 w-12 text-indigo-600" />



          </div>



          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">



            Welcome back to LuxeCart



          </h2>



          <p className="mt-2 text-center text-sm text-gray-600">



            Enter your credentials to access your account



          </p>



        </div>







        <div className="flex flex-col gap-4">







          <button







            type="button"







            onClick={handleGoogleSignIn}







            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"







          >







            <FcGoogle className="h-5 w-5" />







            Continue with Google







          </button>







        </div>







        <div className="relative">







          <div className="absolute inset-0 flex items-center">







            <div className="w-full border-t border-gray-300" />







          </div>







          <div className="relative flex justify-center text-sm">







            <span className="px-2 bg-white text-gray-500">Or continue with</span>







          </div>







        </div>



        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>



          <div className="rounded-md shadow-sm space-y-4">



            <div>



              <label htmlFor="email" className="block text-sm font-medium text-gray-700">



                Email address



              </label>



              <div className="mt-1 relative">



                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">



                  <FiMail className="h-5 w-5 text-gray-400" />



                </div>



                <input



                  id="email"



                  type="email"



                  required



                  value={formData.email}



                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}



                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"



                  placeholder="Enter your email"



                />



              </div>



            </div>



            <div>



              <label htmlFor="password" className="block text-sm font-medium text-gray-700">



                Password



              </label>



              <div className="mt-1 relative">



                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">



                  <FiLock className="h-5 w-5 text-gray-400" />



                </div>



                <input



                  id="password"



                  type="password"



                  required



                  value={formData.password}



                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}



                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"



                  placeholder="Enter your password"



                />



              </div>



            </div>



          </div>







          <div className="flex items-center justify-between">



            <div className="flex items-center">



              <input



                id="remember-me"



                name="remember-me"



                type="checkbox"



                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"



              />



              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">



                Remember me



              </label>



            </div>







            <div className="text-sm">



              <Link



                to="/forgot-password"



                className="font-medium text-indigo-600 hover:text-indigo-500"



              >



                Forgot password?



              </Link>



            </div>



          </div>







          <div>



            <button



              type="submit"



              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"



            >



              Sign in



            </button>



          </div>







          <div className="text-center">



            <Link



              to="/register"



              className="font-medium text-indigo-600 hover:text-indigo-500"



            >



              Don't have an account? Sign up



            </Link>



          </div>



        </form>



      </motion.div>



    </div>



  );



};







export default Login; 


