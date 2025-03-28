import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiShield, FiInfo } from 'react-icons/fi';

const alertStyles = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
    icon: <FiAlertTriangle className="w-5 h-5 text-red-600" />,
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    icon: <FiShield className="w-5 h-5 text-yellow-600" />,
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
    icon: <FiInfo className="w-5 h-5 text-blue-600" />,
  },
};

const SecurityAlert = ({ 
  severity = 'medium',
  title,
  message,
  timestamp,
  onDismiss,
  actionButton
}) => {
  const style = alertStyles[severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`rounded-lg border ${style.bg} ${style.border} p-4 mb-4`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {style.icon}
          </div>
          <div className="ml-3 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${style.text}`}>
                  {title}
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  {message}
                </div>
                {timestamp && (
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {actionButton && (
              <div className="mt-4">
                {actionButton}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SecurityAlert;
