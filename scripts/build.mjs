/**
 * 多语言页面构建脚本 — denoise-site
 * 用法: node scripts/build.mjs  (项目根目录执行)
 * 生成: index.html + pricing.html（根目录 EN + zh/ja/ko/es/pt 子目录）+ sitemap.xml
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const BASE = "https://ai-noise-remover.pages.dev"; // TODO: 换成你的正式域名/pages.dev 地址
const PAGES = ["", "pricing.html"];
const ORDER = ["en", "zh", "ja", "ko", "es", "pt"];

/* ---------------- 语言字典 ---------------- */

const LANGS = {
  en: {
    name: "English", htmlLang: "en", ogLocale: "en_US", nav: "EN",
    meta: {
      title: "AI Noise Remover — Clean Audio Online Free, No Sign-Up",
      desc: "Remove background noise from audio in your browser. Free AI noise remover for voice recordings, podcasts and meetings. Files never leave your device. No account needed.",
      ogTitle: "AI Noise Remover — Clean Audio in Your Browser",
      ogDesc: "Remove background noise from recordings right in your browser. Private, free, no sign-up."
    },
    hero: { title: "AI Noise Remover", sub: "Upload a recording, get clean voice in seconds. Everything runs in your browser — your audio never leaves your device. Free, no sign-up." },
    navPricing: "Pricing",
    tool: {
      title: "Clean your audio now",
      strength: "Noise reduction strength",
      low: "Gentle", medium: "Balanced", high: "Aggressive",
      download: "↓ Download cleaned audio (WAV)", before: "Before", after: "After"
    },
    ui: {
      choose: "Choose an audio file", drop: "or drag & drop an audio / video file here",
      analyzing: "Analyzing noise profile…",
      denoising: "Denoising… {p}%",
      done: "Done ✓ Compare the two players, then download.",
      noAudio: "Could not find an audio track in this file.",
      decodeFail: "This file format is not supported — try MP3, WAV, M4A, OGG or WebM."
    },
    steps: {
      title: "How it works", items: [
        ["1", "Upload", "Drop in a voice memo, podcast take, interview or lecture recording."],
        ["2", "We analyze", "The noise profile of your recording is measured right in your browser."],
        ["3", "Download", "Get a clean WAV file in seconds. Nothing was ever uploaded to a server."]
      ]
    },
    why: {
      title: "Why AI Noise Remover",
      items: [
        ["🔒", "100% private", "Denoising runs on your own device. Your audio never touches a server."],
        ["⚡", "No waiting", "No queues, no uploads, no accounts. Most files finish in seconds."],
        ["🎙️", "Made for voice", "Tuned for podcasts, voice memos, online classes and interviews."]
      ]
    },
    usecases: {
      title: "Who it's for", lead: "Background hiss, fan hum, room echo hiss, electrical buzz — cleaned automatically.",
      items: ["Podcasters cleaning up raw takes", "Students clearing up lecture recordings", "Journalists polishing interview audio", "Remote workers fixing meeting recordings"]
    },
    faq: [
      ["Is my audio uploaded anywhere?", "No. All processing happens locally in your browser using JavaScript. Your file never leaves your device."],
      ["What formats are supported?", "MP3, WAV, M4A, OGG, WebM and most common audio or video formats. Output is a standard WAV file."],
      ["Is it really free?", "Yes. The browser-based noise remover is completely free. A paid plan with studio-grade AI enhancement is coming soon."],
      ["How good is the quality?", "It excels at removing steady background noise — hiss, fan hum, air conditioning, electrical buzz — while keeping voices clear and natural."],
      ["Does it work on my phone?", "Yes, in any modern browser. Very long recordings may need a desktop for best performance."]
    ],
    pricing: {
      title: "Pricing", freeName: "Free", freePrice: "$0",
      freeItems: ["Browser noise removal", "Unlimited files", "No sign-up"],
      proName: "Pro", proPrice: "Coming soon",
      proItems: ["Studio-grade AI enhancement (cloud)", "Priority processing", "Batch files"],
      cta: "Coming soon", freeCta: "Use it now"
    }
  },
  zh: {
    name: "简体中文", htmlLang: "zh-CN", ogLocale: "zh_CN", nav: "中文",
    meta: {
      title: "AI 降噪工具 — 浏览器在线去除录音噪音，免费无需注册",
      desc: "在浏览器里一键去除录音中的背景噪音。适用于人声、播客、网课、会议录音。文件不上传服务器，100% 本地处理，完全免费。",
      ogTitle: "AI 降噪工具 — 浏览器里一键去掉录音噪音",
      ogDesc: "录音有底噪？浏览器本地降噪，文件不上传，免费无需注册。"
    },
    hero: { title: "AI 降噪工具", sub: "上传录音，几秒得到干净人声。全部在你的浏览器里完成——音频永远不离开你的设备。免费，无需注册。" },
    navPricing: "定价",
    tool: {
      title: "立即清理你的音频",
      strength: "降噪强度",
      low: "轻度", medium: "均衡", high: "强力",
      download: "↓ 下载降噪后音频（WAV）", before: "原始", after: "降噪后"
    },
    ui: {
      choose: "选择音频文件", drop: "或直接把音频/视频文件拖到这里",
      analyzing: "正在分析噪音特征…",
      denoising: "正在降噪… {p}%",
      done: "完成 ✓ 对比上下两个播放器，满意就下载。",
      noAudio: "这个文件里没有找到音频轨道。",
      decodeFail: "暂不支持该格式——请换 MP3、WAV、M4A、OGG 或 WebM。"
    },
    steps: {
      title: "怎么用", items: [
        ["1", "上传", "拖入语音备忘、播客素材、采访或网课录音。"],
        ["2", "自动分析", "在浏览器里直接测量录音的噪音特征。"],
        ["3", "下载", "几秒拿到干净的 WAV 文件。全程没有任何上传。"]
      ]
    },
    why: {
      title: "为什么选 AI 降噪工具",
      items: [
        ["🔒", "100% 隐私", "降噪在你自己的设备上运行，音频不经过任何服务器。"],
        ["⚡", "无需等待", "没有排队、没有上传、不用注册。大多数文件几秒完成。"],
        ["🎙️", "为人声优化", "针对播客、语音备忘、网课和采访录音专门调校。"]
      ]
    },
    usecases: {
      title: "适合谁用", lead: "底噪、风扇声、电流声、设备嘶嘶声——自动清除。",
      items: ["播客主清理原始素材", "学生清理网课录音", "记者整理采访音频", "远程办公修复会议录音"]
    },
    faq: [
      ["我的音频会被上传吗？", "不会。全部处理都在你浏览器的本地完成，文件从不离开你的设备。"],
      ["支持哪些格式？", "MP3、WAV、M4A、OGG、WebM 以及绝大多数常见音视频格式。输出为标准 WAV 文件。"],
      ["真的免费吗？", "是。浏览器端降噪完全免费。专业级 AI 增强的付费方案即将推出。"],
      ["效果怎么样？", "对持续性背景噪音效果最好——嘶嘶声、风扇声、空调声、电流声——同时保持人声清晰自然。"],
      ["手机上能用吗？", "可以，任何现代浏览器都行。超长录音建议用电脑处理以获得最佳性能。"]
    ],
    pricing: {
      title: "定价", freeName: "免费版", freePrice: "$0",
      freeItems: ["浏览器端降噪", "文件数量不限", "无需注册"],
      proName: "专业版", proPrice: "即将推出",
      proItems: ["专业级 AI 增强（云端）", "优先处理", "批量文件"],
      cta: "即将推出", freeCta: "立即使用"
    }
  },
  ja: {
    name: "日本語", htmlLang: "ja", ogLocale: "ja_JP", nav: "日本語",
    meta: {
      title: "AI ノイズリムーバー — ブラウザで録音ノイズを無料除去、登録不要",
      desc: "ブラウザ上で録音の背景ノイズをワンクリック除去。ポッドキャスト、オンライン授業、会議録音に。ファイルはアップロードされず、100%端末内処理・完全無料。",
      ogTitle: "AI ノイズリムーバー — ブラウザでノイズ除去",
      ogDesc: "録音のノイズをブラウザ内で除去。ファイル送信なし、無料・登録不要。"
    },
    hero: { title: "AI ノイズリムーバー", sub: "録音をアップロードして、数秒でクリアな音声に。すべてブラウザ内で処理され、音声は端末の外に出ません。無料・登録不要。" },
    navPricing: "料金",
    tool: {
      title: "今すぐ音声をクリーンアップ",
      strength: "ノイズ除去の強さ",
      low: "軽め", medium: "バランス", high: "強力",
      download: "↓ クリーンな音声をダウンロード（WAV）", before: "処理前", after: "処理後"
    },
    ui: {
      choose: "音声ファイルを選択", drop: "または音声・動画ファイルをここにドロップ",
      analyzing: "ノイズ特性を解析中…",
      denoising: "ノイズ除去中… {p}%",
      done: "完了 ✓ 2つのプレーヤーを比較して、よければダウンロード。",
      noAudio: "このファイルに音声トラックが見つかりません。",
      decodeFail: "この形式は未対応です。MP3・WAV・M4A・OGG・WebM をお試しください。"
    },
    steps: {
      title: "使い方", items: [
        ["1", "アップロード", "ボイスメモ、ポッドキャスト、インタビュー、講義録音をドロップ。"],
        ["2", "自動解析", "録音のノイズ特性をブラウザ内で測定します。"],
        ["3", "ダウンロード", "数秒でクリーンな WAV を取得。アップロードは一切ありません。"]
      ]
    },
    why: {
      title: "選ばれる理由",
      items: [
        ["🔒", "100% プライベート", "処理は自分の端末上で実行。音声はサーバーに送られません。"],
        ["⚡", "待ち時間ゼロ", "順番待ち・アップロード・アカウント登録は不要。大半のファイルは数秒で完了。"],
        ["🎙️", "音声に最適化", "ポッドキャスト・ボイスメモ・オンライン授業・インタビュー向けに調整。"]
      ]
    },
    usecases: {
      title: "こんな方に", lead: "ハム音、ファン音、ノイズ、電気的雑音を自動除去。",
      items: ["ポッドキャストの素材整理", "講義録音の聞き取り改善", "インタビュー音声のノイズ除去", "オンライン会議録音の修復"]
    },
    faq: [
      ["音声はアップロードされますか？", "いいえ。すべての処理はブラウザ内でローカルに行われ、ファイルは端末の外に出ません。"],
      ["対応形式は？", "MP3・WAV・M4A・OGG・WebM など主要な音声・動画形式に対応。出力は標準 WAV です。"],
      ["本当に無料？", "はい。ブラウザ版ノイズ除去は完全無料。スタジオ品質の AI 強化は近日公開予定です。"],
      ["品質はどうですか？", "定常的な背景ノイズ（ヒス音、ファン音、エアコン、電気的雑音）の除去に優れ、音声はクリアで自然なまま保たれます。"],
      ["スマホでも使えますか？", "はい、最新のブラウザなら動作します。長時間録音は PC での処理を推奨します。"]
    ],
    pricing: {
      title: "料金", freeName: "無料", freePrice: "$0",
      freeItems: ["ブラウザ内ノイズ除去", "ファイル数無制限", "登録不要"],
      proName: "Pro", proPrice: "近日公開",
      proItems: ["スタジオ品質の AI 強化（クラウド）", "優先処理", "一括処理"],
      cta: "近日公開", freeCta: "今すぐ使う"
    }
  },
  ko: {
    name: "한국어", htmlLang: "ko", ogLocale: "ko_KR", nav: "한국어",
    meta: {
      title: "AI 노이즈 제거기 — 브라우저에서 무료로 배경 소음 제거, 가입 불필요",
      desc: "브라우저에서 클릭 한 번으로 녹음의 배경 소음을 제거하세요. 팟캐스트, 온라인 수업, 회의 녹음에 적합. 파일은 업로드되지 않으며 100% 기기 내 처리, 완전 무료입니다.",
      ogTitle: "AI 노이즈 제거기 — 브라우저에서 노이즈 제거",
      ogDesc: "녹음 노이즈를 브라우저 안에서 제거. 파일 업로드 없음, 무료·가입 불필요."
    },
    hero: { title: "AI 노이즈 제거기", sub: "녹음을 올리고 몇 초 만에 깨끗한 음성으로. 모든 처리는 브라우저에서 이루어지며 오디오는 기기를 벗어나지 않습니다. 무료, 가입 불필요." },
    navPricing: "요금",
    tool: {
      title: "지금 오디오를 정리하세요",
      strength: "노이즈 제거 강도",
      low: "약하게", medium: "균형", high: "강하게",
      download: "↓ 정리된 오디오 다운로드 (WAV)", before: "이전", after: "이후"
    },
    ui: {
      choose: "오디오 파일 선택", drop: "또는 오디오/동영상 파일을 여기로 끌어다 놓기",
      analyzing: "노이즈 특성 분석 중…",
      denoising: "노이즈 제거 중… {p}%",
      done: "완료 ✓ 두 플레이어를 비교한 후 다운로드하세요.",
      noAudio: "이 파일에서 오디오 트랙을 찾을 수 없습니다.",
      decodeFail: "이 형식은 지원되지 않습니다. MP3, WAV, M4A, OGG, WebM을 사용해 보세요."
    },
    steps: {
      title: "사용 방법", items: [
        ["1", "업로드", "음성 메모, 팟캐스트, 인터뷰, 강의 녹음을 끌어다 놓기."],
        ["2", "자동 분석", "녹음의 노이즈 특성을 브라우저에서 직접 측정합니다."],
        ["3", "다운로드", "몇 초 만에 깨끗한 WAV 획득. 업로드는 전혀 없습니다."]
      ]
    },
    why: {
      title: "왜 AI 노이즈 제거기인가",
      items: [
        ["🔒", "100% 프라이빗", "처리는 자신의 기기에서 실행됩니다. 오디오는 서버로 전송되지 않습니다."],
        ["⚡", "대기 없음", "줄 서기, 업로드, 계정 등록이 없습니다. 대부분의 파일은 몇 초 만에 완료."],
        ["🎙️", "음성 최적화", "팟캐스트, 음성 메모, 온라인 수업, 인터뷰에 맞춰 조정되었습니다."]
      ]
    },
    usecases: {
      title: "이런 분께", lead: "배경 잡음, 팬 소음, 전기 잡음을 자동으로 제거합니다.",
      items: ["팟캐스터의 원본 정리", "학생의 강의 녹음 정리", "기자의 인터뷰 오디오 정리", "재택근무자의 회의 녹음 복구"]
    },
    faq: [
      ["오디오가 업로드되나요?", "아니요. 모든 처리는 브라우저에서 로컬로 진행되며 파일은 기기를 벗어나지 않습니다."],
      ["지원 형식은?", "MP3, WAV, M4A, OGG, WebM 등 대부분의 일반 오디오/비디오 형식을 지원합니다. 출력은 표준 WAV입니다."],
      ["정말 무료인가요?", "네. 브라우저 기반 노이즈 제거는 완전 무료입니다. 스튜디오급 AI 향상 유료 플랜이 곧 출시됩니다."],
      ["품질은 어떤가요?", "지속적인 배경 소음(히스, 팬 소음, 에어컨, 전기 잡음) 제거에 탁월하며 음성은 명확하고 자연스럽게 유지됩니다."],
      ["휴대폰에서도 되나요?", "네, 최신 브라우저라면 가능합니다. 매우 긴 녹음은 PC에서 처리하는 것이 좋습니다."]
    ],
    pricing: {
      title: "요금", freeName: "무료", freePrice: "$0",
      freeItems: ["브라우저 노이즈 제거", "파일 수 무제한", "가입 불필요"],
      proName: "Pro", proPrice: "출시 예정",
      proItems: ["스튜디오급 AI 향상 (클라우드)", "우선 처리", "일괄 처리"],
      cta: "출시 예정", freeCta: "지금 사용"
    }
  },
  es: {
    name: "Español", htmlLang: "es", ogLocale: "es_ES", nav: "ES",
    meta: {
      title: "AI Noise Remover — Elimina ruido de audio online gratis, sin registro",
      desc: "Elimina el ruido de fondo de tus grabaciones en el navegador. Removedor de ruido gratis para voz, podcasts y reuniones. Los archivos nunca salen de tu dispositivo.",
      ogTitle: "AI Noise Remover — Audio limpio en tu navegador",
      ogDesc: "Elimina ruido de fondo directamente en tu navegador. Privado, gratis, sin registro."
    },
    hero: { title: "AI Noise Remover", sub: "Sube una grabación y obtén voz limpia en segundos. Todo funciona en tu navegador: tu audio nunca sale de tu dispositivo. Gratis, sin registro." },
    navPricing: "Precios",
    tool: {
      title: "Limpia tu audio ahora",
      strength: "Intensidad de reducción",
      low: "Suave", medium: "Equilibrado", high: "Agresivo",
      download: "↓ Descargar audio limpio (WAV)", before: "Antes", after: "Después"
    },
    ui: {
      choose: "Elige un archivo de audio", drop: "o arrastra y suelta un archivo de audio o video aquí",
      analyzing: "Analizando el perfil de ruido…",
      denoising: "Reduciendo ruido… {p}%",
      done: "Listo ✓ Compara los dos reproductores y descarga.",
      noAudio: "No se encontró pista de audio en este archivo.",
      decodeFail: "Formato no compatible — prueba MP3, WAV, M4A, OGG o WebM."
    },
    steps: {
      title: "Cómo funciona", items: [
        ["1", "Sube", "Arrastra una nota de voz, podcast, entrevista o clase grabada."],
        ["2", "Analizamos", "El perfil de ruido se mide directamente en tu navegador."],
        ["3", "Descarga", "Obtén un WAV limpio en segundos. Nunca se subió nada a ningún servidor."]
      ]
    },
    why: {
      title: "Por qué AI Noise Remover",
      items: [
        ["🔒", "100% privado", "La reducción de ruido funciona en tu propio dispositivo. Tu audio nunca toca un servidor."],
        ["⚡", "Sin esperas", "Sin colas, sin subidas, sin cuentas. La mayoría de archivos terminan en segundos."],
        ["🎙️", "Hecho para voz", "Afinado para podcasts, notas de voz, clases online y entrevistas."]
      ]
    },
    usecases: {
      title: "Para quién es", lead: "Siseo, zumbido de ventilador, zumbido eléctrico: eliminados automáticamente.",
      items: ["Podcasters que limpian tomas en bruto", "Estudiantes que aclaran clases grabadas", "Periodistas que pulen entrevistas", "Trabajadores remotos que arreglan reuniones"]
    },
    faq: [
      ["¿Mi audio se sube a algún sitio?", "No. Todo el procesamiento ocurre localmente en tu navegador. Tu archivo nunca sale de tu dispositivo."],
      ["¿Qué formatos admite?", "MP3, WAV, M4A, OGG, WebM y la mayoría de formatos comunes de audio o video. La salida es un WAV estándar."],
      ["¿Es realmente gratis?", "Sí. El removedor de ruido en el navegador es completamente gratis. Pronto llegará un plan de pago con mejora AI de calidad de estudio."],
      ["¿Qué tan buena es la calidad?", "Elimina muy bien el ruido constante: siseo, ventilador, aire acondicionado, zumbido eléctrico, manteniendo las voces claras y naturales."],
      ["¿Funciona en mi móvil?", "Sí, en cualquier navegador moderno. Grabaciones muy largas pueden requerir un ordenador."]
    ],
    pricing: {
      title: "Precios", freeName: "Gratis", freePrice: "$0",
      freeItems: ["Reducción de ruido en el navegador", "Archivos ilimitados", "Sin registro"],
      proName: "Pro", proPrice: "Pronto",
      proItems: ["Mejora AI de calidad de estudio (nube)", "Procesamiento prioritario", "Archivos por lotes"],
      cta: "Pronto", freeCta: "Úsalo ahora"
    }
  },
  pt: {
    name: "Português", htmlLang: "pt", ogLocale: "pt_BR", nav: "PT",
    meta: {
      title: "AI Noise Remover — Remova ruído de áudio online grátis, sem cadastro",
      desc: "Remova o ruído de fundo das suas gravações no navegador. Removedor de ruído grátis para voz, podcasts e reuniões. Os arquivos nunca saem do seu dispositivo.",
      ogTitle: "AI Noise Remover — Áudio limpo no seu navegador",
      ogDesc: "Remova ruído de fundo direto no navegador. Privado, grátis, sem cadastro."
    },
    hero: { title: "AI Noise Remover", sub: "Envie uma gravação e receba voz limpa em segundos. Tudo roda no seu navegador — seu áudio nunca sai do seu dispositivo. Grátis, sem cadastro." },
    navPricing: "Preços",
    tool: {
      title: "Limpe seu áudio agora",
      strength: "Intensidade da redução",
      low: "Leve", medium: "Equilibrado", high: "Agressivo",
      download: "↓ Baixar áudio limpo (WAV)", before: "Antes", after: "Depois"
    },
    ui: {
      choose: "Escolha um arquivo de áudio", drop: "ou arraste e solte um arquivo de áudio ou vídeo aqui",
      analyzing: "Analisando o perfil de ruído…",
      denoising: "Reduzindo ruído… {p}%",
      done: "Pronto ✓ Compare os dois players e baixe.",
      noAudio: "Não foi encontrada faixa de áudio neste arquivo.",
      decodeFail: "Formato não suportado — tente MP3, WAV, M4A, OGG ou WebM."
    },
    steps: {
      title: "Como funciona", items: [
        ["1", "Envie", "Solte um áudio de voz, podcast, entrevista ou aula gravada."],
        ["2", "Analisamos", "O perfil de ruído é medido direto no seu navegador."],
        ["3", "Baixe", "Receba um WAV limpo em segundos. Nada foi enviado a servidor algum."]
      ]
    },
    why: {
      title: "Por que AI Noise Remover",
      items: [
        ["🔒", "100% privado", "A redução de ruído roda no seu próprio dispositivo. Seu áudio nunca toca um servidor."],
        ["⚡", "Sem espera", "Sem filas, sem uploads, sem contas. A maioria dos arquivos termina em segundos."],
        ["🎙️", "Feito para voz", "Ajustado para podcasts, áudios de voz, aulas online e entrevistas."]
      ]
    },
    usecases: {
      title: "Para quem é", lead: "Chiado, zumbido de ventilador, ruído elétrico — removidos automaticamente.",
      items: ["Podcasters limpando gravações brutas", "Estudiantes limpando aulas gravadas", "Jornalistas polindo entrevistas", "Trabalhadores remotos consertando gravações de reuniões"]
    },
    faq: [
      ["Meu áudio é enviado para algum lugar?", "Não. Todo o processamento acontece localmente no seu navegador. Seu arquivo nunca sai do seu dispositivo."],
      ["Quais formatos são aceitos?", "MP3, WAV, M4A, OGG, WebM e a maioria dos formatos comuns de áudio ou vídeo. A saída é um WAV padrão."],
      ["É realmente grátis?", "Sim. O removedor de ruído no navegador é totalmente grátis. Um plano pago com aprimoramento IA de qualidade de estúdio chega em breve."],
      ["Como é a qualidade?", "Excelente para remover ruído constante — chiado, ventilador, ar-condicionado, ruído elétrico — mantendo as vozes claras e naturais."],
      ["Funciona no celular?", "Sim, em qualquer navegador moderno. Gravações muito longas podem exigir um computador."]
    ],
    pricing: {
      title: "Preços", freeName: "Grátis", freePrice: "$0",
      freeItems: ["Redução de ruído no navegador", "Arquivos ilimitados", "Sem cadastro"],
      proName: "Pro", proPrice: "Em breve",
      proItems: ["Aprimoramento IA de estúdio (nuvem)", "Processamento prioritário", "Arquivos em lote"],
      cta: "Em breve", freeCta: "Usar agora"
    }
  }
};

