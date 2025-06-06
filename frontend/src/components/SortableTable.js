import React, { useState } from 'react';

const SortableTable = ({ columns, data, defaultSortColumn = null }) => {
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortColumn,
    direction: 'ascending'
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (name) => {
    if (!sortConfig.key) {
      return '';
    }
    return sortConfig.key === name ? sortConfig.direction : '';
  };

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  return (
    <table className="sortable-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th 
              key={column.key} 
              onClick={() => requestSort(column.key)}
              className="sortable-header"
            >
              {column.label}
              {getSortDirection(column.key) && (
                <span className={`sort-icon ${getSortDirection(column.key)}`}></span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((item, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key}>
                {column.render ? column.render(item) : item[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SortableTable;