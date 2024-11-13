import React from "react";

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  onPageChange,
}) => {
  return (
    <div className="flex justify-center items-center mt-4 space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 flex items-center"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>
      <button
        onClick={() => onPageChange(1)}
        className={`px-3 py-1 border rounded hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 ${
          currentPage === 1
            ? "bg-lime border-lime"
            : "border-zinc-300"
        }`}
      >
        1
      </button>
      {currentPage > 2 && <span>...</span>}
      {currentPage !== 1 && (
        <button className="px-3 py-1 border border-lime bg-lime rounded">
          {currentPage}
        </button>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={false}
        className="px-3 py-1 border border-zinc-300 rounded disabled:opacity-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors duration-150 flex items-center"
      >
        Next
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
