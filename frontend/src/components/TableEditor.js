import React, { useState, useEffect } from 'react';

function TableEditor({ 
  tableData, 
  onDataChange, 
  currency,
  tableId 
}) {
  const [data, setData] = useState(tableData);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);

  useEffect(() => {
    setData(tableData);
  }, [tableData]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = { ...data };
    newData.rows[rowIndex][colIndex] = value;
    setData(newData);
    onDataChange(newData);
  };

  const addRow = () => {
    const newData = { ...data };
    const colCount = newData.headerTitles.length;
    const newRow = Array(colCount).fill('');
    newRow[newRow.length - 1] = `0${currency}`;
    newData.rows.push(newRow);
    setData(newData);
    onDataChange(newData);
  };

  const deleteRow = () => {
    if (selectedRow === null || data.rows.length <= 1) return;
    
    const newData = { ...data };
    newData.rows.splice(selectedRow, 1);
    setData(newData);
    setSelectedRow(null);
    onDataChange(newData);
  };

  const addColumn = () => {
    const colName = prompt('اسم العمود الجديد؟', 'عمود جديد');
    if (!colName) return;

    const newData = { ...data };
    const insertIndex = newData.headerTitles.length - 1; // Before amount column
    
    newData.headerTitles.splice(insertIndex, 0, colName);
    newData.rows = newData.rows.map(row => {
      const newRow = [...row];
      newRow.splice(insertIndex, 0, '');
      return newRow;
    });
    
    setData(newData);
    onDataChange(newData);
  };

  const deleteColumn = () => {
    if (selectedCol === null || selectedCol === 0 || selectedCol === data.headerTitles.length - 1) {
      alert('لا يمكن حذف عمود الرقم أو المبلغ');
      return;
    }
    
    if (data.headerTitles.length <= 6) {
      alert('لا يمكن حذف المزيد من الأعمدة');
      return;
    }

    const newData = { ...data };
    newData.headerTitles.splice(selectedCol, 1);
    newData.rows = newData.rows.map(row => {
      const newRow = [...row];
      newRow.splice(selectedCol, 1);
      return newRow;
    });
    
    setData(newData);
    setSelectedCol(null);
    onDataChange(newData);
  };

  const calculateTotal = () => {
    let total = 0;
    data.rows.forEach(row => {
      const amountStr = row[row.length - 1] || '0';
      const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;
      total += amount;
    });
    return total;
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap no-print">
        <button onClick={addRow} className="btn btn-primary text-sm">
          + سطر
        </button>
        <button onClick={deleteRow} className="btn btn-danger text-sm">
          حذف السطر المحدد
        </button>
        <button onClick={addColumn} className="btn btn-primary text-sm">
          + عمود
        </button>
        <button onClick={deleteColumn} className="btn btn-danger text-sm">
          حذف العمود المحدد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {data.headerTitles.map((title, index) => (
                <th
                  key={index}
                  onClick={() => setSelectedCol(index)}
                  className={`p-3 bg-gray-100 border border-gray-300 cursor-pointer ${
                    selectedCol === index ? 'bg-blue-200' : ''
                  }`}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={selectedRow === rowIndex ? 'bg-yellow-100' : ''}
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    onClick={() => {
                      setSelectedRow(rowIndex);
                      setSelectedCol(colIndex);
                    }}
                    className={`p-2 border border-gray-300 ${
                      selectedCol === colIndex ? 'bg-blue-100' : ''
                    } ${colIndex === 0 ? 'bg-gray-50' : ''}`}
                  >
                    {colIndex === 0 ? (
                      <span className="font-medium">{rowIndex + 1}</span>
                    ) : (
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className={`w-full bg-transparent border-none outline-none p-1 ${
                          colIndex === row.length - 1 ? 'font-semibold text-green-700' : ''
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td
                colSpan={data.headerTitles.length - 1}
                className="p-3 border border-gray-300 text-right"
              >
                {tableId === 't1' ? 'إجمالي العمليات' : 'مجموع القبوضات'}
              </td>
              <td className="p-3 border border-gray-300 text-green-700">
                {calculateTotal()}{currency}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default TableEditor;
