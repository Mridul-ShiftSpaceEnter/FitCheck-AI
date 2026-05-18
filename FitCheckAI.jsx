import { useState, useRef, useCallback, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCORE_CATEGORIES = [
  { key: "colorCoordination", label: "Color Coordination", icon: "🎨" },
  { key: "fitAndSilhouette",  label: "Fit & Silhouette",   icon: "✂️" },
  { key: "styleCoherence",    label: "Style Coherence",    icon: "✦"  },
  { key: "occasionScore",     label: "Occasion Match",     icon: "📍" },
  { key: "vibeScore",         label: "Vibe Alignment",     icon: "⚡" },
];

const MODE_OPTIONS = [
  { id: "general",      label: "Fit Check",   icon: "✦", desc: "Overall style rating" },
  { id: "dating",       label: "Dating Mode", icon: "♥", desc: "Swipe-right power"    },
  { id: "professional", label: "Work Mode",   icon: "◆", desc: "Interview ready?"     },
];

const TABS = [
  { id: "fitcheck", label: "FIT CHECK", icon: "✦" },
  { id: "wardrobe", label: "WARDROBE",  icon: "▣" },
  { id: "history",  label: "HISTORY",   icon: "◎" },
];

const CATEGORY_TAGS = ["Top","Bottom","Shoes","Outerwear","Accessory","Bag","Hat","Full Outfit"];

// ─── Gemini API helper ────────────────────────────────────────────────────────
// Calls your Next.js backend route (which holds the key safely)
async function callGemini(endpoint, body) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error");
  return data;
}

// ─── ScoreGauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score, size = 96, strokeWidth = 6 }) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (animated / 100) * circumference;
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const step = () => {
        s += 1.5;
        if (s >= score) { setAnimated(score); return; }
        setAnimated(Math.round(s));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 400);
    return () => clearTimeout(t);
  }, [score]);
  const color = score >= 80 ? "#F5C842" : score >= 60 ? "#E8A020" : "#E85520";
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" style={{ transition:"stroke 0.3s" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
        <span style={{ fontSize:22, fontWeight:700, color, fontFamily:"'Courier New',monospace", lineHeight:1 }}>{animated}</span>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", marginTop:1 }}>/100</span>
      </div>
    </div>
  );
}

// ─── CategoryBar ──────────────────────────────────────────────────────────────
function CategoryBar({ label, icon, score, index }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 200 + index * 120);
    return () => clearTimeout(t);
  }, [score, index]);
  const color = score >= 80 ? "#F5C842" : score >= 60 ? "#E8A020" : "#E85520";
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)", letterSpacing:"0.08em", fontFamily:"'Courier New',monospace" }}>
          {icon} {label.toUpperCase()}
        </span>
        <span style={{ fontSize:13, fontWeight:600, color, fontFamily:"'Courier New',monospace" }}>{score}</span>
      </div>
      <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:2,
          background:`linear-gradient(90deg,${color}88,${color})`,
          width:`${width}%`, transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)"
        }}/>
      </div>
    </div>
  );
}

