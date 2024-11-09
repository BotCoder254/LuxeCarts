import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '../firebase/config';

import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';

import { motion } from 'framer-motion';

import toast from 'react-hot-toast';



const ForgotPassword = () => {

  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [emailSent, setEmailSent] = useState(false);



  const validateEmail = (email) => {

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return re.test(email);

  };



  const handleSubmit = async (e) => {

    e.preventDefault();



    if (!validateEmail(email)) {

      toast.error('Please enter a valid email address');

      return;

    }



    setLoading(true);



    try {

      await sendPasswordResetEmail(auth, email);

      setEmailSent(true);

      toast.success('Password reset email sent successfully!');

    } catch (error) {

      let errorMessage = 'Failed to send reset email';

      switch (error.code) {

        case 'auth/user-not-found':

          errorMessage = 'No account found with this email address';

          break;

        case 'auth/invalid-email':

          errorMessage = 'Invalid email address';

          break;

        case 'auth/too-many-requests':

          errorMessage = 'Too many attempts. Please try again later';

          break;

        default:

          errorMessage = error.message;

      }

      toast.error(errorMessage);

    } finally {

      setLoading(false);

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

          {emailSent ? (

            <div className="text-center">

              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">

                <FiCheck className="h-6 w-6 text-green-600" />

              </div>

              <h2 className="mt-4 text-2xl font-bold text-gray-900">

                Check your email

              </h2>

              <p className="mt-2 text-sm text-gray-600">

                We've sent a password reset link to<br />

                <span className="font-medium text-indigo-600">{email}</span>

              </p>

            </div>

          ) : (

            <>

              <h2 className="text-center text-3xl font-extrabold text-gray-900">

                Reset your password

              </h2>

              <p className="mt-2 text-center text-sm text-gray-600">

                Enter your email address and we'll send you a link to reset your password

              </p>

            </>

          )}

        </div>



        {!emailSent ? (

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

            <div>

              <label htmlFor="email" className="sr-only">

                Email address

              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                  <FiMail className="h-5 w-5 text-gray-400" />

                </div>

                <input

                  id="email"

                  name="email"

                  type="email"

                  autoComplete="email"

                  required

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"

                  placeholder="Enter your email address"

                />

              </div>

            </div>



            <div>

              <button

                type="submit"

                disabled={loading}

                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"

              >

                {loading ? 'Sending...' : 'Send reset link'}

              </button>

            </div>

          </form>

        ) : (

          <div className="mt-6 text-center">

            <button

              onClick={() => {

                setEmailSent(false);

                setEmail('');

              }}

              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"

            >

              Try with a different email

            </button>

          </div>

        )}



        <div className="flex items-center justify-center mt-6">

          <Link

            to="/login"

            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"

          >

            <FiArrowLeft className="mr-2" />

            Back to login

          </Link>

        </div>

      </motion.div>

    </div>

  );

};



export default ForgotPassword; 