/* ---------------- 模板 ---------------- */

function urlOf(lang, page) {
  return lang === "en" ? `${BASE}/${page}` : `${BASE}/${lang}/${page}`;
}
function hreflangs(page) {
  return ORDER.map((l) => `  <link rel="alternate" hreflang="${LANGS[l].htmlLang}" href="${urlOf(l, page)}" />`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${urlOf("en", page)}" />`)
    .join("\n");
}

function toolBlock(L) {
  return `
<section class="tool" id="tool">
  <h2>${L.tool.title}</h2>
  <div id="dropZone" class="dropzone">
    <p class="dz-main">🎵 ${L.ui.choose}</p>
    <p class="dz-sub">${L.ui.drop}</p>
    <input type="file" id="file" accept="audio/*,video/*" />
  </div>
  <div class="controls">
    <label for="strength">${L.tool.strength}</label>
    <select id="strength">
      <option value="low">${L.tool.low}</option>
      <option value="medium" selected>${L.tool.medium}</option>
      <option value="high">${L.tool.high}</option>
    </select>
  </div>
  <p id="status" class="status" aria-live="polite"></p>
  <div class="compare">
    <div class="cmp"><h3>${L.tool.before}</h3><audio id="playerBefore" controls></audio></div>
    <div class="cmp"><h3>${L.tool.after}</h3><audio id="playerAfter" controls></audio></div>
  </div>
  <a id="download" class="btn" style="display:none" href="#">${L.tool.download}</a>
</section>`;
}

function faqJsonLd(L) {
  const items = L.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }));
  return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items }, null, 1);
}

