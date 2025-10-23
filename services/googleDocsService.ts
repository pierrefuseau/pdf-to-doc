// This assumes gapi is loaded globally from the script tag in index.html
declare const gapi: any;

export async function createGoogleDoc(title: string, content: string): Promise<{ documentId: string; documentUrl: string }> {
  try {
    const response = await gapi.client.docs.documents.create({
      title: title,
    });
    
    const documentId = response.result.documentId;
    if (!documentId) {
        throw new Error("Failed to get document ID after creation.");
    }
    
    await gapi.client.docs.documents.batchUpdate({
      documentId: documentId,
      requests: [
        {
          insertText: {
            text: content,
            location: {
              index: 1,
            },
          },
        },
      ],
    });

    return {
        documentId: documentId,
        documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
    };

  } catch (error) {
    console.error("Error creating Google Doc:", error);
    const errorDetails = (error as any).result?.error;
    if(errorDetails?.code === 401 || errorDetails?.status === 'UNAUTHENTICATED') {
        throw new Error("Authentication error. Please sign in again.");
    }
    throw new Error("Failed to create Google Doc.");
  }
}
