import { NextResponse } from "next/server";
import OpenAI from "openai";

// Disable the default body parsing; using formData in App Router handles files natively
export const runtime = "nodejs";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa expects binary string
  return Buffer.from(binary, "binary").toString("base64");
}

function extractScores(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const last = lines[lines.length - 1] ?? "";
  
  // Try multiple regex patterns to match different formats
  const patterns = [
    /نمره مباحث\s*:\s*(\d{1,3})\/100\s*\|\s*نمره کلی\s*:\s*(\d{1,3})\/100\s*\|\s*نمره استانداردها\s*:\s*(\d{1,3})\/100\s*\|\s*نمره سازه\s*-\s*معماری\s*:\s*(\d{1,3})\/100/,
    /نمره مباحث\s*(\d{1,3})\/100\s*\|\s*نمره کلی\s*(\d{1,3})\/100\s*\|\s*نمره استانداردها\s*(\d{1,3})\/100\s*\|\s*نمره سازه\s*-\s*معماری\s*(\d{1,3})\/100/,
    /نمره مباحث\s*(\d{1,3})\/100\s*\|\s*نمره کلی\s*(\d{1,3})\/100\s*\|\s*نمره استانداردها\s*(\d{1,3})\/100\s*\|\s*نمره سازه\s*معماری\s*(\d{1,3})\/100/,
  ];
  
  for (const regex of patterns) {
    const m = last.match(regex);
    if (m) {
      const toClamp = (v: string) => Math.max(0, Math.min(100, parseInt(v, 10) || 0));
      const scores = {
        mabhas: toClamp(m[1]),
        overall: toClamp(m[2]),
        standards: toClamp(m[3]),
        structural: toClamp(m[4]),
      } as const;
      const body = lines.slice(0, -1).join("\n");
      return { text: body, scores } as const;
    }
  }
  
  // If no pattern matches, return text without scores
  return { text, scores: null } as const;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const city = String(form.get("city") || "تهران");
    const orientation = String(form.get("orientation") || "unknown");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "فایل ارسال نشده است." }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(arrayBuf);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text:
              "شما یک کارشناس ارشد معماری و کنترل ضوابط هستید. پاسخ را فقط به زبان فارسی، خلاقانه، دقیق و جسورانه بنویس. " +
              "خروجی باید دقیقاً هفت پاراگرافِ متوالی باشد با موضوعات متمایز: 1) برداشت تصویری و سازمان‌دهی فضاها، 2) سیرکولاسیون و پیوستگی مسیرها، 3) کارکرد و کیفیت فضاییِ مشاهده‌شده، 4) ریسک‌ها و ناهماهنگی‌های محتمل صرفاً بر اساس شواهد تصویری، 5) پیشنهادهای اصلاحی مکان‌محور، 6) نورگیری و مسیر خورشید بر پایه شهر و جهت‌گیری بنا با برآورد عددی ساده و توصیه عمق سایه‌بان/عقب‌نشینی، 7) راهکارهای اقلیمیِ تکمیلی برای پوسته و تهویه متناسب با همان شهر. " +
              "هر پاراگراف حداقل هفت جمله داشته باشد تا تحلیل بسط یابد و از تکرار مفاهیم پرهیز شود. " +
              "کاملاً مبتنی بر تصویر بنویس؛ هیچ فرضیه‌ای فراتر از آنچه دیده می‌شود نزن. هرجا اندازه یا نسبت از نقشه قابل خواندن است، با واحد (cm/m) و به‌صورت تقریبی ذکر کن؛ اگر خوانا نیست، صراحتاً بگو «در تصویر مشخص نیست». " +
              "برای ارجاع مکانی از توصیف‌های فضایی استفاده کن (مثل اتاق شمال‌غربی، راهروی مرکزی، کنج جنوب‌شرقی، مجاورت ورودی). " +
              "اشاره به خروج اضطراری در کل پاسخ حداکثر یک جمله باشد. اشاره به بازشو/پنجره/در فقط در دو پاراگراف اقلیمی/نورگیری مجاز است و در سایر پاراگراف‌ها به حداقل برسد. از نقل‌قول شناسه/نام قوانین و کپیِ متن JSON اکیداً خودداری کن. " +
              "از فهرست‌نویسی و شماره‌گذاری خودداری کن، واژگان کلی‌گرا مانند «مناسب/خوب» را به حداقل برسان و تکرار مفاهیم را پرهیز کن. در پاراگراف‌های پیشنهادی، دستورات کوتاه و مکان‌محور با ذکر موقعیت دقیق و عدد تقریبی بیاور. " +
              "در پایانِ متن، یک خط جداگانه و در همین قالب ثابت بنویس: «نمره مباحث: XX/100 | نمره کلی: YY/100 | نمره استانداردها: SS/100 | نمره سازه-معماری: SA/100». " +
              "برای هر یک از دو نمرهٔ فنیِ «استانداردها» و «سازه-معماری»، اگر در تصویر نشانهٔ صریحِ رعایت/ذکر استاندارد مرتبط دیدی (مثل برچسب رتبه حریق، قید مصالح استاندارد، ابعاد صریح مطابق ضابطه)، نمرهٔ آن معیار را کمتر از 40 قرار نده؛ در غیر این صورت بر مبنای شواهد عدد مناسب را گزارش کن.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
                    text:
          `این تصویر نقشه را فقط بر اساس آنچه در خود تصویر می‌بینی تحلیل کن. شهر پروژه: ${city}. ` +
          `جهت‌گیری بنا (بر اساس ورودی کاربر): ${orientation}. اگر در تصویر نشانه‌ای از شمال/جنوب دیدی که با این ورودی ناسازگار است، دلیل بصری را توضیح بده؛ در غیر این صورت بر همان مبنا تحلیل کن. ` +
          "قوانین زیر صرفاً معیار ذهنی تو هستند؛ در متن نام/شناسه هیچ قانونی را نیاور. " +
          "اشاره به خروج اضطراری در کل پاسخ حداکثر یک جمله باشد. اشاره به بازشو/پنجره/در فقط در دو پاراگراف اقلیمی/نورگیری مجاز است. اندازه‌ها را هرجا ممکن است تقریبی با واحد ذکر کن، وگرنه بنویس مشخص نیست. " +
          "هیچ JSON یا فهرست تولید نکن. دقیقاً هفت پاراگراف مفصل و کاملاً مبتنی بر تصویر بنویس و سپس یک خط نهایی شامل نمره طبق قالب خواسته‌شده اضافه کن.\n\n" +
          "قوانین (برای راهنمایی، نه نقل‌قول در خروجی): " +
          "بررسی ابعاد فضاها، فاصله‌گذاری مناسب، دسترسی‌های اضطراری، نورگیری طبیعی، تهویه، عایق‌بندی حرارتی و صوتی، مقاومت در برابر آتش، دسترسی معلولین، و رعایت ضوابط شهرداری.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${b64}` },
          },
        ],
      },
    ];

    const completion = await client.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages,
      max_tokens: 3000,
      temperature: 0.6,
      presence_penalty: 0.7,
      frequency_penalty: 0.7,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const { text, scores } = extractScores(content.trim());

    return NextResponse.json({ text, scores });
  } catch (error: any) {
    console.error("/api/analyze error", error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}