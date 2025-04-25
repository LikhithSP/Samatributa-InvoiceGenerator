import React, { useState } from 'react';

const InvoiceItemsTable = ({ items, setItems, exchangeRate, currency }) => {
  const [itemBeingEdited, setItemBeingEdited] = useState(null);

  // Add a new empty item to the list
  const addItem = () => {
    setItems([
      ...items,
      {
        name: '',
        description: '',
        amountUSD: 0,
        amountINR: 0,
        nestedRows: []
      }
    ]);
  };

  // Remove an item at the specified index
  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  // Add a nested description row to an item
  const addNestedRow = (index) => {
    const updatedItems = [...items];
    if (!updatedItems[index].nestedRows) {
      updatedItems[index].nestedRows = [];
    }
    updatedItems[index].nestedRows.push('');
    setItems(updatedItems);
  };

  // Update nested row text
  const updateNestedRow = (itemIndex, rowIndex, text) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].nestedRows[rowIndex] = text;
    setItems(updatedItems);
  };

  // Remove a nested row
  const removeNestedRow = (itemIndex, rowIndex) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].nestedRows.splice(rowIndex, 1);
    setItems(updatedItems);
  };

  // Handle change of item fields
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    
    // Handle text fields and number fields differently
    if (field === 'name' || field === 'description') {
      // For text fields, store the string value directly
      updatedItems[index][field] = value;
    } else {
      // For amount fields, convert the input value to a number
      const numericValue = parseFloat(value) || 0;
      updatedItems[index][field] = numericValue;

      // If amount fields are updated, calculate the other currency equivalent
      if (field === 'amountUSD') {
        updatedItems[index].amountINR = numericValue * exchangeRate;
      } else if (field === 'amountINR') {
        updatedItems[index].amountUSD = numericValue / exchangeRate;
      }
    }

    setItems(updatedItems);
  };

  return (
    <div className="invoice-items-table">
      <table>
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Item</th>
            <th style={{ width: '40%' }}>Description</th>
            <th style={{ width: '15%' }}>Amount (USD)</th>
            <th style={{ width: '15%' }}>Amount (INR)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <tr className="item-row">
                <td rowSpan={item.nestedRows?.length ? item.nestedRows.length + 1 : 1}>
                  <input
                    type="text"
                    className="item-name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder="Item name"
                  />
                  <button
                    className="btn btn-secondary add-nested-row"
                    onClick={() => addNestedRow(index)}
                    style={{ marginTop: '5px', fontSize: '12px', padding: '5px 10px' }}
                  >
                    Add Description
                  </button>
                </td>
                <td>
                  <textarea
                    className="item-description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                  ></textarea>
                </td>
                <td>
                  <input
                    type="number"
                    className="item-total-usd"
                    value={item.amountUSD.toFixed(2)}
                    onChange={(e) => handleItemChange(index, 'amountUSD', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Amount (USD)"
                    disabled={currency === 'INR'}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="item-total-inr"
                    value={item.amountINR.toFixed(2)}
                    onChange={(e) => handleItemChange(index, 'amountINR', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Amount (INR)"
                    disabled={currency === 'USD'}
                  />
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() => removeItem(index)}
                    title="Remove item"
                  >
                    ❌
                  </button>
                </td>
              </tr>
              
              {/* Nested description rows */}
              {item.nestedRows?.map((row, rowIndex) => (
                <tr key={`${index}-${rowIndex}`} className="nested-row">
                  <td colSpan={2}>
                    <div style={{ display: 'flex' }}>
                      <input
                        type="text"
                        value={row}
                        onChange={(e) => updateNestedRow(index, rowIndex, e.target.value)}
                        placeholder="Additional description"
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn-icon"
                        onClick={() => removeNestedRow(index, rowIndex)}
                        title="Remove description"
                        style={{ marginLeft: '5px' }}
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={addItem} className="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Item
        </button>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;