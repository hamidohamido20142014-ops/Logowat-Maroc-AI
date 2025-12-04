import React, { useState, useRef } from 'react';
import { Loader2, Wand2, Download, Image as ImageIcon, Edit, Upload, Sparkles, CheckCircle2, Palette, PenTool, Hexagon, LayoutGrid, Layers } from 'lucide-react';
import { generateLogos, cleanupImageForSVG } from './services/geminiService';
import { traceImageToSVG } from './utils/tracer';
import LogoEditor from './components/LogoEditor';
import { LogoResult, LogoStyle } from './types';

const App = () => {
  // State
  const [projectName, setProjectName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [style, setStyle] = useState<LogoStyle>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<LogoResult[]>([]);
  const [editingLogo, setEditingLogo] = useState<LogoResult | null>(null);
  
  // Converter State
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [convertedSvg, setConvertedSvg] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process.env.API_KEY) {
        alert("API Key is missing!");
        return;
    }
    
    setIsGenerating(true);
    setGeneratedLogos([]);

    // Scroll to results area smoothly after a small delay
    setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if(resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
    }, 500);

    try {
      const images = await generateLogos(projectName, keywords, style);
      
      const newLogos: LogoResult[] = images.map((img, idx) => ({
        id: Date.now() + '-' + idx,
        imageUrl: img,
        style,
        prompt: keywords
      }));
      
      setGeneratedLogos(newLogos);
    } catch (error) {
      console.error(error);
      alert('وقع شي مشكيل فتوليد الصور. عاود جرب.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertToSvg = async (logo: LogoResult) => {
    if (logo.svgContent) {
        setEditingLogo(logo);
        return;
    }

    const confirmConvert = confirm('بغيتي تحول هاد الصورة لـ SVG؟ هاد العملية تقدر تاخد شوية ديال الوقت باش الذكاء الاصطناعي ينقي الصورة.');
    if (!confirmConvert) return;

    setIsGenerating(true); 

    try {
        const cleanedImage = await cleanupImageForSVG(logo.imageUrl);
        const svg = await traceImageToSVG(cleanedImage);
        
        const updatedLogos = generatedLogos.map(l => 
            l.id === logo.id ? { ...l, svgContent: svg } : l
        );
        setGeneratedLogos(updatedLogos);
        
        const updatedLogo = updatedLogos.find(l => l.id === logo.id);
        if (updatedLogo) setEditingLogo(updatedLogo);

    } catch (err) {
        console.error(err);
        alert('فشل التحويل. تأكد من الإنترنت.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
        setConvertedSvg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processUploadedImage = async () => {
    if (!uploadPreview) return;
    setIsConverting(true);
    try {
        const cleaned = await cleanupImageForSVG(uploadPreview);
        const svg = await traceImageToSVG(cleaned);
        setConvertedSvg(svg);
    } catch (e) {
        alert('وقع خطأ أثناء التحويل');
    } finally {
        setIsConverting(false);
    }
  };

  const styleOptions: {id: LogoStyle, label: string, icon: React.ReactNode, desc: string}[] = [
      { id: 'modern', label: 'عصري (Modern)', icon: <LayoutGrid className="w-6 h-6"/>, desc: 'بسيط، هندسي، ومينيماليست' },
      { id: 'traditional', label: 'تقليدي (Traditional)', icon: <Hexagon className="w-6 h-6"/>, desc: 'نقوش، أقواس، وتفاصيل عريقة' },
      { id: 'tifinagh', label: 'تيفيناغ (Tifinagh)', icon: <span className="font-tifinagh text-xl font-bold">ⵣ</span>, desc: 'حروف ورموز أمازيغية أصيلة' },
      { id: 'zellige', label: 'زليج (Zellige)', icon: <Layers className="w-6 h-6"/>, desc: 'فسيفساء وهندسة إسلامية' },
      { id: 'mix', label: 'ميكس (Fusion)', icon: <Sparkles className="w-6 h-6"/>, desc: 'مزيج بين الأصالة والمعاصرة' },
  ];

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Decorative Top Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-morocco-green via-morocco-red to-morocco-gold fixed top-0 z-50"></div>

      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-white/40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="absolute inset-0 bg-morocco-green blur-md opacity-20 rounded-full"></div>
                <div className="w-10 h-10 bg-morocco-green rounded-xl rotate-45 flex items-center justify-center relative shadow-lg">
                    <div className="w-5 h-5 border-2 border-white/90 -rotate-45" />
                </div>
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                    Logowat <span className="text-morocco-green">Maroc</span>
                </h1>
                <span className="text-[10px] font-bold tracking-widest text-morocco-gold uppercase">AI Generator</span>
            </div>
          </div>
          <a href="#converter" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white text-sm font-bold text-morocco-green border border-morocco-green/20 transition-all shadow-sm hover:shadow-md">
             <Upload size={16} />
             أداة التحويل (Vector)
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-morocco-green/5 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-morocco-red/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-morocco-gold/10 text-morocco-gold font-bold text-sm border border-morocco-gold/20 mb-6 animate-fade-in-up">
                <Sparkles size={14} />
                <span>الذكاء الاصطناعي باللمسة المغربية الأصيلة</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.2] mb-6 tracking-tight">
                صايب Logo احترافي <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-morocco-green to-teal-600">
                    مستوحى من الهوية
                </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                من الزليج الفاسي للخط المغربي العريق. دخل سمية مشروعك وخلي الذكاء الاصطناعي يبدع ليك تصاميم جاهزة للاستعمال فثواني.
            </p>

            {/* Main Form Card */}
            <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 max-w-5xl mx-auto border border-white/50 relative overflow-hidden ring-1 ring-slate-100">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-morocco-green/20 via-morocco-gold/20 to-morocco-green/20"></div>
                
                <form onSubmit={handleGenerate} className="flex flex-col gap-8 text-right">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 group">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <PenTool size={16} className="text-morocco-green"/> سمية المشروع
                            </label>
                            <input 
                                type="text" 
                                required
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="مثلاً: دار الضيافة، تعاونية الأطلس..." 
                                className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-morocco-green focus:ring-4 focus:ring-morocco-green/10 outline-none transition-all font-bold text-lg placeholder:font-normal"
                            />
                        </div>

                        <div className="space-y-3 group">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Palette size={16} className="text-morocco-green"/> كلمات مفتاحية (اختياري)
                            </label>
                            <input 
                                type="text" 
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="طبيعة، زيت أركان، فخامة، أحمر..." 
                                className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-morocco-green focus:ring-4 focus:ring-morocco-green/10 outline-none transition-all font-bold text-lg placeholder:font-normal"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <LayoutGrid size={16} className="text-morocco-green"/> اختار الستايل المفضل
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {styleOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setStyle(opt.id)}
                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group text-center
                                        ${style === opt.id 
                                            ? 'border-morocco-green bg-morocco-green/5 shadow-md scale-[1.02]' 
                                            : 'border-slate-100 hover:border-morocco-green/50 hover:bg-white bg-slate-50/50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${style === opt.id ? 'bg-morocco-green text-white' : 'bg-white text-slate-400 group-hover:text-morocco-green shadow-sm'}`}>
                                        {opt.icon}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className={`font-bold text-sm ${style === opt.id ? 'text-morocco-green' : 'text-slate-600'}`}>{opt.label.split(' (')[0]}</span>
                                        <span className="text-[10px] text-slate-400 leading-tight">{opt.desc}</span>
                                    </div>
                                    
                                    {style === opt.id && (
                                        <div className="absolute top-2 right-2 text-morocco-green">
                                            <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-morocco-green to-[#004d28] text-white p-5 rounded-xl font-bold text-xl shadow-xl shadow-morocco-green/20 hover:shadow-2xl hover:shadow-morocco-green/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin w-6 h-6" />
                                    <span>جاري التصميم... الذكاء الاصطناعي كيفكر 🧠</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-6 h-6" />
                                    <span>صايب Logo دابا (Generate)</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
      </section>

      {/* Results Section */}
      {(isGenerating || generatedLogos.length > 0) && (
        <section id="results-section" className="container mx-auto px-4 py-12 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
            
            {isGenerating && generatedLogos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                    <div className="w-20 h-20 bg-morocco-green/10 rounded-full flex items-center justify-center mb-6">
                        <Loader2 className="w-10 h-10 text-morocco-green animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">كنوجدو الاقتراحات ديالك</h3>
                    <p className="text-slate-500">جاري استلهام الزخارف والألوان...</p>
                </div>
            )}

            {!isGenerating && generatedLogos.length > 0 && (
                <>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">النتائج المقترحة</h2>
                        <p className="text-slate-600">اختار Logo اللي عجبك وحملو، ولا حولو لـ SVG باش تعدل عليه.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {generatedLogos.map((logo) => (
                            <div key={logo.id} className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-morocco-green/10 transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
                                
                                {/* Image Area */}
                                <div className="aspect-[4/3] w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 p-10 flex items-center justify-center relative overflow-hidden">
                                    <img 
                                        src={logo.imageUrl} 
                                        alt="Generated Logo" 
                                        className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-700 ease-out" 
                                    />
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm gap-3">
                                        <a 
                                            href={logo.imageUrl} 
                                            download={`logo-${projectName}.png`}
                                            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-morocco-green hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                                        >
                                            <Download size={20} /> تحميل PNG
                                        </a>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-6 bg-white border-t border-slate-50 flex justify-between items-center mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${logo.style === 'modern' ? 'bg-blue-500' : logo.style === 'traditional' ? 'bg-morocco-red' : 'bg-morocco-gold'}`}></span>
                                        <span className="text-sm font-bold text-slate-600 capitalize">{logo.style}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleConvertToSvg(logo)}
                                        className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all border
                                            ${logo.svgContent 
                                                ? 'bg-morocco-green/10 text-morocco-green border-morocco-green/20 hover:bg-morocco-green hover:text-white' 
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-morocco-green/50 hover:text-morocco-green'
                                            }`}
                                    >
                                        {logo.svgContent ? <Edit size={16} /> : <Sparkles size={16} />}
                                        {logo.svgContent ? 'تعديل التصميم' : 'تحويل لـ Vector'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
      )}

      {/* Converter Section */}
      <section id="converter" className="container mx-auto px-4 py-24 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-morocco-gold/5 -z-10 rounded-[100%] blur-3xl"></div>

        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-white p-8 md:p-16 text-center">
            <div className="mb-12">
                <span className="inline-block px-3 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-bold mb-4 tracking-wider">BETA TOOLS</span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">حول أي صورة لـ فيكتور (SVG)</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    عندك Logo قديم بكسلي؟ ولا رسمة بغيتي تردها ديجيتال؟
                    <br/>
                    ارفع الصورة هنا وحنا غانستعملو AI باش نقيوها ونحولوها لـ SVG نقي.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Upload Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group cursor-pointer min-h-[350px] bg-slate-50 border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all relative overflow-hidden
                        ${uploadPreview ? 'border-morocco-green bg-morocco-green/5' : 'border-slate-300 hover:border-morocco-green hover:bg-slate-100'}
                    `}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="hidden" 
                    />
                    
                    {uploadPreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={uploadPreview} alt="Preview" className="max-w-full max-h-[250px] object-contain rounded-lg drop-shadow-md" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                تغيير الصورة
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Upload size={40} className="text-morocco-green" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">ضغط باش ترفع Logo</h3>
                            <p className="text-sm text-slate-500">JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                    )}
                </div>

                {/* Controls & Result */}
                <div className="flex flex-col gap-6 justify-center">
                    {!uploadPreview && (
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 text-right">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <span className="bg-blue-200 p-1 rounded">💡</span> كيفاش كيخدم؟
                            </h4>
                            <ul className="list-disc list-inside text-sm space-y-1 opacity-80">
                                <li>الذكاء الاصطناعي كيحسن جودة الصورة</li>
                                <li>كيحيد الخلفية البيضاء</li>
                                <li>كيرسم الحدود بدقة (Vector Tracing)</li>
                                <li>كيعطيك ملف SVG قابل للتكبير بلا حدود</li>
                            </ul>
                        </div>
                    )}

                    {uploadPreview && !convertedSvg && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <button 
                                onClick={processUploadedImage}
                                disabled={isConverting}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
                            >
                                {isConverting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                {isConverting ? 'جاري السحر...' : 'بدا التحويل (Start Magic)'}
                            </button>
                            <p className="text-xs text-center text-slate-500">
                                * العملية كتاخد مابين 5 لـ 10 ثواني حسب تعقيد الصورة
                            </p>
                        </div>
                    )}

                    {convertedSvg && (
                        <div className="bg-green-50 border border-green-100 rounded-3xl p-8 text-center animate-fade-in flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="font-bold text-2xl text-slate-800 mb-6">صافي واجد!</h3>
                            
                            <div className="flex flex-col w-full gap-3">
                                <button 
                                    onClick={() => {
                                        const blob = new Blob([convertedSvg], { type: 'image/svg+xml' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'vector-logo.svg';
                                        a.click();
                                    }}
                                    className="bg-morocco-green text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#004d28] shadow-lg transition-colors w-full"
                                >
                                    <Download size={20} /> تحميل الملف (SVG)
                                </button>
                                <button 
                                    onClick={() => setEditingLogo({ 
                                        id: 'uploaded', 
                                        imageUrl: uploadPreview!, 
                                        style: 'mix', 
                                        prompt: 'uploaded', 
                                        svgContent: convertedSvg 
                                    })}
                                    className="bg-white text-slate-700 border border-slate-200 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full"
                                >
                                    <Edit size={20} /> فتح فالمحرر (Editor)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Editor Modal */}
      {editingLogo && editingLogo.svgContent && (
        <LogoEditor 
            key={editingLogo.id}
            svgContent={editingLogo.svgContent} 
            onSave={(newSvg) => {
                // Future: Update state logic
            }}
            onClose={() => setEditingLogo(null)}
        />
      )}
      
      {/* Footer */}
      <footer className="text-center py-10 text-slate-400 text-sm font-medium border-t border-slate-200 bg-slate-50">
        <p dir="ltr">Made with ❤️ in Morocco & AI</p>
      </footer>
    </div>
  );
};

export default App;