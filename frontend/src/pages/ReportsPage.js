import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function ReportsPage() {
  const { user, logout } = useAuth();
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

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(20);
    doc.text('تقارير العملاء', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, 105, 30, { align: 'center' });
    
    // Prepare data
    const tableData = filteredReports.map(report => [
      report.client.name,
      report.client.phone,
      report.client.location,
      report.invoiceCount.toString(),
      report.balance
    ]);
    
    doc.autoTable({
      startY: 40,
      head: [['العميل', 'الهاتف', 'المكان', 'عدد الفواتير', 'الرصيد الكلي']],
      body: tableData,
      styles: { font: 'helvetica', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [102, 126, 234], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    const date = new Date().toISOString().split('T')[0];
    doc.save(`تقارير_العملاء_${date}.pdf`);
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="top" style={{ background: 'var(--color-card-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="brand flex items-center gap-4">
            <div className="logo">غ</div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>التقارير</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                ملخص أرصدة العملاء + فواتيرهم
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {user?.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {user?.role === 'admin' ? 'مدير' : 'موظف'}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link to="/" className="btn btn-ghost">
                ← العملاء
              </Link>
              <button onClick={exportToExcel} className="btn btn-primary">
                📄 Excel (الكل)
              </button>
              <button onClick={logout} className="btn btn-danger">
                تسجيل خروج
              </button>
            </div>
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
