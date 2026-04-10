import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';

export default function Home({ user }) {
  const navigate = useNavigate();

  const reportTypes = [
    {
      id: 'ecmp',
      title: 'ECMP Report',
      description: 'Upload and process ECMP EOD reports with serial number validation',
      color: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:from-blue-700 hover:to-indigo-700',
      icon: FileText,
      path: '/ecmp-report'
    },
    {
      id: 'uc',
      title: 'UC Report',
      description: 'Upload and process UC EOD reports with type "N" enrollment',
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'hover:from-purple-700 hover:to-pink-700',
      icon: FileText,
      path: '/uc-report'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">EOD Report Upload</h2>
        <p className="text-indigo-100">Select the type of report you want to upload</p>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => navigate(report.path)}
            className={`bg-gradient-to-r ${report.color} ${report.hoverColor} text-white rounded-xl p-8 shadow-lg transition-all transform hover:scale-105 text-left group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 bg-white/20 rounded-lg`}>
                <report.icon className="w-8 h-8" />
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">{report.title}</h3>
            <p className="text-white/90 text-sm">{report.description}</p>
            
            <div className="mt-6 flex items-center gap-2 text-sm font-medium">
              <span>Upload Report</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl">
        <h3 className="font-semibold mb-2">Report Types:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>ECMP Report:</strong> Standard enrollment report with Type "E" for new enrollments and serial number validation</li>
          <li>• <strong>UC Report:</strong> UC enrollment report with Type "N" for new enrollments</li>
        </ul>
      </div>
    </div>
  );
}