function pageHtml(langKey, isPricing) {
  const L = LANGS[langKey];
  const page = isPricing ? "pricing.html" : "";
  const m = L.meta;
  const title = isPricing ? `${L.pricing.title} — ${L.hero.title}` : m.title;
  const url = urlOf(langKey, page);
  const canonical = url;
  const navLangs = ORDER.map((k) =>
    k === langKey ? `<span class="lang cur">${LANGS[k].nav}</span>` : `<a class="lang" href="${k === "en" ? (isPricing ? "/pricing.html" : "/") : `/${k}/${page}`}">${LANGS[k].nav}</a>`
  ).join("\n      ");

  const body = isPricing ? pricingBody(L) : indexBody(L);

  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${m.desc}" />
  <link rel="canonical" href="${canonical}" />
${hreflangs(page)}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${isPricing ? L.pricing.title : m.ogTitle}" />
  <meta property="og:description" content="${isPricing ? m.ogDesc : m.ogDesc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="${L.ogLocale}" />
${ORDER.filter((k) => k !== langKey).map((k) => `  <meta property="og:locale:alternate" content="${LANGS[k].ogLocale}" />`).join("\n")}
  <link rel="stylesheet" href="/css/style.css" />
  <script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: L.hero.title,
  url,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
}, null, 1)}
  </script>
