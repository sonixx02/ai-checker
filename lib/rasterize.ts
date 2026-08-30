const RENDER_WIDTH = 1600;
const JPEG_QUALITY = 0.8;

export type PageImage = {
  page: number;
  dataUrl: string;
  base64: string;
  width: number;
  height: number;
};

function dataUrlToBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  return dataUrl.slice(commaIndex + 1);
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Could not get a 2d canvas context");
  }

  return { canvas, context };
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

async function rasterizePdf(file: File): Promise<PageImage[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdfDocument = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: PageImage[] = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const pdfPage = await pdfDocument.getPage(pageNumber);

    const unscaledViewport = pdfPage.getViewport({ scale: 1 });
    const scale = RENDER_WIDTH / unscaledViewport.width;
    const viewport = pdfPage.getViewport({ scale });

    const { canvas } = createCanvas(viewport.width, viewport.height);

    await pdfPage.render({ canvas, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    pages.push({
      page: pageNumber - 1,
      dataUrl,
      base64: dataUrlToBase64(dataUrl),
      width: canvas.width,
      height: canvas.height,
    });
  }

  return pages;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not decode the image file"));
    element.src = dataUrl;
  });
}

async function rasterizeImage(file: File): Promise<PageImage[]> {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const scale = RENDER_WIDTH / image.width;
  const height = Math.round(image.height * scale);

  const { canvas, context } = createCanvas(RENDER_WIDTH, height);
  context.drawImage(image, 0, 0, RENDER_WIDTH, height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  return [
    {
      page: 0,
      dataUrl,
      base64: dataUrlToBase64(dataUrl),
      width: canvas.width,
      height: canvas.height,
    },
  ];
}

export async function rasterizeFile(file: File): Promise<PageImage[]> {
  if (file.type === "application/pdf") {
    return rasterizePdf(file);
  }
  return rasterizeImage(file);
}

export async function countPages(file: File): Promise<number> {
  if (file.type !== "application/pdf") {
    return 1;
  }

  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdfDocument = await pdfjs.getDocument({ data: buffer }).promise;
  return pdfDocument.numPages;
}
