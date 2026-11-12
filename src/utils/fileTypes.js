// One place that decides what a reviewer file is, so every screen agrees.
// Word and PowerPoint files are previewed as PDF (the server converts them), so they get the
// same Preview button and the same tier page limit as a PDF.

const OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const extensionOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

// resource = { filename, mimeType } as returned by the API.
export const isOfficeFile = (resource) => OFFICE_EXTENSIONS.includes(extensionOf(resource?.filename));

export const isPdfFile = (resource) =>
  resource?.mimeType === 'application/pdf' || extensionOf(resource?.filename) === 'pdf';

// Which files get a Preview button: PDF, Word, PowerPoint and pictures.
export const isPreviewable = (resource) =>
  isPdfFile(resource) || isOfficeFile(resource) || IMAGE_TYPES.includes(resource?.mimeType);

// Short label for headings, e.g. "Word document".
export const fileKindLabel = (resource) => {
  const ext = extensionOf(resource?.filename);
  if (ext === 'doc' || ext === 'docx') return 'Word document';
  if (ext === 'ppt' || ext === 'pptx') return 'PowerPoint';
  if (isPdfFile(resource)) return 'PDF';
  if (IMAGE_TYPES.includes(resource?.mimeType)) return 'Image';
  return 'Document';
};