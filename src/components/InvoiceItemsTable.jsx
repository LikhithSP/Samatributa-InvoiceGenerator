import React, { useState } from 'react';

const InvoiceItemsTable = ({ items, setItems, exchangeRate, currency }) => {
  const [itemBeingEdited, setItemBeingEdited] = useState(null);
  // Add state to track the input values as they're being entered
  const [inputValues, setInputValues] = useState({});

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
    
    // Clean up inputValues for the removed item
    const newInputValues = { ...inputValues };
    delete newInputValues[`${index}-amountUSD`];
    delete newInputValues[`${index}-amountINR`];
    setInputValues(newInputValues);
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

  // Handle focus on amount input fields
  const handleAmountFocus = (index, field) => {
    const key = `${index}-${field}`;
    // When focusing on the field, set the input value to the raw number (without .toFixed(2))
    // This will allow users to freely edit the value
    setInputValues({
      ...inputValues,
      [key]: items[index][field].toString()
    });
  };

  // Handle blur on amount input fields
  const handleAmountBlur = (index, field) => {
    // When blurring, update the actual item with the parsed value
    const key = `${index}-${field}`;
    const value = inputValues[key] || '0';
    handleItemChange(index, field, value);
    
    // Clean up the temporary input value
    const newInputValues = { ...inputValues };
    delete newInputValues[key];
    setInputValues(newInputValues);
  };

  // Handle change in amount input fields during typing
  const handleAmountInputChange = (index, field, value) => {
    // Store the raw input value while typing
    setInputValues({
      ...inputValues,
      [`${index}-${field}`]: value
    });
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

  // Get the display value for an amount field
  const getAmountDisplayValue = (index, field) => {
    const key = `${index}-${field}`;
    if (key in inputValues) {
      // If the user is currently editing this field, show the raw input
      return inputValues[key];
    } else {
      // Otherwise show the formatted value with 2 decimal places
      return items[index][field].toFixed(2);
    }
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
                    type="text"
                    className="item-total-usd"
                    value={getAmountDisplayValue(index, 'amountUSD')}
                    onChange={(e) => handleAmountInputChange(index, 'amountUSD', e.target.value)}
                    onFocus={() => handleAmountFocus(index, 'amountUSD')}
                    onBlur={() => handleAmountBlur(index, 'amountUSD')}
                    placeholder="Amount (USD)"
                    disabled={currency === 'INR'}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="item-total-inr"
                    value={getAmountDisplayValue(index, 'amountINR')}
                    onChange={(e) => handleAmountInputChange(index, 'amountINR', e.target.value)}
                    onFocus={() => handleAmountFocus(index, 'amountINR')}
                    onBlur={() => handleAmountBlur(index, 'amountINR')}
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