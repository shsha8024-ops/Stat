import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports`);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('خطأ في تحميل التقارير');
    }
  };

  const exportToExcel = () => {
    const data = filteredReports.map(report => ({
      'العميل': report.client.name,
      'الهاتف': report.client.phone,
      'المكان': report.client.location,
      'عدد الفواتير': report.invoiceCount,
      'الرصيد الكلي': report.balance
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقارير');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `تقارير_العملاء_${date}.xlsx`);
  };

  const filteredReports = reports.filter(report => {
    const query = searchQuery.toLowerCase();
    return (
      report.client.name.toLowerCase().includes(query) ||
      report.client.phone.toLowerCase().includes(query) ||
      report.client.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="top bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="brand flex items-center gap-4">
            <div className="logo">غ</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
              <p className="text-sm text-gray-600">ملخص أرصدة العملاء + فواتيرهم</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link to="/" className="btn btn-ghost">
              ← العملاء
            </Link>
            <button onClick={exportToExcel} className="btn btn-primary">
              📄 Excel (الكل)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ملخص العملاء</h2>
              <p className="text-sm text-gray-500">
                الرصيد = مجموع(العمليات) - مجموع(القبوضات)
              </p>
            </div>
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-lg px-4 py-2 w-80"
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              لا توجد تقارير متاحة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>الهاتف</th>
                    <th>المكان</th>
                    <th>عدد الفواتير</th>
                    <th>الرصيد الكلي</th>
                    <th>فتح</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.client.id}>
                      <td className="font-medium">{report.client.name}</td>
                      <td>{report.client.phone}</td>
                      <td>{report.client.location}</td>
                      <td>
                        <span className="pill">{report.invoiceCount}</span>
                      </td>
                      <td className="font-semibold text-green-700">
                        {report.balance}
                      </td>
                      <td>
                        <Link
                          to={`/invoice/${report.client.id}`}
                          className="btn btn-primary text-sm"
                        >
                          فتح الفواتير
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ReportsPage;