// ─── ScorecardCanvas ──────────────────────────────────────────────────────────
function ScorecardCanvas({ result, image, mode }) {
  const canvasRef = useRef();
  const [generated, setGenerated] = useState(null);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 800; canvas.height = 1000;
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, 800, 1000);

    const img = new Image();
    img.onload = () => {
      // Outfit photo
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(40, 40, 340, 500, 12);
      else ctx.rect(40, 40, 340, 500);
      ctx.clip();
      ctx.drawImage(img, 40, 40, 340, 500);
      // Face privacy blur (top 25%)
      const blurGrad = ctx.createLinearGradient(40, 40, 40, 165);
      blurGrad.addColorStop(0, "rgba(10,10,10,0.88)");
      blurGrad.addColorStop(1, "rgba(10,10,10,0)");
      ctx.fillStyle = blurGrad;
      ctx.fillRect(40, 40, 340, 180);
      ctx.restore();

      // Score ring
      const cx = 600, cy = 200, r = 80;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
      const sc = result.overallScore >= 80 ? "#F5C842" : result.overallScore >= 60 ? "#E8A020" : "#E85520";
      ctx.strokeStyle = sc; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (result.overallScore/100)*Math.PI*2); ctx.stroke();
      ctx.fillStyle = sc; ctx.font = "bold 48px 'Courier New',monospace";
      ctx.textAlign = "center"; ctx.fillText(result.overallScore, cx, cy+16);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "11px 'Courier New',monospace";
      ctx.fillText("/100", cx, cy+36);

      // Verdict + vibe
      ctx.fillStyle = "#F0EDE8"; ctx.font = "bold 26px Georgia,serif";
      ctx.textAlign = "left"; ctx.fillText(result.verdict, 420, 340);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(420, 355, 200, 26, 4); ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px 'Courier New',monospace";
      ctx.fillText(`⚡ ${(result.vibeMatch||"").toUpperCase()}`, 432, 372);

      // Category bars
      SCORE_CATEGORIES.forEach((cat, i) => {
        const s = result.grades?.[cat.key] ?? 0;
        const y = 420 + i * 54;
        ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "10px 'Courier New',monospace";
        ctx.textAlign = "left"; ctx.fillText(`${cat.icon} ${cat.label.toUpperCase()}`, 420, y);
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(420, y+10, 320, 3);
        const c = s >= 80 ? "#F5C842" : s >= 60 ? "#E8A020" : "#E85520";
        ctx.fillStyle = c; ctx.fillRect(420, y+10, 320*(s/100), 3);
        ctx.fillStyle = c; ctx.font = "bold 12px 'Courier New',monospace";
        ctx.fillText(s, 752, y+14);
      });

      // Branding
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(40,920); ctx.lineTo(760,920); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "bold 14px Georgia,serif";
      ctx.textAlign = "left"; ctx.fillText("FITCHECK AI", 40, 960);
      ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "10px 'Courier New',monospace";
      ctx.fillText("fitcheck.ai  ·  #FitCheckAI  ·  Powered by Gemini", 40, 978);

      setGenerated(canvas.toDataURL("image/png"));
    };
    img.src = image;
  }, [result, image]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ display:"none" }}/>
      {!generated ? (
        <button onClick={generate} style={{
          width:"100%", padding:"13px", border:"0.5px solid rgba(245,200,66,0.3)",
          borderRadius:8, background:"rgba(245,200,66,0.05)", color:"#F5C842",
          cursor:"pointer", fontSize:11, letterSpacing:"0.1em", fontFamily:"'Courier New',monospace"
        }}>✦ GENERATE SHARE CARD</button>
      ) : (
        <div>
          <img src={generated} alt="scorecard" style={{ width:"100%", borderRadius:10, border:"0.5px solid rgba(255,255,255,0.08)" }}/>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <a href={generated} download="fitcheck-scorecard.png" style={{
              flex:1, padding:"11px", border:"0.5px solid rgba(245,200,66,0.3)",
              borderRadius:7, background:"rgba(245,200,66,0.05)", color:"#F5C842",
              textDecoration:"none", textAlign:"center", display:"block",
              fontSize:11, letterSpacing:"0.1em", fontFamily:"'Courier New',monospace"
            }}>↓ DOWNLOAD PNG</a>
            <button onClick={() => setGenerated(null)} style={{
              flex:1, padding:"11px", border:"0.5px solid rgba(255,255,255,0.1)",
              borderRadius:7, background:"transparent", color:"rgba(255,255,255,0.35)",
              cursor:"pointer", fontSize:11, letterSpacing:"0.1em", fontFamily:"'Courier New',monospace"
            }}>↺ REGENERATE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WardrobeTab ──────────────────────────────────────────────────────────────
function WardrobeTab({ wardrobe, setWardrobe }) {
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [combinations, setCombinations] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [selectedTag, setSelectedTag] = useState("All");

  const addItem = useCallback((file, tag) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setWardrobe(prev => [...prev, {
        id: Date.now(), src: e.target.result, tag,
        name: file.name.replace(/\.[^.]+$/, ""),
        addedAt: new Date().toISOString()
      }]);
    };
    reader.readAsDataURL(file);
  }, [setWardrobe]);

  const removeItem = (id) => setWardrobe(prev => prev.filter(i => i.id !== id));

  const generateCombinations = async () => {
    if (wardrobe.length < 2) return;
    setOutfitLoading(true); setCombinations([]);
    try {
      const data = await callGemini("/api/wardrobe", {
        action: "combinations",
        wardrobeItems: wardrobe.map(i => ({ tag: i.tag, name: i.name }))
      });
      setCombinations(data.data?.combinations || []);
    } catch(e) { console.error(e); } finally { setOutfitLoading(false); }
  };

  const runGapAnalysis = async () => {
    if (wardrobe.length < 1) return;
    setGapLoading(true);
    try {
      const data = await callGemini("/api/wardrobe", {
        action: "gap-analysis",
        wardrobeItems: wardrobe.map(i => ({ tag: i.tag, name: i.name }))
      });
      setGapAnalysis(data.data);
    } catch(e) { console.error(e); } finally { setGapLoading(false); }
  };

  const filtered = selectedTag === "All" ? wardrobe : wardrobe.filter(i => i.tag === selectedTag);

  return (
    <div style={{ paddingTop:20 }}>
      {/* Tag filter */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {["All",...CATEGORY_TAGS].map(t => (
          <button key={t} onClick={() => setSelectedTag(t)} style={{
            padding:"5px 12px", borderRadius:20, fontSize:10, letterSpacing:"0.08em",
            border:`0.5px solid ${selectedTag===t?"rgba(245,200,66,0.4)":"rgba(255,255,255,0.1)"}`,
            background: selectedTag===t ? "rgba(245,200,66,0.08)" : "transparent",
            color: selectedTag===t ? "#F5C842" : "rgba(255,255,255,0.35)",
            cursor:"pointer", fontFamily:"'Courier New',monospace"
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Add item buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        {CATEGORY_TAGS.map(tag => (
          <label key={tag} style={{
            padding:"10px 14px", border:"0.5px dashed rgba(255,255,255,0.1)",
            borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.06em"
          }}>
            <span>+</span> {tag.toUpperCase()}
            <input type="file" accept="image/*" style={{ display:"none" }}
              onChange={e => { if(e.target.files[0]) addItem(e.target.files[0], tag); e.target.value=""; }}/>
          </label>
        ))}
      </div>

      {/* Wardrobe grid */}
      {filtered.length > 0 ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
          {filtered.map(item => (
            <div key={item.id} style={{ position:"relative", borderRadius:8, overflow:"hidden", border:"0.5px solid rgba(255,255,255,0.08)", aspectRatio:"3/4" }}>
              <img src={item.src} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"6px 8px", background:"linear-gradient(transparent,rgba(0,0,0,0.8))" }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em" }}>{item.tag.toUpperCase()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{item.name}</div>
              </div>
              <button onClick={() => removeItem(item.id)} style={{
                position:"absolute", top:6, right:6, width:22, height:22,
                border:"none", background:"rgba(0,0,0,0.6)", borderRadius:"50%",
                color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12
              }}>✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
          No items yet — add some clothes above
        </div>
      )}

      {/* Actions */}
      {wardrobe.length >= 2 && (
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <button onClick={generateCombinations} disabled={outfitLoading} style={{
            flex:2, padding:"13px", border:"0.5px solid rgba(245,200,66,0.3)",
            borderRadius:8, background:"rgba(245,200,66,0.05)", color:"#F5C842",
            cursor:"pointer", fontSize:11, letterSpacing:"0.1em", fontFamily:"'Courier New',monospace",
            opacity: outfitLoading ? 0.6 : 1
          }}>{outfitLoading ? "GENERATING..." : "✦ GENERATE OUTFITS"}</button>
          <button onClick={runGapAnalysis} disabled={gapLoading} style={{
            flex:1, padding:"13px", border:"0.5px solid rgba(255,255,255,0.1)",
            borderRadius:8, background:"transparent", color:"rgba(255,255,255,0.4)",
            cursor:"pointer", fontSize:11, letterSpacing:"0.1em", fontFamily:"'Courier New',monospace",
            opacity: gapLoading ? 0.6 : 1
          }}>{gapLoading ? "..." : "▣ GAP SCAN"}</button>
        </div>
      )}

      {/* Combinations */}
      {combinations.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", marginBottom:12 }}>AI OUTFIT COMBOS</div>
          {combinations.map((combo, i) => (
            <div key={i} style={{ padding:"16px 18px", border:"0.5px solid rgba(255,255,255,0.08)", borderRadius:10, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:600, color:"#F0EDE8", fontFamily:"Georgia,serif" }}>{combo.name}</span>
                <span style={{ fontSize:10, color:"rgba(245,200,66,0.6)", letterSpacing:"0.08em" }}>⚡ {combo.vibe}</span>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                {combo.items?.map((item,j) => (
                  <span key={j} style={{ padding:"3px 8px", background:"rgba(255,255,255,0.05)", borderRadius:4, fontSize:11, color:"rgba(255,255,255,0.5)" }}>{item}</span>
                ))}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>📍 {combo.occasion}</div>
              <div style={{ fontSize:12, color:"rgba(245,200,66,0.6)", fontStyle:"italic" }}>→ {combo.tip}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gap analysis */}
      {gapAnalysis && (
        <div style={{ padding:"18px", border:"0.5px solid rgba(245,200,66,0.15)", borderRadius:10, background:"rgba(245,200,66,0.03)" }}>
          <div style={{ fontSize:10, color:"rgba(245,200,66,0.5)", letterSpacing:"0.15em", marginBottom:10 }}>🛍 WARDROBE GAP ANALYSIS</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:12, lineHeight:1.5 }}>{gapAnalysis.summary}</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginBottom:6 }}>MISSING PIECES</div>
            {gapAnalysis.gaps?.map((g,i) => (
              <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:6, display:"flex", gap:8 }}>
                <span style={{ color:"#E85520" }}>✗</span>{g}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginBottom:6 }}>STAPLES TO ADD</div>
            {gapAnalysis.staples?.map((s,i) => (
              <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:6, display:"flex", gap:8 }}>
                <span style={{ color:"#F5C842" }}>→</span>{s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HistoryTab ───────────────────────────────────────────────────────────────
function HistoryTab({ history, onReview }) {
  if (!history.length) return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.2)", fontSize:13 }}>
      No fit checks yet — analyze your first outfit
    </div>
  );
  return (
    <div style={{ paddingTop:20 }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", marginBottom:14 }}>PAST FIT CHECKS</div>
      {history.map((item, i) => (
        <div key={i} onClick={() => onReview(item)} style={{
          display:"flex", gap:14, padding:"14px", marginBottom:10,
          border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:10, cursor:"pointer"
        }}>
          <img src={item.image} alt="" style={{ width:56, height:56, objectFit:"cover", borderRadius:6, flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, color:"#F0EDE8", fontFamily:"Georgia,serif" }}>{item.result.verdict}</span>
              <span style={{ fontSize:14, fontWeight:700, fontFamily:"'Courier New',monospace",
                color: item.result.overallScore>=80?"#F5C842":item.result.overallScore>=60?"#E8A020":"#E85520" }}>
                {item.result.overallScore}
              </span>
            </div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em" }}>
              ⚡ {item.result.vibeMatch} · {item.mode.toUpperCase()} · {new Date(item.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FitCheckAI() {
  const [tab, setTab] = useState("fitcheck");
  const [mode, setMode] = useState("general");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [wardrobe, setWardrobe] = useState([]);
  const [history, setHistory] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const fileRef = useRef();
  const resultRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
    setImageFile(file);
    setResult(null); setError(null); setShowScorecard(false); setReviewItem(null);
  }, []);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const analyzeOutfit = async () => {
    if (!imageFile) return;
    setLoading(true); setError(null); setResult(null); setShowScorecard(false);

    try {
      const b64 = await new Promise(res => {
        const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(imageFile);
      });

      const data = await callGemini("/api/analyze", {
        imageBase64: b64,
        imageType: imageFile.type,
        mode,
      });

      setResult(data.data);
      setHistory(prev => [{ image, result: data.data, mode, timestamp: Date.now() }, ...prev].slice(0, 20));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch(err) {
      setError("Analysis failed — check your image is clear and try again.");
      console.error(err);
    } finally { setLoading(false); }
  };

  const reset = () => {
    setImage(null); setImageFile(null); setResult(null);
    setError(null); setShowScorecard(false); setReviewItem(null);
  };

  const activeResult = reviewItem ? reviewItem.result : result;
  const activeImage  = reviewItem ? reviewItem.image  : image;
  const activeMode   = reviewItem ? reviewItem.mode   : mode;
  const scoreColor   = activeResult
    ? (activeResult.overallScore >= 80 ? "#F5C842" : activeResult.overallScore >= 60 ? "#E8A020" : "#E85520")
    : "#F5C842";

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", color:"#F0EDE8", fontFamily:"'Courier New',monospace", paddingBottom:80 }}>
      

      {/* Header */}
      <div style={{
        borderBottom:"0.5px solid rgba(255,255,255,0.07)", padding:"16px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, background:"rgba(10,10,10,0.96)", zIndex:50,
        backdropFilter:"blur(12px)"
      }}>
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:"Georgia,serif",
              background:"linear-gradient(135deg,#F5C842,#E8A020)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FITCHECK</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", letterSpacing:"0.15em" }}>AI</span>
          </div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.18)", letterSpacing:"0.12em", marginTop:2 }}>
            HONEST STYLE INTELLIGENCE · GEMINI VISION
          </div>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.15)", letterSpacing:"0.06em" }}>{wardrobe.length} ITEMS</span>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.15)", letterSpacing:"0.06em" }}>{history.length} CHECKS</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display:"flex", borderBottom:"0.5px solid rgba(255,255,255,0.07)", padding:"0 20px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"12px 16px", border:"none", background:"transparent", cursor:"pointer",
            fontSize:10, letterSpacing:"0.12em", color: tab===t.id ? "#F5C842" : "rgba(255,255,255,0.3)",
            borderBottom: tab===t.id ? "1px solid #F5C842" : "1px solid transparent",
            transition:"all 0.2s", marginBottom:"-0.5px"
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"0 20px" }}>

        {/* ══ FIT CHECK TAB ══ */}
        {tab === "fitcheck" && (
          <div>
            {!reviewItem && (
              <div style={{ marginTop:24, marginBottom:20 }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", marginBottom:10 }}>SELECT MODE</div>
                <div style={{ display:"flex", gap:8 }}>
                  {MODE_OPTIONS.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)} style={{
                      flex:1, padding:"11px 6px", borderRadius:8,
                      border:`0.5px solid ${mode===m.id?"rgba(245,200,66,0.4)":"rgba(255,255,255,0.07)"}`,
                      background: mode===m.id ? "rgba(245,200,66,0.06)" : "rgba(255,255,255,0.02)",
                      cursor:"pointer", textAlign:"center",
                      color: mode===m.id ? "#F5C842" : "rgba(255,255,255,0.35)",
                      transition:"all 0.2s"
                    }}>
                      <div style={{ fontSize:14, marginBottom:3 }}>{m.icon}</div>
                      <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.05em" }}>{m.label}</div>
                      <div style={{ fontSize:9, opacity:0.6, marginTop:2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reviewItem && (
              <div style={{ marginTop:20, marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                <button onClick={() => setReviewItem(null)} style={{
                  padding:"6px 12px", border:"0.5px solid rgba(255,255,255,0.12)", borderRadius:6,
                  background:"transparent", color:"rgba(255,255,255,0.4)", cursor:"pointer",
                  fontSize:10, letterSpacing:"0.08em"
                }}>← BACK</button>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em" }}>
                  REVIEWING · {new Date(reviewItem.timestamp).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Upload Zone */}
            {!activeResult && !loading && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !image && fileRef.current?.click()}
                style={{
                  border:`1px dashed ${dragOver?"rgba(245,200,66,0.5)":image?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.13)"}`,
                  borderRadius:12, overflow:"hidden",
                  background: dragOver ? "rgba(245,200,66,0.02)" : "transparent",
                  cursor: image ? "default" : "pointer",
                  transition:"all 0.2s", minHeight: image ? "auto" : 220,
                  display:"flex", alignItems:"center", justifyContent:"center", position:"relative"
                }}>
                {image ? (
                  <div style={{ position:"relative", width:"100%" }}>
                    <img src={image} alt="outfit" style={{ width:"100%", maxHeight:400, objectFit:"contain", display:"block", borderRadius:11 }}/>
                    <button onClick={e => { e.stopPropagation(); reset(); }} style={{
                      position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.7)",
                      border:"0.5px solid rgba(255,255,255,0.15)", borderRadius:6,
                      color:"rgba(255,255,255,0.6)", fontSize:10, padding:"4px 8px", cursor:"pointer"
                    }}>✕ CLEAR</button>
                  </div>
                ) : (
                  <div style={{ textAlign:"center", padding:40 }}>
                    <div style={{ fontSize:32, marginBottom:14, opacity:0.2 }}>⬆</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Drop your fit here</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.18)", letterSpacing:"0.05em" }}>MIRROR SELFIE · FULL BODY · FLAT LAY</div>
                    <div style={{ marginTop:18, display:"inline-block", padding:"7px 18px",
                      border:"0.5px solid rgba(255,255,255,0.12)", borderRadius:6,
                      fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em" }}>BROWSE FILES</div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
              </div>
            )}

            {image && !activeResult && !loading && (
              <button onClick={analyzeOutfit} style={{
                width:"100%", marginTop:14, padding:"15px",
                background:"linear-gradient(135deg,#F5C842,#E8A020)",
                border:"none", borderRadius:10, cursor:"pointer",
                fontSize:12, fontWeight:700, color:"#0A0A0A", letterSpacing:"0.12em"
              }}>✦ ANALYZE MY FIT</button>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ marginTop:28, padding:28, textAlign:"center", border:"0.5px solid rgba(255,255,255,0.05)", borderRadius:12 }}>
                <div style={{ width:44, height:44, borderRadius:"50%",
                  border:"2px solid rgba(245,200,66,0.12)", borderTop:"2px solid #F5C842",
                  margin:"0 auto 18px", animation:"spin 0.8s linear infinite" }}/>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em" }}>SCANNING YOUR FIT...</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.18)", marginTop:6, letterSpacing:"0.06em" }}>
                  Color theory · Silhouette · Vibe detection
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop:14, padding:14, borderRadius:8,
                background:"rgba(232,85,32,0.07)", border:"0.5px solid rgba(232,85,32,0.25)",
                fontSize:12, color:"#E85520" }}>{error}</div>
            )}

            {/* ── Results ── */}
            {activeResult && (
              <div ref={resultRef} className="fade-up">
                {/* Image + Score hero */}
                <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div style={{ borderRadius:10, overflow:"hidden", border:"0.5px solid rgba(255,255,255,0.07)", aspectRatio:"3/4" }}>
                    <img src={activeImage} alt="outfit" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ padding:"20px 16px",
                      border:`0.5px solid ${scoreColor}25`, borderRadius:10,
                      background:`${scoreColor}05`,
                      display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                      <ScoreGauge score={activeResult.overallScore} size={88} strokeWidth={5}/>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:"Georgia,serif", textAlign:"center", lineHeight:1.2, color:"#F0EDE8" }}>
                        {activeResult.verdict}
                      </div>
                      <div style={{ padding:"3px 8px", background:"rgba(255,255,255,0.05)", borderRadius:4,
                        fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", textAlign:"center" }}>
                        ⚡ {activeResult.vibeMatch?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ padding:"14px", border:"0.5px solid rgba(255,255,255,0.06)", borderRadius:10,
                      fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.07em" }}>
                      MODE: {activeMode.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Category bars */}
                <div style={{ marginTop:12, padding:"18px 20px", border:"0.5px solid rgba(255,255,255,0.06)", borderRadius:10 }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", marginBottom:16 }}>BREAKDOWN</div>
                  {SCORE_CATEGORIES.map((cat, i) => (
                    <CategoryBar key={cat.key} label={cat.label} icon={cat.icon} score={activeResult.grades?.[cat.key]??0} index={i}/>
                  ))}
                </div>

                {/* Strengths / Improvements */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
                  <div style={{ padding:"16px", border:"0.5px solid rgba(100,200,100,0.12)", borderRadius:10, background:"rgba(100,200,100,0.02)" }}>
                    <div style={{ fontSize:9, color:"rgba(100,220,100,0.45)", letterSpacing:"0.15em", marginBottom:12 }}>WORKING</div>
                    {activeResult.strengths?.map((s,i) => (
                      <div key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.55)", marginBottom:8, lineHeight:1.5, display:"flex", gap:7 }}>
                        <span style={{ color:"rgba(100,220,100,0.55)", flexShrink:0 }}>✓</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:"16px", border:"0.5px solid rgba(232,165,32,0.12)", borderRadius:10, background:"rgba(232,165,32,0.02)" }}>
                    <div style={{ fontSize:9, color:"rgba(245,200,66,0.45)", letterSpacing:"0.15em", marginBottom:12 }}>IMPROVE</div>
                    {activeResult.improvements?.map((s,i) => (
                      <div key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.55)", marginBottom:8, lineHeight:1.5, display:"flex", gap:7 }}>
                        <span style={{ color:"rgba(245,200,66,0.55)", flexShrink:0 }}>→</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode insight */}
                {activeResult.modeSpecificInsight && (
                  <div style={{ marginTop:10, padding:"14px 16px", border:"0.5px solid rgba(245,200,66,0.15)", borderRadius:10, background:"rgba(245,200,66,0.03)" }}>
                    <div style={{ fontSize:9, color:"rgba(245,200,66,0.45)", letterSpacing:"0.14em", marginBottom:7 }}>
                      {activeMode==="dating"?"♥ DATING INTEL":activeMode==="professional"?"◆ CAREER INSIGHT":"✦ STYLE NOTE"}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>{activeResult.modeSpecificInsight}</div>
                  </div>
                )}

                {/* Wardrobe gap */}
                {activeResult.wardrobeGap && (
                  <div style={{ marginTop:10, padding:"14px 16px", border:"0.5px solid rgba(255,255,255,0.06)", borderRadius:10, display:"flex", gap:10 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>🛍</span>
                    <div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.22)", letterSpacing:"0.12em", marginBottom:5 }}>WARDROBE GAP</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{activeResult.wardrobeGap}</div>
                    </div>
                  </div>
                )}

                {/* Lighting note */}
                {activeResult.lightingNote && activeResult.lightingNote !== "null" && (
                  <div style={{ marginTop:10, padding:"10px 14px", border:"0.5px solid rgba(232,85,32,0.18)", borderRadius:8,
                    fontSize:11, color:"rgba(232,165,50,0.65)", lineHeight:1.5, display:"flex", gap:8 }}>
                    <span>⚠</span>
                    <span><b style={{ color:"rgba(232,165,50,0.85)" }}>Photo note: </b>{activeResult.lightingNote}</span>
                  </div>
                )}

                {/* Share card */}
                {!reviewItem && (
                  <div style={{ marginTop:10 }}>
                    {!showScorecard ? (
                      <button onClick={() => setShowScorecard(true)} style={{
                        width:"100%", padding:"12px", border:"0.5px solid rgba(245,200,66,0.25)",
                        borderRadius:8, background:"rgba(245,200,66,0.04)", color:"#F5C842",
                        cursor:"pointer", fontSize:11, letterSpacing:"0.1em"
                      }}>✦ GENERATE SHARE CARD</button>
                    ) : (
                      <ScorecardCanvas result={activeResult} image={activeImage} mode={activeMode}/>
                    )}
                  </div>
                )}

                {/* Bottom actions */}
                {!reviewItem && (
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <button onClick={reset} style={{
                      flex:1, padding:"12px", border:"0.5px solid rgba(255,255,255,0.1)",
                      borderRadius:7, background:"transparent", color:"rgba(255,255,255,0.35)",
                      cursor:"pointer", fontSize:10, letterSpacing:"0.1em"
                    }}>↑ NEW FIT</button>
                    <button onClick={() => setTab("wardrobe")} style={{
                      flex:1, padding:"12px", border:"0.5px solid rgba(255,255,255,0.1)",
                      borderRadius:7, background:"transparent", color:"rgba(255,255,255,0.35)",
                      cursor:"pointer", fontSize:10, letterSpacing:"0.1em"
                    }}>▣ MY WARDROBE</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "wardrobe" && <WardrobeTab wardrobe={wardrobe} setWardrobe={setWardrobe}/>}
        {tab === "history"  && <HistoryTab  history={history}   onReview={item => { setReviewItem(item); setTab("fitcheck"); }}/>}

      </div>
    </div>
  );
}
