import React, { useState, useEffect } from 'react';
import { formatTime } from '../service/utils';
import { loadProjectLatestSha } from '../service/StateService';

const CommitRecord = ({ message, date, authorName, authorGithubLink, sha, commitLink, isMaintainer }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLatestCommit, setIsLatestCommit] = useState(false);
  const formattedMessage = message.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const firstLine = formattedMessage[0];
  const hasMoreLines = formattedMessage.length > 1;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const highlightLatestCommit = () => {
      setIsLatestCommit(sha === loadProjectLatestSha());
    };
    highlightLatestCommit();
  }, [sha]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sha);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className={`commit-record relative bg-white pt-5 pb-3 px-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start ${isLatestCommit ? 'border-2 border-blue-300 bg-zinc-300' : ''}`} data-sha={sha} id={isLatestCommit ? 'latest-commit-record' : undefined}>
      {(isLatestCommit || isMaintainer) && (
        <div className="absolute top-0.5 left-1 flex space-x-1">
          {isLatestCommit && (
            <div className="text-xs font-bold tracking-tighter leading-3 bg-lime rounded-sm p-0.5">
              verified commit
            </div>
          )}
          {isMaintainer && (
            <div className="text-xs font-bold tracking-tighter leading-3 bg-blue-200 rounded-sm p-0.5">
              verified maintainer
            </div>
          )}
        </div>
      )}
      <div className="commit-info flex-grow overflow-hidden mr-4">
        <div className="flex items-center">
          <a href={commitLink} target="_blank" rel="noopener noreferrer" className="commit-message text-lg font-medium hover:underline hover:text-blue-500 truncate">{firstLine}</a>
          {hasMoreLines && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button ml-2 text-xs bg-zinc-200 hover:bg-zinc-300 text-gray-700 font-semibold py-1 px-2 rounded-md transition-colors duration-200 flex-shrink-0">
              {isExpanded ? 'Less' : '. . .'}
            </button>
          )}
        </div>
        {hasMoreLines && isExpanded && (
          <div className="expanded-message mt-2 text-sm text-gray-700 whitespace-pre-wrap">{formattedMessage.slice(1).join('\n')}</div>
        )}
        <div className="commit-details text-sm text-gray-600 mt-1">
          <a href={authorGithubLink} target="_blank" rel="noopener noreferrer" className="author-name font-semibold hover:underline hover:text-blue-500">{authorName}</a>
          <span className="ml-1 hidden sm:inline"> committed on</span>
          <span className="commit-date ml-1"> {formatTime(date)}</span>
        </div>
      </div>
      <div className="commit-sha flex items-center space-x-2 flex-shrink-0">
        <div className="relative group">
          <a href={commitLink} target="_blank" rel="noopener noreferrer" className="sha text-sm font-mono text-gray-500 hover:bg-zinc-400 transition-colors duration-200 px-2 py-1 rounded">
            {sha.substring(0, 7)}
          </a>
          <div className="absolute -left-1/4 sm:-left-full bottom-full mb-2 -translate-x-1/2 hidden group-hover:block">
            <div className="bg-black text-white text-xs py-1 px-2 rounded shadow-lg max-w-[54vw] sm:max-w-[90vw] break-words">
              {sha}
              <div className="absolute left-2/3 sm:left-3/4 top-full border-4 border-transparent border-t-black"></div>
            </div>
          </div>
        </div>
        <button className="copy-button hover:bg-zinc-400 transition-colors duration-200 p-1 rounded" onClick={handleCopy}>
          {isCopied ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommitRecord;