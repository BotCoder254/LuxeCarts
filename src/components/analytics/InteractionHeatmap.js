import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useSelector } from 'react-redux';

const InteractionHeatmap = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Subscribe to user interactions
    const q = query(
      collection(db, 'interactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interactionData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Process interaction data for heatmap
      const processedData = interactionData.reduce((acc, interaction) => {
        const key = `${interaction.x}-${interaction.y}`;
        if (!acc[key]) {
          acc[key] = {
            x: interaction.x,
            y: interaction.y,
            value: 0
          };
        }
        acc[key].value += 1;
        return acc;
      }, {});

      setInteractions(Object.values(processedData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">User Interaction Heatmap</h3>
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </motion.div>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">User Interaction Heatmap</h3>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">No interaction data available yet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800">User Interaction Heatmap</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="X Position" 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Y Position" 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <ZAxis 
              type="number" 
              dataKey="value" 
              range={[50, 400]} 
              name="Interactions"
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => {
                if (name === 'Interactions') {
                  return [`${value} interactions`, name];
                }
                return [value, name];
              }}
            />
            <Scatter
              data={interactions}
              fill="#4F46E5"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Low Activity</span>
          <div className="w-48 h-2 bg-gradient-to-r from-indigo-100 to-indigo-600 rounded-full" />
          <span className="text-sm text-gray-600">High Activity</span>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractionHeatmap;
