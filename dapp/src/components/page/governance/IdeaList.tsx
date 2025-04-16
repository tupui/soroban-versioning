import React from "react";
import { useState } from "react";
import Pagination from "../../utils/Pagination";

const IdeaList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-5">
        <div className="flex justify-center items-center h-32">
          <h1 className="text-xl sm:text-2xl md:text-3xl">Stay tuned!</h1>
        </div>
      </div>
      <div>
        <Pagination
          currentPage={currentPage}
          onPageChange={(page: number) => setCurrentPage(page)}
          totalPage={1}
        />
      </div>
    </div>
  );
};

export default IdeaList;
