import React from "react";
import { useState } from "react";
import Pagination from "../../utils/Pagination";

const ProposalList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="w-full py-6 sm:py-8 md:py-12 px-7 sm:px-9 md:px-13">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-5"></div>
      <div>
        <Pagination
          currentPage={currentPage}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default ProposalList;
