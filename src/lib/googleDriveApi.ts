export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * List files from user's Google Drive.
 * Defaults to filtering for PDFs, images, and folders.
 */
export async function listDriveFiles(
  accessToken: string,
  options?: {
    query?: string;
    onlyPdfsAndImages?: boolean;
    pageSize?: number;
  }
): Promise<DriveFileItem[]> {
  const { query = '', onlyPdfsAndImages = true, pageSize = 30 } = options || {};

  const queryParts: string[] = ['trashed = false'];

  if (onlyPdfsAndImages) {
    queryParts.push(
      "(mimeType = 'application/pdf' or mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder')"
    );
  }

  if (query.trim()) {
    const escapedQuery = query.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escapedQuery}'`);
  }

  const q = queryParts.join(' and ');
  const url = new URL(`${DRIVE_API_BASE}/files`);
  url.searchParams.set('q', q);
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink)'
  );
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');
  url.searchParams.set('pageSize', pageSize.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFileItem[];
}

/**
 * Find or create a specific folder in Google Drive (e.g. "ADIB Documents")
 */
export async function findOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${await createRes.text()}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload a file directly to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  params: {
    name: string;
    mimeType: string;
    blob: Blob;
    folderId?: string;
  }
): Promise<DriveFileItem> {
  const { name, mimeType, blob, folderId } = params;

  const metadata: Record<string, unknown> = {
    name,
    mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------ADIB_DRIVE_BOUNDARY_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeaderPart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const blobArrayBuffer = await blob.arrayBuffer();

  const metadataBuffer = new TextEncoder().encode(metadataPart);
  const fileHeaderBuffer = new TextEncoder().encode(fileHeaderPart);
  const closeBuffer = new TextEncoder().encode(closeDelimiter);

  // Combine into single multipart body
  const totalLength =
    metadataBuffer.byteLength +
    fileHeaderBuffer.byteLength +
    blobArrayBuffer.byteLength +
    closeBuffer.byteLength;

  const combined = new Uint8Array(totalLength);
  let offset = 0;

  combined.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;

  combined.set(fileHeaderBuffer, offset);
  offset += fileHeaderBuffer.byteLength;

  combined.set(new Uint8Array(blobArrayBuffer), offset);
  offset += blobArrayBuffer.byteLength;

  combined.set(closeBuffer, offset);

  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
  }

  return (await response.json()) as DriveFileItem;
}

/**
 * Download a file's binary content directly from Google Drive
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<{ blob: Blob; mimeType: string }> {
  // First fetch metadata to get mimeType
  const metaRes = await fetch(`${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let mimeType = 'application/pdf';
  if (metaRes.ok) {
    const meta = await metaRes.json();
    if (meta.mimeType) mimeType = meta.mimeType;
  }

  // Fetch file media
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download file from Google Drive: ${errText}`);
  }

  const blob = await response.blob();
  return { blob, mimeType };
}

/**
 * Delete a file from Google Drive (MUST be preceded by user confirmation)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 204) {
    const errText = await response.text();
    throw new Error(`Failed to delete Google Drive file: ${errText}`);
  }

  return true;
}
