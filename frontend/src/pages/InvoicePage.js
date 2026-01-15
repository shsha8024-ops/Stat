import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import TableEditor from '../components/TableEditor';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function InvoicePage() {
  const { clientId } = useParams();
  const { user, logout, isAdmin } = useAuth();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [statement, setStatement] = useState(null);
  const [activeTab, setActiveTab] = useState('ops');
  const [invoiceDate, setInvoiceDate] = useState('');

  useEffect(() => {
    loadClient();
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (invoices.length > 0 && !activeInvoice) {
      setActiveInvoice(invoices[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  useEffect(() => {
    if (activeInvoice) {
      loadStatement(activeInvoice.id);
    }
  }, [activeInvoice]);

  const loadClient = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error('Error loading client:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients/${clientId}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadStatement = async (invoiceId) => {
    try {
      const response = await axios.get(`${API_URL}/api/invoices/${invoiceId}/statement`);
      setStatement(response.data);
      setInvoiceDate(response.data.meta?.date || '');
    } catch (error) {
      console.error('Error loading statement:', error);
    }
  };

  const saveStatement = async (newData) => {
    if (!activeInvoice) return;

    try {
      await axios.put(`${API_URL}/api/invoices/${activeInvoice.id}/statement`, newData);
    } catch (error) {
      console.error('Error saving statement:', error);
    }
  };

  const handleT1Change = (newData) => {
    const updated = { ...statement, t1: newData };
    setStatement(updated);
    saveStatement(updated);
  };

  const handleT2Change = (newData) => {
    const updated = { ...statement, t2: newData };
    setStatement(updated);
    saveStatement(updated);
  };

  const handleDateChange = async (newDate) => {
    setInvoiceDate(newDate);
    const updated = { 
      ...statement, 
      meta: { ...statement.meta, date: newDate } 
    };
    setStatement(updated);
    saveStatement(updated);

    // Update invoice date
    try {
      await axios.put(`${API_URL}/api/invoices/${activeInvoice.id}`, { date: newDate });
      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice date:', error);
    }
  };

  const createNewInvoice = async () => {
    const name = prompt('اسم الفاتورة/الكشف؟', `فاتورة ${invoices.length + 1}`);
    if (!name) return;

    const date = prompt('تاريخ الفاتورة (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
    if (!date) return;

    try {
      const response = await axios.post(`${API_URL}/api/clients/${clientId}/invoices`, {
        name,
        date,
        clientId
      });
      
      loadInvoices();
      setActiveInvoice(response.data);
      alert('تم إنشاء الفاتورة بنجاح');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('خطأ في إنشاء الفاتورة');
    }
  };

  const renameInvoice = async () => {
    if (!activeInvoice) return;

    const name = prompt('اسم جديد:', activeInvoice.name);
    if (!name) return;

    try {
      await axios.put(`${API_URL}/api/invoices/${activeInvoice.id}`, { name });
      loadInvoices();
      setActiveInvoice({ ...activeInvoice, name });
      alert('تم تغيير الاسم بنجاح');
    } catch (error) {
      console.error('Error renaming invoice:', error);
      alert('خطأ في تغيير الاسم');
    }
  };

  const deleteInvoice = async () => {
    if (!activeInvoice) return;

    if (!window.confirm(`حذف "${activeInvoice.name}"؟`)) return;

    try {
      await axios.delete(`${API_URL}/api/invoices/${activeInvoice.id}`);
      loadInvoices();
      alert('تم حذف الفاتورة بنجاح');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('خطأ في حذف الفاتورة');
    }
  };

  const calculateTotal = (tableData) => {
    if (!tableData || !tableData.rows) return 0;
    
    let total = 0;
    tableData.rows.forEach(row => {
      const amountStr = row[row.length - 1] || '0';
      const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;
      total += amount;
    });
    return total;
  };

  const exportToExcel = () => {
    if (!statement || !activeInvoice || !client) return;

    const wb = XLSX.utils.book_new();

    // Operations sheet
    const opsData = [
      statement.t1.headerTitles,
      ...statement.t1.rows,
      ['', '', '', '', 'إجمالي العمليات', `${calculateTotal(statement.t1)}${client.currency}`]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(opsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'العمليات');

    // Payments sheet
    const payData = [
      statement.t2.headerTitles,
      ...statement.t2.rows,
      ['', '', '', '', 'مجموع القبوضات', `${calculateTotal(statement.t2)}${client.currency}`]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(payData);
    XLSX.utils.book_append_sheet(wb, ws2, 'القبوضات');

    // Final sheet
    const t1Total = calculateTotal(statement.t1);
    const t2Total = calculateTotal(statement.t2);
    const balance = t1Total - t2Total;
    
    const finalData = [
      ['البند', 'القيمة'],
      ['إجمالي العمليات', `${t1Total}${client.currency}`],
      ['مجموع القبوضات', `${t2Total}${client.currency}`],
      ['الرصيد النهائي', `${balance}${client.currency}`]
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(finalData);
    XLSX.utils.book_append_sheet(wb, ws3, 'الحساب النهائي');

    XLSX.writeFile(wb, `فاتورة_${client.name}_${activeInvoice.name}_${invoiceDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!client || !activeInvoice || !statement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const t1Total = calculateTotal(statement.t1);
  const t2Total = calculateTotal(statement.t2);
  const balance = t1Total - t2Total;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="top no-print" style={{ background: 'var(--color-card-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="brand flex items-center gap-4">
            <div className="logo">غ</div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>فواتير العميل</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {client.name} — {client.phone} — {client.location}
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
              <Link to="/reports" className="btn btn-ghost">
                التقارير
              </Link>
              <button onClick={logout} className="btn btn-danger">
                تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="card no-print">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">الفواتير</h2>
              <span className="pill">{invoices.length}</span>
            </div>

            {isAdmin() && (
              <div className="flex flex-col gap-2 mb-4">
                <button onClick={createNewInvoice} className="btn btn-primary w-full text-sm">
                  + فاتورة
                </button>
                <button onClick={renameInvoice} className="btn btn-ghost w-full text-sm">
                  تغيير اسم
                </button>
                <button onClick={deleteInvoice} className="btn btn-danger w-full text-sm">
                  حذف
                </button>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار فاتورة
            </label>
            <select
              value={activeInvoice?.id || ''}
              onChange={(e) => {
                const inv = invoices.find(i => i.id === e.target.value);
                setActiveInvoice(inv);
              }}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} — {inv.date}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => setActiveInvoice(inv)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    activeInvoice.id === inv.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-sm">{inv.name}</div>
                  <div className="text-xs text-gray-500">تاريخ: {inv.date}</div>
                </div>
              ))}
            </div>

            <hr className="my-6" />

            <button onClick={exportToExcel} className="btn btn-ghost w-full text-sm">
              📄 Excel (كل فواتير العميل)
            </button>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3 card">
            <div className="flex justify-between items-center mb-6 no-print">
              <div className="flex gap-3">
                <span className="pill">فاتورة: <b>{activeInvoice.name}</b></span>
                <span className="pill">العملة: <b>{client.currency}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">التاريخ:</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">وصل قبض + كشف حساب</h2>
            <p className="text-center text-gray-600 mb-6">
              الغدير نقل و تخليص — {client.name} — {activeInvoice.name}
            </p>

            <div className="flex gap-2 mb-6 no-print">
              <button onClick={handlePrint} className="btn btn-ghost text-sm">
                🖨️ طباعة
              </button>
              <button onClick={exportToExcel} className="btn btn-ghost text-sm">
                📄 Excel
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs mb-6 no-print">
              <button
                className={`tab-btn ${activeTab === 'ops' ? 'active' : ''}`}
                onClick={() => setActiveTab('ops')}
              >
                العمليات
              </button>
              <button
                className={`tab-btn ${activeTab === 'pay' ? 'active' : ''}`}
                onClick={() => setActiveTab('pay')}
              >
                القبوضات
              </button>
              <button
                className={`tab-btn ${activeTab === 'final' ? 'active' : ''}`}
                onClick={() => setActiveTab('final')}
              >
                الحساب النهائي
              </button>
            </div>

            {/* Operations Tab */}
            {activeTab === 'ops' && (
              <div className="tab-content active">
                <h3 className="text-lg font-bold mb-4">العمليات</h3>
                {statement && statement.t1 && (
                  <TableEditor
                    tableData={statement.t1}
                    onDataChange={handleT1Change}
                    currency={client.currency}
                    tableId="t1"
                    readOnly={!isAdmin()}
                  />
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'pay' && (
              <div className="tab-content active">
                <h3 className="text-lg font-bold mb-4">القبوضات</h3>
                {statement && statement.t2 && (
                  <TableEditor
                    tableData={statement.t2}
                    onDataChange={handleT2Change}
                    currency={client.currency}
                    tableId="t2"
                    readOnly={!isAdmin()}
                  />
                )}
              </div>
            )}

            {/* Final Tab */}
            {activeTab === 'final' && (
              <div className="tab-content active">
                <h3 className="text-lg font-bold mb-4">الحساب النهائي</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <th className="p-3 text-right bg-gray-100">إجمالي العمليات</th>
                      <td className="p-3 font-semibold text-green-700">
                        {t1Total}{client.currency}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <th className="p-3 text-right bg-gray-100">مجموع القبوضات</th>
                      <td className="p-3 font-semibold text-red-700">
                        {t2Total}{client.currency}
                      </td>
                    </tr>
                    <tr>
                      <th className="p-3 text-right bg-gray-100 font-bold">الرصيد النهائي</th>
                      <td className="p-3 font-bold text-blue-700 text-xl">
                        {balance}{client.currency}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between mt-12 pt-8 border-t">
                  <div className="text-center">
                    <div className="mb-2 text-gray-600">توقيع المستلم</div>
                    <div className="border-t border-gray-400 w-48 pt-2">____________</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 text-gray-600">توقيع المحاسب</div>
                    <div className="border-t border-gray-400 w-48 pt-2">____________</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 mt-6">
              حفظ تلقائي لكل فاتورة في قاعدة البيانات.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InvoicePage;
