import React from 'react';
import { ProcessingStatus, DocCreationStatus } from '../types';
import Loader from './Loader';
import { DocumentCheckIcon, ExclamationTriangleIcon, GoogleDocIcon } from './icons';

interface ReportCardProps {
  fileName: string;
  status: ProcessingStatus;
  report: string | null;
  error: string | null;
  isGoogleSignedIn: boolean;
  docCreationStatus: DocCreationStatus;
  googleDocUrl: string | null;
  docCreationError: string | null;
  onCreateGoogleDoc: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  fileName,
  status,
  report,
  error,
  isGoogleSignedIn,
  docCreationStatus,
  googleDocUrl,
  docCreationError,
  onCreateGoogleDoc,
}) => {
  const renderGoogleDocButton = () => {
    if (status !== ProcessingStatus.SUCCESS) return null;

    if (!isGoogleSignedIn) {
      return (
        <div className="text-sm text-slate-400">
          Sign in with Google to create a Google Doc.
        </div>
      );
    }
    
    switch (docCreationStatus) {
      case DocCreationStatus.IDLE:
        return (
          <button
            onClick={onCreateGoogleDoc}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            <GoogleDocIcon className="h-5 w-5" />
            <span>Create Google Doc</span>
          </button>
        );
      case DocCreationStatus.CREATING:
        return (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader />
            <span>Creating Google Doc...</span>
          </div>
        );
      case DocCreationStatus.SUCCESS:
        return (
          <a
            href={googleDocUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            <GoogleDocIcon className="h-5 w-5" />
            <span>Open Google Doc</span>
          </a>
        );
      case DocCreationStatus.ERROR:
        return (
          <div className="text-red-400">
            <p className="font-semibold">Failed to create Google Doc.</p>
            <p className="text-sm">{docCreationError}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-slate-200 break-all">{fileName}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
            {status === ProcessingStatus.SUCCESS && <DocumentCheckIcon className="h-5 w-5 text-green-400" />}
            {status === ProcessingStatus.ERROR && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                status === ProcessingStatus.SUCCESS ? 'bg-green-500/20 text-green-300' :
                status === ProcessingStatus.ERROR ? 'bg-red-500/20 text-red-300' :
                'bg-blue-500/20 text-blue-300'
            }`}>
              {status}
            </span>
        </div>
      </div>
      <div className="p-4 sm:p-6 min-h-[200px]">
        {status === ProcessingStatus.PROCESSING && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader />
            <p className="mt-4">Generating AI report...</p>
          </div>
        )}
        {status === ProcessingStatus.SUCCESS && report && (
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300 whitespace-pre-wrap font-mono">
            {report.split('**').map((part, index) => 
                index % 2 !== 0 ? <strong key={index} className="text-sky-300">{part}</strong> : part
            )}
          </div>
        )}
        {status === ProcessingStatus.ERROR && (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <ExclamationTriangleIcon className="h-10 w-10 mb-4" />
            <p className="font-semibold">Report Generation Failed</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
          </div>
        )}
      </div>
      <div className="bg-slate-900/50 px-4 py-3 sm:px-6 border-t border-slate-700">
        {renderGoogleDocButton()}
      </div>
    </div>
  );
};

export default ReportCard;