import { useState } from 'react';
import axios from 'axios';
import { Upload, FileArchive, Loader, CheckCircle, XCircle, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WorkingDay({ user }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        setError('Please select a ZIP file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/reports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setResult(response.data.report);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading report. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setProcessing(false), 1000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile);
      setError('');
      setResult(null);
    } else {
      setError('Please drop a ZIP file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Working Day Report</h2>
        <p className="text-indigo-100">Upload your daily EOD ZIP file to process enrollment data</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          Upload EOD ZIP File
        </h3>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50"
          onClick={() => document.getElementById('file-input').click()}
        >
          <FileArchive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {file ? file.name : 'Click to select or drag & drop your ZIP file'}
          </p>
          <p className="text-sm text-gray-500">
            Password protected ZIP files are supported (password: 123)
          </p>
          <input
            id="file-input"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected File Info */}
        {file && (
          <div className="mt-4 flex items-center justify-between bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.value = '';
              }}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading & Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Report
            </>
          )}
        </button>
      </div>

      {/* Processing Indicator */}
      {processing && !result && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin" />
            <div>
              <p className="font-semibold">Processing Report...</p>
              <p className="text-sm">Please wait while your report is being processed</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Report Uploaded Successfully!</p>
              <p className="text-sm">Date: {result.report_date}</p>
            </div>
          </div>

          {/* Enrollment Type Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Enrollment */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">NEW ENROLMENT</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{result.new_enrollment_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Amount</p>
                    <p className="text-xl font-bold text-blue-900">₹{result.new_enrollment_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Mandatory Biometric */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">MANDATORY BIOMETRIC</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{result.mandatory_bio_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-700">Amount</p>
                    <p className="text-xl font-bold text-purple-900">₹{result.mandatory_bio_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Demographic Update */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 font-medium">DEMOGRAPHIC UPDATE</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{result.demographic_update_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700">Amount</p>
                    <p className="text-xl font-bold text-green-900">₹{result.demographic_update_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Biometric Update */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">BIOMETRIC UPDATE</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">{result.biometric_update_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-orange-700">Amount</p>
                    <p className="text-xl font-bold text-orange-900">₹{result.biometric_update_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Summary Table */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Total Enrollments</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">{result.report_date}</td>
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-indigo-600">{result.total_count}</td>
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-green-600">₹{result.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Operator Details */}
          {result.operator_id && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operator Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Operator ID:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.operator_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Registrar:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.registrar}</span>
                </div>
                <div>
                  <span className="text-gray-600">Enrolment Agency:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.enrolment_agency}</span>
                </div>
                <div>
                  <span className="text-gray-600">Station ID:</span>
                  <span className="ml-2 font-medium text-gray-900">{result.station_id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
