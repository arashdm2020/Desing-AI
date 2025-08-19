"use client";
import { useState, useMemo, useRef, useEffect } from "react";

const cities = [
  "اردبیل","تهران","اصفهان","شیراز","یزد","مشهد","تبریز","رشت","ساری","اهواز","بندرعباس","بوشهر","کرمان","کرمانشاه","همدان","قم","قزوین","ارومیه","سنندج","زاهدان",
];

type Scores = {
  mabhas: number;
  overall: number;
  standards: number;
  structural: number;
} | null;

function Circle({ label, value, color, dash }: { label: string; value?: number; color: string; dash: (v?: number) => string }) {
  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-28 h-28 p-2">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 rounded-full blur-sm"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg ring-1 ring-white/20">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path className="text-slate-200" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 110 32 16 16 0 010-32z"/>
            <path className={color} strokeDasharray={dash(value)} strokeLinecap="round" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 110 32 16 16 0 010-32z"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-800">
            {Math.round(Number(value || 0))}%
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-slate-700 text-center group-hover:text-slate-900 transition-colors duration-200">{label}</div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [city, setCity] = useState<string>("اردبیل");
  const [orientation, setOrientation] = useState<"north" | "south" | "unknown">("north");
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<string>("");
  const [scores, setScores] = useState<Scores>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = useMemo(() => !!file && !!city && !!orientation, [file, city, orientation]);

  const loadingSteps = [
    "در حال بررسی نقشه",

      "در حال بررسی نقشه",
      "پردازش اطلاعات",
      "بررسی مطابقت با قوانین",
      "استاندارد",
      "اصول طراحی معماری",
      "تحلیل فنی",
      "تحلیل اقلیمی",
  ];

  useEffect(() => {
    if (loading && loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  useEffect(() => {
    if (analysis && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysis]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [loading, loadingSteps.length]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setAnalysis("");
    setScores(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("city", city);
      form.append("orientation", orientation);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnalysis(data.text ?? "");
      setScores(data.scores ?? null);
    } catch (err: any) {
      setAnalysis(`خطا در درخواست: ${String(err?.message || err)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setCity("اردبیل");
    setOrientation("north");
    formRef.current?.reset();
    setAnalysis("");
    setScores(null);
  }

  function dash(val?: number) {
    const p = Math.max(0, Math.min(100, Number(val || 0))) / 100;
    const circumference = 2 * Math.PI * 16; // r=16
    return `${p * circumference} ${circumference}`;
  }

  return (
    <div dir="rtl" className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm ring-1 ring-slate-200/50 rounded-2xl p-4 sm:p-6 shadow-lg mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
              <span className="text-slate-500 text-xs font-medium">نسخه بتا</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">
              پروژه تحلیل نقشه‌های معماری
              <br />
              <span className="text-slate-700">
                با هوش مصنوعی
              </span>
            </h1>
            
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-3">
              قدرت پردازش مستقیم از پیشرفته‌ترین مدل‌های هوش مصنوعی جهان
            </p>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span className="text-slate-700 text-xs font-medium">GPT-5</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span className="text-slate-700 text-xs font-medium">Gemini</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span className="text-slate-700 text-xs font-medium">Grok</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span className="text-slate-700 text-xs font-medium">DeepSeek</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm ring-1 ring-white/20 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">آپلود نقشه برای تحلیل</h2>
            <p className="text-slate-600 text-lg">یک تصویر از پلان خود را انتخاب کنید (JPG/PNG)</p>
          </div>

          <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3 text-right">فایل نقشه</label>
              <div className="relative">
                <input type="file" accept="image/*" onChange={onFileChange}
                  className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-sky-500 file:to-blue-600 file:text-white hover:file:from-sky-600 hover:file:to-blue-700 cursor-pointer transition-all duration-200" />
              </div>
              
              {preview && (
                <div className="mt-4 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-white rounded-2xl p-4 ring-1 ring-slate-200/50 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">پیش‌نمایش نقشه</span>
                      <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreview(""); }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative overflow-hidden rounded-xl">
                      <img 
                        src={preview} 
                        alt="preview" 
                        className="w-full h-24 object-contain object-center hover:scale-105 transition-transform duration-300 cursor-zoom-in" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 text-right">شهر پروژه</label>
                <select 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="w-full rounded-2xl bg-white/50 backdrop-blur-sm text-slate-900 ring-1 ring-slate-200/50 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-base h-14 px-4 transition-all duration-200 hover:ring-slate-300/50"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 text-right">جهت‌گیری بنا</label>
                <select 
                  value={orientation} 
                  onChange={(e) => setOrientation(e.target.value as any)} 
                  className="w-full rounded-2xl bg-white/50 backdrop-blur-sm text-slate-900 ring-1 ring-slate-200/50 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-base h-14 px-4 transition-all duration-200 hover:ring-slate-300/50"
                >
                  <option value="north">شمالی</option>
                  <option value="south">جنوبی</option>
                  <option value="unknown">نمی‌دانم / نامشخص</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                بازنشانی
              </button>
              <button 
                type="submit" 
                disabled={!canSubmit || loading} 
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-white font-semibold shadow-lg hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading && (
                  <svg className="-ms-1 me-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"></circle>
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"></path>
                  </svg>
                )}
                <span className="text-lg">آپلود و تحلیل</span>
              </button>
            </div>
          </form>
        </div>

        {loading && (
          <div ref={loadingRef} className="bg-white/80 backdrop-blur-sm ring-1 ring-white/20 rounded-3xl p-8 sm:p-10 shadow-xl mt-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-full blur-xl"></div>
                  <svg className="relative mx-auto h-16 w-16 text-sky-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"></circle>
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{loadingSteps[loadingStep]}</h3>
                <div className="w-80 bg-slate-200/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                    style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 mt-3">لطفاً صبر کنید...</p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div ref={resultsRef} className="bg-white/80 backdrop-blur-sm ring-1 ring-white/20 rounded-3xl p-8 sm:p-10 shadow-xl mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">نتیجه تحلیل</h2>
              <button 
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 px-4 py-2.5 hover:from-slate-200 hover:to-slate-300 transition-all duration-200 shadow-sm" 
                onClick={() => navigator.clipboard.writeText(analysis)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                کپی متن
              </button>
            </div>
            <article className="prose prose-slate max-w-none prose-p:leading-8 text-justify prose-headings:text-slate-900 prose-p:text-slate-700" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, "<br/>") }} />

            {scores && (
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <Circle label="نمره مباحث" value={scores.mabhas} color="text-sky-500" dash={dash} />
                <Circle label="نمره کلی" value={scores.overall} color="text-green-500" dash={dash} />
                <Circle label="استانداردها" value={scores.standards} color="text-indigo-500" dash={dash} />
                <Circle label="سازه-معماری" value={scores.structural} color="text-amber-500" dash={dash} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
