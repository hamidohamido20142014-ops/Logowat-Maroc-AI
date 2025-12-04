export interface LogoResult {
    id: string;
    imageUrl: string; // Base64 or URL
    style: string;
    prompt: string;
    svgContent?: string;
  }
  
  export type LogoStyle = 'modern' | 'traditional' | 'tifinagh' | 'zellige' | 'mix';
  
  // Declaration for the global ImageTracer object loaded via CDN
  declare global {
    interface Window {
      ImageTracer: {
        imageToSVG: (
          url: string,
          callback: (svgString: string) => void,
          options?: any
        ) => void;
        appendSVGString: (svgString: string, parentId: string) => void;
      };
    }
  }
  
  export const MOROCCAN_PALETTE = [
    '#006233', // Moroccan Green
    '#C1272D', // Moroccan Red
    '#009AD7', // Chefchaouen Blue
    '#D4AF37', // Gold
    '#F2EBD4', // Tadellakt Beige
    '#000000', // Black
    '#FFFFFF', // White
  ];