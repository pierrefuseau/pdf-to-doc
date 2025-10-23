import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedFile, ProcessingStatus, DocCreationStatus } from './types';
import { extractTextFromPdf } from './services/pdfService';
import { generateReport } from './services/geminiService';
import { createGoogleDoc } from './services/googleDocsService';
import FileDropzone from './components/FileDropzone';
import ReportCard from './components/ReportCard';
import { SparklesIcon, DocumentIcon, GoogleDocIcon } from './components/icons';

declare const google: any;
declare const gapi: any;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = process.env.API_KEY || '';
const DISCOVERY_DOC = "https://docs.googleapis.com/$discovery/rest?version=v1";
const SCOPES = "https://www.googleapis.com/auth/documents";

export default function App() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  useEffect(() => {
    const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    const onGapiLoad = () => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        setGapiReady(true);
      });
    };
    gapiScript?.addEventListener('load', onGapiLoad);

    const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const onGisLoad = () => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error(`Google Auth Error: ${tokenResponse.error}`);
            setIsGoogleSignedIn(false);
            return;
          }
          if (tokenResponse && tokenResponse.access_token) {
            gapi.client.setToken(tokenResponse);
            setIsGoogleSignedIn(true);
          } else {
            console.warn("Google Auth: Token response did not contain access_token.");
            setIsGoogleSignedIn(false);
          }
        },
      });
      setTokenClient(client);
      setGisReady(true);
    };
    gisScript?.addEventListener('load', onGisLoad);

    return () => {
      gapiScript?.removeEventListener('load', onGapiLoad);
      gisScript?.removeEventListener('load', onGisLoad);
    };
  }, []);

  const handleGoogleSignIn = () => {
    if (gapiReady && gisReady && tokenClient) {
      // The 'Sign in' button is only shown when not signed in,
      // so we always want to prompt the user for consent.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert("Google Auth is not ready yet. Please try again in a moment.");
    }
  };

  const handleGoogleSignOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken(null);
        setIsGoogleSignedIn(false);
      });
    }
  };

  const handleFilesAdded = useCallback((files: File[]) => {
    const newFiles: ProcessedFile[] = files.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      status: ProcessingStatus.PENDING,
      report: null,
      error: null,
      docCreationStatus: DocCreationStatus.IDLE,
      googleDocUrl: null,
      docCreationError: null,
    }));
    setProcessedFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const updateFileStatus = (id: string, updates: Partial<Omit<ProcessedFile, 'id' | 'file'>>) => {
    setProcessedFiles(prevFiles =>
      prevFiles.map(pf =>
        pf.id === id ? { ...pf, ...updates } : pf
      )
    );
  };

  const handleProcessFiles = async () => {
    const filesToProcess = processedFiles.filter(f => f.status === ProcessingStatus.PENDING);
    if (filesToProcess.length === 0) return;

    setIsProcessing(true);

    for (const file of filesToProcess) {
      try {
        updateFileStatus(file.id, { status: ProcessingStatus.PROCESSING });
        
        const text = await extractTextFromPdf(file.file);
        if (!text) {
          throw new Error('Could not extract text from PDF.');
        }

        const report = await generateReport(text, file.file.name);
        updateFileStatus(file.id, { status: ProcessingStatus.SUCCESS, report });

      } catch (error) {
        console.error(`Failed to process ${file.file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        updateFileStatus(file.id, { status: ProcessingStatus.ERROR, error: errorMessage, report: null });
      }
    }

    setIsProcessing(false);
  };
  
  const handleCreateGoogleDoc = async (fileId: string) => {
    const fileToProcess = processedFiles.find(f => f.id === fileId);
    if (!fileToProcess || !fileToProcess.report) return;

    updateFileStatus(fileId, { docCreationStatus: DocCreationStatus.CREATING });

    try {
        const { documentUrl } = await createGoogleDoc(fileToProcess.file.name, fileToProcess.report);
        updateFileStatus(fileId, { docCreationStatus: DocCreationStatus.SUCCESS, googleDocUrl: documentUrl });
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        updateFileStatus(fileId, { docCreationStatus: DocCreationStatus.ERROR, docCreationError: errorMessage });
        if (errorMessage.includes("Authentication error")) {
            handleGoogleSignOut();
        }
    }
  }

  const filesReadyToProcess = processedFiles.filter(f => f.status === ProcessingStatus.PENDING).length > 0;
  const processedReports = processedFiles.filter(f => f.status !== ProcessingStatus.PENDING);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
           <div className="absolute top-4 right-4">
             {gapiReady && gisReady && (
                isGoogleSignedIn ? (
                  <button onClick={handleGoogleSignOut} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm">Sign Out</button>
                ) : (
                  <button onClick={handleGoogleSignIn} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm">Sign in with Google</button>
                )
             )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            PDF Analysis Report Generator
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Drag and drop your PDF files, and our AI expert will generate a complete, clear, and structured report for each one.
          </p>
        </header>

        <section className="max-w-3xl mx-auto">
          <FileDropzone onFilesAdded={handleFilesAdded} />

          {processedFiles.length > 0 && (
            <div className="mt-8 bg-slate-800/50 rounded-lg p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-slate-300">File Queue</h2>
              <ul className="space-y-3">
                {processedFiles.map(pf => (
                  <li key={pf.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="h-6 w-6 text-sky-400" />
                      <span className="font-medium">{pf.file.name}</span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      pf.status === ProcessingStatus.PENDING ? 'bg-yellow-500/20 text-yellow-300' :
                      pf.status === ProcessingStatus.PROCESSING ? 'bg-blue-500/20 text-blue-300' :
                      pf.status === ProcessingStatus.SUCCESS ? 'bg-green-500/20 text-green-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {pf.status}
                    </span>
                  </li>
                ))}
              </ul>

              {filesReadyToProcess && (
                 <button
                    onClick={handleProcessFiles}
                    disabled={isProcessing}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>
                      {isProcessing ? 'Processing...' : `Generate ${filesReadyToProcess ? `Report${processedFiles.filter(f => f.status === ProcessingStatus.PENDING).length > 1 ? 's' : ''}` : ''}`}
                    </span>
                  </button>
              )}
            </div>
          )}
        </section>

        {processedReports.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8">Generated Reports</h2>
            <div className="grid grid-cols-1 gap-8">
              {processedReports.map(pf => (
                <ReportCard 
                  key={pf.id} 
                  fileName={pf.file.name} 
                  status={pf.status} 
                  report={pf.report} 
                  error={pf.error}
                  isGoogleSignedIn={isGoogleSignedIn}
                  docCreationStatus={pf.docCreationStatus}
                  googleDocUrl={pf.googleDocUrl}
                  docCreationError={pf.docCreationError}
                  onCreateGoogleDoc={() => handleCreateGoogleDoc(pf.id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}