// Settings for high quality tracing as requested
export const tracerOptions = {
    corsenabled: false,
    ltres: 0.1, // Lower = sharper details
    qtres: 0.1, // Lower = sharper details
    pathomit: 1, // Lower = more details
    rightangleenhance: true,
    colorsampling: 2, // 0: disabled, 1: random, 2: deterministic
    numberofcolors: 16, // Max colors
    mincolorratio: 0,
    colorquantcycles: 3,
    layering: 0,
    strokewidth: 0,
    blurradius: 0,
    blurdelta: 10
  };
  
  export const traceImageToSVG = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.ImageTracer) {
        reject("ImageTracer not loaded");
        return;
      }
  
      try {
        window.ImageTracer.imageToSVG(
          imageUrl,
          (svgString) => {
            if (svgString) {
              resolve(svgString);
            } else {
              reject("Failed to generate SVG");
            }
          },
          tracerOptions
        );
      } catch (e) {
        reject(e);
      }
    });
  };