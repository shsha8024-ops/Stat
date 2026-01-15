import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    currency: '$'
  });
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('خطأ في تحميل العملاء');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.location) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/clients`, formData);
      setFormData({ name: '', phone: '', location: '', currency: '$' });
      loadClients();
      alert('تم إضافة العميل بنجاح');
    } catch (error) {
      console.error('Error creating client:', error);
      alert('خطأ في إضافة العميل');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API_URL}/api/clients/${editingClient.id}`, {
        name: editingClient.name,
        phone: editingClient.phone,
        location: editingClient.location,
        currency: editingClient.currency
      });
      setShowEditModal(false);
      setEditingClient(null);
      loadClients();
      alert('تم تحديث العميل بنجاح');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('خطأ في تحديث العميل');
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

    try {
      await axios.delete(`${API_URL}/api/clients/${clientId}`);
      loadClients();
      setShowEditModal(false);
      alert('تم حذف العميل بنجاح');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('خطأ في حذف العميل');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/backup`);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('خطأ في إنشاء النسخة الاحتياطية');
    }
  };

  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!window.confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات الحالية واستبدالها بالنسخة الاحتياطية.')) return;
        
        await axios.post(`${API_URL}/api/restore`, data);
        loadClients();
        alert('تم استعادة النسخة الاحتياطية بنجاح');
      } catch (error) {
        console.error('Error restoring backup:', error);
        alert('خطأ في استعادة النسخة الاحتياطية');
      }
    };
    input.click();
  };

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      client.location.toLowerCase().includes(query)
    );
  });

  const getClientBalance = (client) => {
    // This will be calculated in the backend reports endpoint
    return '0' + client.currency;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="top bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="brand flex items-center gap-4">
            <div className="logo">غ</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">الغدير نقل و تخليص</h1>
              <p className="text-sm text-gray-600">إدارة العملاء + فواتير متعددة لكل عميل</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleBackup} className="btn btn-ghost">
              تنزيل نسخة احتياط
            </button>
            <button onClick={handleRestore} className="btn btn-ghost">
              استيراد نسخة
            </button>
            <Link to="/reports" className="btn btn-primary">
              التقارير
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <section className="lg:col-span-2 card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">العملاء</h2>
                <p className="text-sm text-gray-500">اضغط "معلومات العميل" لفتح فواتيره</p>
              </div>
              <div className="flex gap-3 items-center">
                <span className="pill">العملاء: {filteredClients.length}</span>
                <input
                  type="text"
                  placeholder="بحث بالاسم/الهاتف/المكان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-64"
                />
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا يوجد عملاء. أضف عميل من النموذج.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>الهاتف</th>
                      <th>المكان</th>
                      <th>العملة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td className="font-medium">{client.name}</td>
                        <td>{client.phone}</td>
                        <td>{client.location}</td>
                        <td>
                          <span className="pill">{client.currency}</span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              to={`/invoice/${client.id}`}
                              className="btn btn-primary text-sm"
                            >
                              معلومات العميل
                            </Link>
                            <button
                              onClick={() => {
                                setEditingClient(client);
                                setShowEditModal(true);
                              }}
                              className="btn btn-ghost text-sm"
                            >
                              تعديل
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Add Client Form */}
          <section className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إضافة عميل</h2>
              <button
                onClick={() => setFormData({ name: '', phone: '', location: '', currency: '$' })}
                className="btn btn-ghost text-sm"
              >
                مسح
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل
                </label>
                <input
                  type="text"
                  placeholder="مثال: أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  placeholder="مثال: 0770xxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المكان
                </label>
                <input
                  type="text"
                  placeholder="مثال: بغداد - الكرادة"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العملة
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="$">$</option>
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full">
                إضافة
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingClient && (
        <div className="overlay" onClick={() => setShowEditModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">تعديل العميل</h2>
                <p className="text-sm text-gray-500 mt-1">
                  تعديل معلومات {editingClient.name}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-ghost"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل
                </label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المكان
                </label>
                <input
                  type="text"
                  value={editingClient.location}
                  onChange={(e) => setEditingClient({ ...editingClient, location: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العملة
                </label>
                <select
                  value={editingClient.currency}
                  onChange={(e) => setEditingClient({ ...editingClient, currency: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="$">$</option>
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(editingClient.id)}
                  className="btn btn-danger flex-1"
                >
                  حذف العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;
