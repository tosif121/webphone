import React, { useEffect, useMemo, useState } from 'react';
import { DOTS, usePagination } from '../../hooks/usePagination';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';

const Pagination = ({ setCurrentData, data, currentData, currentPage, setCurrentPage }) => {
  const totalCount = data?.length || 0;
  const [pageSize, setPageSize] = useState(10);

  const PAGE_OPTIONS = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];
  const paginationRange = usePagination({ currentPage, totalCount, pageSize });

  const currentTableData = useMemo(() => {
    if (!data) return [];
    const firstPageIndex = (currentPage - 1) * pageSize;
    const lastPageIndex = firstPageIndex + pageSize;
    return data.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, data, pageSize]);

  useEffect(() => {
    setCurrentData(currentTableData);
  }, [currentTableData, setCurrentData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, totalCount, setCurrentPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const lastPage = paginationRange ? paginationRange[paginationRange.length - 1] : 0;
  const numFirst = (currentPage - 1) * pageSize + 1;
  const numLast = Math.min(numFirst + currentData.length - 1, totalCount);

  return (
    <div className="flex justify-center md:justify-between items-center flex-wrap gap-4">
      {renderEntriesInfo(currentData, numFirst, numLast, totalCount)}
      <ul className="flex justify-end gap-2 items-center">
        <li className="flex items-center gap-x-2">
          <span className="text-sm text-gray-900 dark:text-white">Show</span>
          <select
            name="pageSize"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="outline-none border p-1 rounded-md cursor-pointer dark:bg-[#080E1C] dark:text-white dark:border-[#999] border-[#ddd]"
          >
            {PAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-900 dark:text-white">Entries</span>
        </li>

        {renderPrevButton(currentPage, handlePageChange)}
        {renderPaginationItems(paginationRange, currentPage, handlePageChange)}
        {renderNextButton(currentPage, lastPage, handlePageChange)}
      </ul>
    </div>
  );
};

const renderEntriesInfo = (currentData, numFirst, numLast, totalCount) => {
  if (currentData.length === 0) return null;
  return (
    <p className="text-[#333333] dark:text-white md:text-base text-xs">
      Showing {numFirst}-{numLast} of {totalCount} Entries
    </p>
  );
};

const renderPrevButton = (currentPage, onPageChange) => (
  <PaginationButton
    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
    disabled={currentPage === 1}
    icon={BiChevronLeft}
    text="Prev"
  />
);

const renderNextButton = (currentPage, lastPage, onPageChange) => (
  <PaginationButton
    onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
    disabled={currentPage === lastPage}
    icon={BiChevronRight}
    text="Next"
    iconAfter
  />
);

const PaginationButton = ({ onClick, disabled, icon, text, iconAfter = false }) => (
  <li
    className={`flex items-center gap-3 py-1 px-3 text-[#333333] transition duration-200 ease-in font-medium dark:text-white md:text-base text-xs cursor-pointer ${
      disabled
        ? 'text-slate-300 dark:text-slate-600'
        : 'hover:text-[#4399EB] hover:bg-[#ECF5FE] dark:hover:bg-[#080E1C] hover:rounded dark:hover:text-[#1d5ab5]'
    }`}
    onClick={onClick}
  >
    {!iconAfter && icon}
    <span className="hidden md:inline-block">{text}</span>
    {iconAfter && icon}
  </li>
);

const renderPaginationItems = (paginationRange, currentPage, onPageChange) =>
  paginationRange?.map((pageNumber, key) => {
    if (pageNumber === DOTS) {
      return <li key={key}>&#8230;</li>;
    }
    return (
      <li
        key={key}
        className={`md:text-base text-xs cursor-pointer font-medium md:w-[38px] w-8 h-8 md:h-[38px] flex py-1 px-3 items-center justify-center ${
          pageNumber === currentPage
            ? 'bg-[#ECF5FE] dark:bg-[#080E1C] rounded text-[#4399EB] dark:text-[#1d5ab5]'
            : 'text-[#333333] transition duration-200 ease-in dark:hover:text-[#1d5ab5] dark:text-white hover:bg-[#ECF5FE] dark:hover:bg-[#080E1C] hover:rounded hover:text-[#4399EB]'
        }`}
        onClick={() => onPageChange(pageNumber)}
      >
        {pageNumber}
      </li>
    );
  });

export default Pagination;
