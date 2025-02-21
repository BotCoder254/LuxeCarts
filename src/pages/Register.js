import React, { useState } from 'react';



import { useDispatch } from 'react-redux';



import { Link, useNavigate } from 'react-router-dom';



import { registerUser } from '../store/slices/authSlice';



import { FiMail, FiLock, FiUser, FiShoppingBag } from 'react-icons/fi';



import { motion } from 'framer-motion';



import toast from 'react-hot-toast';



import { FcGoogle } from 'react-icons/fc';

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { auth, db } from '../firebase/config';

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';



const Register = () => {



  const dispatch = useDispatch();



  const navigate = useNavigate();



  const [formData, setFormData] = useState({



    email: '',



    password: '',



    displayName: '',



  });







  const handleSubmit = async (e) => {



    e.preventDefault();



    try {



      await dispatch(registerUser(formData)).unwrap();



      toast.success('Registration successful!');



      navigate('/');



    } catch (error) {



      toast.error(error.message || 'Registration failed');



    }



  };







  const handleGoogleSignUp = async () => {



    try {



      const provider = new GoogleAuthProvider();



      const result = await signInWithPopup(auth, provider);



      const user = result.user;







      // Create user document in Firestore



      const userRef = doc(db, 'users', user.uid);



      await setDoc(userRef, {



        uid: user.uid,



        email: user.email,



        displayName: user.displayName,



        photoURL: user.photoURL,



        role: 'user',



        createdAt: serverTimestamp(),



        updatedAt: serverTimestamp(),



      });







      toast.success('Registration successful!');



      navigate('/');



    } catch (error) {



      toast.error(error.message || 'Failed to sign up with Google');



    }



  };







  return (



    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl">
        <div className="hidden lg:block w-1/2 pr-8">
          <img
            src="/register-side-image.jpg"
            alt="Join LuxeCart"
            className="w-full h-full object-cover rounded-l-xl shadow-lg"
          />
        </div>
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



              Create your account



            </h2>



            <p className="mt-2 text-center text-sm text-gray-600">



              Join LuxeCart and discover amazing products



            </p>



          </div>



          <div className="flex flex-col gap-4">



            <button



              type="button"



              onClick={handleGoogleSignUp}



              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"



            >



              <FcGoogle className="h-5 w-5" />



              Sign up with Google



            </button>



          </div>



          <div className="relative">



            <div className="absolute inset-0 flex items-center">



              <div className="w-full border-t border-gray-300" />



            </div>



            <div className="relative flex justify-center text-sm">



              <span className="px-2 bg-white text-gray-500">Or sign up with email</span>



            </div>



          </div>



          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>



            <div className="rounded-md shadow-sm space-y-4">



              <div>



                <label htmlFor="name" className="block text-sm font-medium text-gray-700">



                  Full Name



                </label>



                <div className="mt-1 relative">



                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">



                    <FiUser className="h-5 w-5 text-gray-400" />



                  </div>



                  <input



                    id="name"



                    type="text"



                    required



                    value={formData.displayName}



                    onChange={(e) =>



                      setFormData({ ...formData, displayName: e.target.value })



                    }



                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"



                    placeholder="Enter your full name"



                  />



                </div>



              </div>



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



                    onChange={(e) =>



                      setFormData({ ...formData, email: e.target.value })



                    }



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



                    onChange={(e) =>



                      setFormData({ ...formData, password: e.target.value })



                    }



                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"



                    placeholder="Create a password"



                  />



                </div>



              </div>



            </div>







            <div>



              <button



                type="submit"



                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"



              >



                Create Account



              </button>



            </div>







            <div className="text-center">



              <Link



                to="/login"



                className="font-medium text-indigo-600 hover:text-indigo-500"



              >



                Already have an account? Sign in



              </Link>



            </div>



          </form>



        </motion.div>
      </div>
    </div>



  );



};







export default Register; 