${isPricing ? "" : `  <script type="application/ld+json">\n${faqJsonLd(L)}\n  </script>\n`}
</head>
<body>
  <header class="top">
    <a class="brand" href="${langKey === "en" ? "/" : `/${langKey}/`}">🔇 ${L.hero.title}</a>
    <nav class="topnav">
      <a href="${langKey === "en" ? "/pricing.html" : `/${langKey}/pricing.html`}">${L.navPricing}</a>
      <a href="${langKey === "en" ? "/#tool" : `/${langKey}/#tool`}">${L.ui.choose}</a>
      <span class="langs">
      ${navLangs}
      </span>
    </nav>
  </header>
  <main>
${body}
  </main>
  <footer>
    <p>© 2026 AI Noise Remover · <a href="${langKey === "en" ? "/pricing.html" : `/${langKey}/pricing.html`}">${L.navPricing}</a></p>
  </footer>
${isPricing ? "" : `  <script>window.UI_STRINGS = ${JSON.stringify({
  choose: L.ui.choose, drop: L.ui.drop, analyzing: L.ui.analyzing, denoising: L.ui.denoising,
  done: L.ui.done, noAudio: L.ui.noAudio, decodeFail: L.ui.decodeFail,
  download: L.tool.download, before: L.tool.before, after: L.tool.after
})};</script>\n  <script src="/js/app.js" defer></script>\n`}
</body>
</html>`;
}

function indexBody(L) {
  return `    <section class="hero">
      <h1>${L.hero.title}</h1>
      <p class="sub">${L.hero.sub}</p>
      <a class="btn" href="#tool">${L.pricing.freeCta}</a>
    </section>
