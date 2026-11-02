// Reads a local image (file:// or content:// URI from the camera or picker)
// into a Blob that Firebase Storage can upload.
//
// This uses XMLHttpRequest instead of fetch: Expo replaces the global fetch
// with expo/fetch, which doesn't reliably read local files, while React
// Native's XHR reads them natively and returns a Blob Firebase accepts.
export function readLocalImage(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.responseType = "blob";
    request.onload = () => {
      const blob = request.response as Blob | null;
      if (!blob || blob.size === 0) {
        reject(new Error("Could not read the selected image."));
        return;
      }
      resolve(blob);
    };
    request.onerror = () =>
      reject(new Error("Could not read the selected image."));
    request.open("GET", uri, true);
    request.send(null);
  });
}
