import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Calendar, Loader, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MissingEOD({ user }) {
  const [missingData, setMissingData] = useState({ ecmp: [], uc: [], total_missing: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMissingEOD = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/missing-eod`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMissingData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching missing EOD reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissingEOD();
  }, []);  // Empty dependency array is intentional - only fetch on mount

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-7 h-7" />
              Missing EOD Reports
            </h2>
            <p className="text-red-100">Dates with no uploaded reports</p>
          </div>
          <button
            onClick={fetchMissingEOD}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading missing reports...</p>
        </div>
      ) : (
        <>
          {/* Missing Count Banner */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Missing Reports</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{missingData.total_missing}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-blue-600 font-medium">ECMP: {missingData.ecmp.length}</span>
                  <span className="text-purple-600 font-medium">UC: {missingData.uc.length}</span>
                </div>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* ECMP Missing Reports */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">ECMP</span>
                Missing Reports
              </h3>
              <p className="text-sm text-gray-600 mt-1">ECMP reports that have not been uploaded ({missingData.ecmp.length})</p>
            </div>

            {missingData.ecmp.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">All ECMP Reports Uploaded!</p>
                <p className="text-gray-600">No missing ECMP EOD reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missingData.ecmp.map((item, index) => (
                      <tr key={`ecmp-${item.date}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ECMP
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* UC Missing Reports */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm">UC</span>
                Missing Reports
              </h3>
              <p className="text-sm text-gray-600 mt-1">UC reports that have not been uploaded ({missingData.uc.length})</p>
            </div>

            {missingData.uc.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">All UC Reports Uploaded!</p>
                <p className="text-gray-600">No missing UC EOD reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missingData.uc.map((item, index) => (
                      <tr key={`uc-${item.date}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            UC
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          {missingData.total_missing > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl">
              <p className="text-sm">
                <strong>Action Required:</strong> Please upload the missing EOD reports as soon as possible. Go to the Working Day page to upload your reports.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