${toolBlock(L)}
    <section class="steps">
      <h2>${L.steps.title}</h2>
      <ol class="cards">
        ${L.steps.items.map(([n, t, d]) => `<li class="card"><span class="num">${n}</span><h3>${t}</h3><p>${d}</p></li>`).join("\n        ")}
      </ol>
    </section>
    <section class="why">
      <h2>${L.why.title}</h2>
      <div class="cards">
        ${L.why.items.map(([e, t, d]) => `<div class="card"><span class="emoji">${e}</span><h3>${t}</h3><p>${d}</p></div>`).join("\n        ")}
      </div>
    </section>
    <section class="usecases">
      <h2>${L.usecases.title}</h2>
      <p class="lead">${L.usecases.lead}</p>
      <ul>
        ${L.usecases.items.map((u) => `<li>${u}</li>`).join("\n        ")}
      </ul>
    </section>
    <section class="faq">
      <h2>FAQ</h2>
      ${L.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n      ")}
    </section>`;
}

function pricingBody(L) {
  const p = L.pricing;
  return `    <section class="hero">
      <h1>${p.title}</h1>
    </section>
    <section class="plans">
      <div class="plan">
        <h2>${p.freeName}</h2>
        <p class="price">${p.freePrice}</p>
        <ul>
          ${p.freeItems.map((i) => `<li>✓ ${i}</li>`).join("\n          ")}
        </ul>
        <a class="btn" href="${"/#tool"}">${p.freeCta}</a>
      </div>
      <div class="plan pro">
        <h2>${p.proName}</h2>
        <p class="price">${p.proPrice}</p>
        <ul>
          ${p.proItems.map((i) => `<li>✓ ${i}</li>`).join("\n          ")}
        </ul>
        <!-- TODO: Stripe Payment Link 按钮放这里
        <a class="btn buy" href="STRIPE_PAYMENT_LINK">${p.cta}</a> -->
        <span class="btn disabled">${p.cta}</span>
      </div>
    </section>`;
}

/* ---------------- 生成 ---------------- */

mkdirSync(join(ROOT, "css"), { recursive: true });
for (const k of ORDER) {
  const dir = k === "en" ? ROOT : join(ROOT, k);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), pageHtml(k, false));
  writeFileSync(join(dir, "pricing.html"), pageHtml(k, true));
}

const today = new Date().toISOString().slice(0, 10);
const sitemapUrls = PAGES.map((page) =>
  ORDER.map((k) => `  <url>
    <loc>${urlOf(k, page)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="${LANGS[k].htmlLang}" href="${urlOf(k, page)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf("en", page)}" />
  </url>`).join("\n")
).join("\n");

writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls}
</urlset>
`);

writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);

console.log("Built:", ORDER.map((k) => `${k}/(index|pricing)`).join(", "), "+ sitemap.xml + robots.txt");
