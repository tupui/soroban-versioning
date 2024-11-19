import React from "react";
import { useState } from "react";
import Pagination from "../../utils/Pagination";
import { projectNameForGovernance } from "utils/store";
import { useStore } from "@nanostores/react";

const IdeaList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="w-full py-4 sm:py-8 md:py-12 px-3 sm:px-9 md:px-13 bg-zinc-200 rounded-xl sm:rounded-3xl rounded-tl-none sm:rounded-tl-none">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-5">
        <div className="flex justify-center items-center h-32">
          <h1 className="text-xl sm:text-2xl md:text-3xl">-- Coming Soon --</h1>
        </div>
      </div>
      <div>
        <Pagination
          currentPage={currentPage}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default IdeaList;
