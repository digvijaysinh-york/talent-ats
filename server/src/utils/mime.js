/** @param {string} name */
export function extFromName(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/**
 * @param {string} mimetype
 * @param {string} originalname
 */
export function resolveKind(mimetype, originalname) {
  const ext = extFromName(originalname);
  if (mimetype === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return 'docx';
  }
  if (mimetype === 'text/plain' || ext === 'txt') return 'txt';
  return null;
}
