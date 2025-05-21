import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Pagination from './Pagination';
import { BiSearchAlt2, BiSortAlt2, BiSortDown, BiSortUp } from 'react-icons/bi';
import TableLoader from './TableLoader';
import DatePicker from '../date/DatePicker';

const ALIGNMENT_CLASSES = {
  right: 'text-end',
  center: 'text-center',
  start: 'text-start',
};

const CommonTable = ({ setStartDate, setEndDate, data, columns, align = 'start', loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentData, setCurrentData] = useState([]);

  // Get alignment class for a column
  const getAlignmentClass = useCallback(
    (columnAlign) => ALIGNMENT_CLASSES[columnAlign || align] || 'text-start',
    [align]
  );

  // Sorting data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null, undefined, or empty string values
      if (aValue == null || aValue === '') return 1;
      if (bValue == null || bValue === '') return -1;

      // Determine the type of the values
      const aType = typeof aValue;
      const bType = typeof bValue;

      // Sort based on types
      if (aType === 'number' && bType === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      } else if (aType === 'string' && bType === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
          : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        // For mixed types, convert to string and compare
        const aString = String(aValue);
        const bString = String(bValue);
        return sortConfig.direction === 'ascending'
          ? aString.localeCompare(bString, undefined, { numeric: true, sensitivity: 'base' })
          : bString.localeCompare(aString, undefined, { numeric: true, sensitivity: 'base' });
      }
    });
  }, [data, sortConfig]);

  // Filtering data based on searchTerm
  const filteredData = useMemo(() => {
    return sortedData?.filter((item) =>
      columns.some((column) => String(item[column.accessor]).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedData, columns, searchTerm]);

  // Update the current page whenever searchTerm, or sortConfig changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  useEffect(() => {
    // Reset the search term when new data is fetched
    setSearchTerm('');
    // Reset pagination to the first page when new data is fetched
    setCurrentPage(1);
  }, [data]);

  // Handle sorting request
  const requestSort = useCallback((key, sorting) => {
    if (sorting === false) return;

    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        if (prevConfig.direction === 'ascending') {
          return { key, direction: 'descending' };
        } else if (prevConfig.direction === 'descending') {
          return { key: null, direction: null };
        }
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  // Render sorting icon
  const renderSortIcon = useCallback(
    (accessor) => {
      if (sortConfig.key !== accessor) return <BiSortAlt2 className="h-5 w-5" />;
      return sortConfig.direction === 'ascending' ? (
        <BiSortDown className="h-5 w-5" />
      ) : (
        <BiSortUp className="h-5 w-5" />
      );
    },
    [sortConfig]
  );

  // Render table headers
  const renderHeaders = useCallback(() => {
    return columns.map(({ label, accessor, align: columnAlign, sorting }) => (
      <th
        key={accessor}
        scope="col"
        className={`p-2 capitalize text-xs md:text-sm 3xl:text-base whitespace-nowrap font-semibold text-[#3A3A3A] dark:text-white ${getAlignmentClass(
          columnAlign
        )}`}
      >
        <div
          className={`flex items-center ${sorting === false ? '' : 'cursor-pointer'} w-max`}
          onClick={() => requestSort(accessor, sorting)}
        >
          {label}
          <> {sorting !== false && <span className="ml-1">{renderSortIcon(accessor)}</span>}</>
        </div>
      </th>
    ));
  }, [columns, getAlignmentClass, requestSort, renderSortIcon]);

  // Render individual table cells
  const renderCell = useCallback(
    (value, row, rowIndex, colIndex, { accessor, render, align: columnAlign }) => {
      const isEmptyValue =
        value === undefined || value === null || value === '' || value === 'undefined' || value === 'null';
      const renderedValue = render ? render(value, row, rowIndex, colIndex) : isEmptyValue ? '-' : value;

      return (
        <td
          key={`${rowIndex}-${accessor}`}
          className={`p-2 text-xs md:text-sm 3xl:text-base whitespace-nowrap text-[#3A3A3A] dark:text-white capitalize ${getAlignmentClass(
            columnAlign
          )}`}
        >
          {renderedValue}
        </td>
      );
    },
    [getAlignmentClass]
  );

  // Render table rows
  const renderRows = useCallback(() => {
    return currentData.map((row, rowIndex) => (
      <tr key={rowIndex}>
        {columns.map((column, colIndex) => renderCell(row[column.accessor], row, rowIndex, colIndex, column))}
      </tr>
    ));
  }, [columns, currentData, renderCell]);

  return (
    <>
      <div className="space-y-4 bg-white shadow-md md:p-3 p-2 rounded-md dark:bg-[#1F1F1F]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center md:gap-4">
          <DatePicker setStartDate={setStartDate} setEndDate={setEndDate} />
          <div className="relative">
            <BiSearchAlt2 className="absolute top-[50%] left-2 transform -translate-y-1/2 text-xl text-gray-500 dark:text-white" />
            <input
              name="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              aria-label="Search"
              className="input-box !pl-8 !py-2"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <TableLoader />
          ) : (
            <table className="min-w-full divide-y divide-[#DDDDDD] dark:divide-[#3B3B3B] border-[#ddd] border dark:border-[#333] rounded-lg">
              <thead className="bg-[#ecf3f9] dark:bg-[#00498E]">
                <tr>{renderHeaders()}</tr>
              </thead>
              <tbody className="bg-white dark:bg-[#080E1C] divide-y divide-[#DDDDDD] dark:divide-[#3B3B3B]">
                {filteredData?.length > 0 ? (
                  renderRows()
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-4 dark:text-white">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {filteredData?.length > 0 ? (
          <Pagination
            setCurrentData={setCurrentData}
            currentData={currentData}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            data={filteredData}
          />
        ) : (
          ''
        )}
      </div>
    </>
  );
};

export default CommonTable;
