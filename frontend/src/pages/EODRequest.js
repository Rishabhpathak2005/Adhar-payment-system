import { useState } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, FileUp, Send, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BYTES_TO_KB = 1024; // Convert bytes to kilobytes

export default function EODRequest({ user }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('date', selectedDate);
      formData.append('reason', reason);
      if (file) {
        formData.append('file', file);
      }

      const token = localStorage.getItem('token');
      await axios.post(`${API}/requests/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess(true);
      // Reset form
      setSelectedDate('');
      setReason('');
      setFile(null);
      const fileInput = document.getElementById('request-file-input');
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">EOD Request</h2>
        <p className="text-purple-100">Submit a request for EOD reports</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Request Submitted Successfully!</p>
            <p className="text-sm">Your request has been recorded and is pending review.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Raise Request</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </div>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
              placeholder="Enter reason for non-working day..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Upload File (Optional)
              </div>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer bg-gray-50"
              onClick={() => document.getElementById('request-file-input').click()}
            >
              {file ? (
                <div className="text-purple-600">
                  <FileUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / BYTES_TO_KB).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <FileUp className="w-8 h-8 mx-auto mb-2" />
                  <p>Click to upload a file</p>
                  <p className="text-sm mt-1">Any document type</p>
                </div>
              )}
            </div>
            <input
              id="request-file-input"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  const fileInput = document.getElementById('request-file-input');
                  if (fileInput) fileInput.value = '';
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl">
        <p className="text-sm">
          <strong>Note:</strong> All requests will be reviewed by the administrator. You will be notified of the approval status.
        </p>
      </div>
    </div>
  );
}
