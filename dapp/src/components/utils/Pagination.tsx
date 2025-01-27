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
    <div className="p-[6px_18px] flex items-center gap-[24px] bg-white">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="disabled:opacity-50"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.1 7.98789H4.77787L10.4377 2.32802L8.99999 0.900391L0.899994 9.00039L8.99999 17.1004L10.4276 15.6728L4.77787 10.0129H17.1V7.98789Z"
            fill="#311255"
          />
        </svg>
      </button>
      <div className="flex gap-3">
        {Array.from({ length: 13 }, (_, index) => {
          const page = Math.max(currentPage - 7, 0) + index + 1;
          return (
            <button
              key={index}
              className={`p-[6px_10px] w-8 h-8 ${page == currentPage && "border border-primary"}`}
              onClick={() => onPageChange(page)}
            >
              <p className="leading-5 text-xl text-primary">{page}</p>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={false}
        className="disabled:opacity-50"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.900005 10.0121L13.2221 10.0121L7.56226 15.672L9.00001 17.0996L17.1 8.99961L9.00001 0.899609L7.57238 2.32723L13.2221 7.98711L0.900005 7.98711V10.0121Z"
            fill="#311255"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
