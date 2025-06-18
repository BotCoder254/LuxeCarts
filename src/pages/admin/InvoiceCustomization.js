import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiSave, FiDownload, FiSettings, FiPlus, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceCustomization = () => {
  const [loading, setLoading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    template: 'professional',
    color: '#4f46e5', // Indigo
    logoUrl: '',
    notes: 'Thank you for shopping with LuxeCarts!',
    showSignature: true,
    defaultMaxModifications: 3,
    customFields: [
      { id: 1, name: '', value: '' },
      { id: 2, name: '', value: '' }
    ]
  });
  const [previewOrder, setPreviewOrder] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch a sample order for preview
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        if (!ordersSnapshot.empty) {
          const sampleOrder = { 
            id: ordersSnapshot.docs[0].id, 
            ...ordersSnapshot.docs[0].data() 
          };
          setPreviewOrder(sampleOrder);
        }

        // TODO: Fetch global invoice settings from Firestore
        // For now, we'll use the default settings
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      }
    };

    fetchSettings();
  }, []);

  const saveGlobalSettings = async () => {
    setLoading(true);
    try {
      // Create a settings document in Firestore
      // This is a simplified example - in a real app, you'd update a specific settings document
      const settingsRef = doc(db, 'settings', 'invoiceSettings');
      await updateDoc(settingsRef, {
        defaultTemplate: globalSettings.template,
        defaultColor: globalSettings.color,
        defaultLogoUrl: globalSettings.logoUrl,
        defaultNotes: globalSettings.notes,
        defaultShowSignature: globalSettings.showSignature,
        defaultMaxModifications: globalSettings.defaultMaxModifications,
        customFields: globalSettings.customFields.filter(field => field.name && field.value)
      });
      
      toast.success('Invoice settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addCustomField = () => {
    setGlobalSettings({
      ...globalSettings,
      customFields: [
        ...globalSettings.customFields,
        { id: Date.now(), name: '', value: '' }
      ]
    });
  };

  const removeCustomField = (id) => {
    setGlobalSettings({
      ...globalSettings,
      customFields: globalSettings.customFields.filter(field => field.id !== id)
    });
  };

  const updateCustomField = (id, key, value) => {
    setGlobalSettings({
      ...globalSettings,
      customFields: globalSettings.customFields.map(field => 
        field.id === id ? { ...field, [key]: value } : field
      )
    });
  };

  const generatePreviewInvoice = () => {
    if (!previewOrder) {
      toast.error('No order available for preview');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Set theme color
      const colorHex = globalSettings.color || '#4f46e5';
      // Convert hex to RGB for jsPDF
      const r = parseInt(colorHex.slice(1, 3), 16);
      const g = parseInt(colorHex.slice(3, 5), 16);
      const b = parseInt(colorHex.slice(5, 7), 16);
      
      // Add logo if available
      if (globalSettings.logoUrl) {
        try {
          doc.addImage(globalSettings.logoUrl, 'PNG', 20, 10, 40, 20);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // Add invoice header
      doc.setFontSize(20);
      doc.setTextColor(r, g, b);
      doc.text('LuxeCarts - Invoice', 105, 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Add order details
      doc.setFontSize(12);
      doc.text(`Invoice #: INV-${previewOrder.id.slice(-6)}`, 20, 40);
      doc.text(`Order #: ${previewOrder.id.slice(-6)}`, 20, 50);
      doc.text(`Date: ${previewOrder.createdAt?.toDate().toLocaleDateString()}`, 20, 60);
      
      // Add customer details
      doc.text(`Customer: ${previewOrder.shippingDetails.name}`, 20, 75);
      doc.text(`Email: ${previewOrder.shippingDetails.email}`, 20, 85);
      doc.text(`Phone: ${previewOrder.shippingDetails.phone}`, 20, 95);
      
      // Add shipping address
      doc.text('Shipping Address:', 20, 110);
      doc.text(previewOrder.shippingDetails.address, 30, 120);
      doc.text(`${previewOrder.shippingDetails.city}, ${previewOrder.shippingDetails.state} ${previewOrder.shippingDetails.zipCode}`, 30, 130);
      doc.text(previewOrder.shippingDetails.country, 30, 140);
      
      // Add items table
      const tableData = previewOrder.items.map(item => [
        item.name,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: 160,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: tableData,
        foot: [
          ['', '', 'Subtotal:', `$${previewOrder.total.toFixed(2)}`],
          ['', '', 'Shipping:', `${previewOrder.shippingCost > 0 ? `$${previewOrder.shippingCost.toFixed(2)}` : 'Free'}`],
          previewOrder.hasInsurance ? ['', '', 'Insurance:', `$${previewOrder.insuranceCost.toFixed(2)}`] : null,
          ['', '', 'Total:', `$${previewOrder.total.toFixed(2)}`]
        ].filter(Boolean),
        theme: globalSettings.template === 'minimal' ? 'plain' : 'striped',
        headStyles: { fillColor: [r, g, b] },
        footStyles: { fillColor: [r, g, b], textColor: [255, 255, 255] }
      });
      
      // Add payment status
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.text(`Payment Status: ${previewOrder.paymentStatus.toUpperCase()}`, 20, finalY + 20);
      
      // Add custom notes if available
      if (globalSettings.notes) {
        doc.text('Notes:', 20, finalY + 35);
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(globalSettings.notes, 170);
        doc.text(splitNotes, 20, finalY + 45);
      }
      
      // Add custom fields if any
      let customFieldY = finalY + (globalSettings.notes ? 60 : 35);
      globalSettings.customFields.forEach((field, index) => {
        if (field.name && field.value) {
          doc.setFontSize(10);
          doc.text(`${field.name}: ${field.value}`, 20, customFieldY + (index * 10));
        }
      });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for shopping with LuxeCarts!', 105, finalY + 85, { align: 'center' });
      
      // Add signature if enabled
      if (globalSettings.showSignature) {
        doc.text('Authorized Signature:', 150, finalY + 100);
        doc.line(150, finalY + 110, 190, finalY + 110);
      }
      
      // Save the PDF
      doc.save(`invoice-preview.pdf`);
      toast.success('Preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Invoice Customization</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={generatePreviewInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={!previewOrder}
            >
              <FiDownload /> Generate Preview
            </button>
            <button
              onClick={saveGlobalSettings}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={loading}
            >
              <FiSave /> Save Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center">
            <FiSettings className="mr-2" /> Default Invoice Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Style
                </label>
                <select
                  value={globalSettings.template}
                  onChange={(e) => setGlobalSettings({...globalSettings, template: e.target.value})}
                  className="w-full border rounded-md p-2"
                >
                  <option value="professional">Professional</option>
                  <option value="minimal">Minimal</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Theme
                </label>
                <input
                  type="color"
                  value={globalSettings.color}
                  onChange={(e) => setGlobalSettings({...globalSettings, color: e.target.value})}
                  className="w-full border rounded-md p-1 h-10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={globalSettings.logoUrl}
                  onChange={(e) => setGlobalSettings({...globalSettings, logoUrl: e.target.value})}
                  className="w-full border rounded-md p-2"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={globalSettings.showSignature}
                    onChange={(e) => setGlobalSettings({...globalSettings, showSignature: e.target.checked})}
                    className="mr-2"
                  />
                  Include Signature Line
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Max Modifications Allowed
                </label>
                <select
                  value={globalSettings.defaultMaxModifications}
                  onChange={(e) => setGlobalSettings({...globalSettings, defaultMaxModifications: parseInt(e.target.value)})}
                  className="w-full border rounded-md p-2"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Notes
                </label>
                <textarea
                  value={globalSettings.notes}
                  onChange={(e) => setGlobalSettings({...globalSettings, notes: e.target.value})}
                  className="w-full border rounded-md p-2 h-24"
                  placeholder="Add any additional notes to appear on all invoices..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                  <span>Custom Fields</span>
                  <button
                    onClick={addCustomField}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm"
                  >
                    <FiPlus className="mr-1" /> Add Field
                  </button>
                </label>
                <div className="space-y-2">
                  {globalSettings.customFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                        className="flex-1 border rounded-md p-2"
                        placeholder="Field name (e.g., 'Tax ID')"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                        className="flex-1 border rounded-md p-2"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => removeCustomField(field.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceCustomization; 