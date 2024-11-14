import React from "react";
import { useState, useEffect } from "react";
interface Props {
  id: string;
  title: string;
  submitVote: (id: string) => void;
}

const ProposalPageTitle: React.FC<Props> = ({ id, title, submitVote }) => {
  const [projectId, setProjectId] = useState(id);

  useEffect(() => {
    if (id) {
      setProjectId(id);
    }
  }, [id]);

  return (
    <div className="relative flex flex-col items-center md:flex-row justify-between mb-1.5 mt-4 sm:mt-8 md:mt-12 gap-y-4">
      <div className="grid place-items-center gap-8 md:flex">
        <span className="w-14 sm:w-16 md:w-20 flex justify-center text-2xl sm:text-3xl md:text-4xl px-1 font-medium bg-lime rounded-md sm:rounded-lg">
          {projectId}
        </span>
        <p className="text-2xl font-normal text-center md:text-start">
          {title}
        </p>
      </div>
      <div id="vote-proposal-button" className="">
        <button
          onClick={() => submitVote(id)}
          className={`w-full px-4 py-2 sm:py-3 bg-zinc-900 rounded-[14px] justify-center gap-2.5 inline-flex`}
        >
          <span className="text-center text-white text-xl font-normal leading-7">
            Vote
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProposalPageTitle;
