import React, { useMemo, useState } from "react";

// ================================================
//  A. borkumensis Codon Optimizer — Polished UI
//  - Improved spacing & layout
//  - Decorative DNA helix SVG
//  - Same greedy optimization logic
// ================================================

// ===== Preferred codons (DNA alphabet) for A. borkumensis (SK2) =====
const PREFERRED_DNA: Record<string, string> = {
  F: "TTT",
  L: "CTG",
  I: "ATT",
  M: "ATG",
  V: "GTG",
  S: "AGC",
  P: "CCG",
  T: "ACC",
  A: "GCC",
  Y: "TAC",
  H: "CAC",
  Q: "CAG",
  N: "AAC",
  K: "AAA",
  D: "GAT",
  E: "GAA",
  C: "TGC",
  W: "TGG",
  R: "CGC",
  G: "GGC",
  "*": "TAA", // most common stop
};

// ===== Standard Genetic Code (DNA codons → amino acids) =====
const GENETIC_CODE: Record<string, string> = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",

  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",

  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",

  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

const AA_ALPHABET = new Set(Array.from("ACDEFGHIKLMNPQRSTVWY*"));
const LINE_SPLIT = /\r?\n/;

function cleanSeq(raw: string): string {
  return (raw || "")
    .split(LINE_SPLIT)
    .filter((ln) => ln.trim() && !ln.startsWith(">"))
    .join("")
    .replace(/[^A-Za-z*]/g, "")
    .toUpperCase();
}

function parseFASTA(raw: string) {
  const lines = (raw || "").split(LINE_SPLIT);
  let name = "sequence";
  const seqLines: string[] = [];
  for (const ln of lines) {
    if (!ln.trim()) continue;
    if (ln.startsWith(">")) name = ln.substring(1).trim() || name;
    else seqLines.push(ln.trim());
  }
  return { name, seq: seqLines.join("") };
}

function isProtein(seq: string): boolean {
  return seq.length > 0 && Array.from(seq).every((ch) => AA_ALPHABET.has(ch));
}

function toDNA(seq: string): string { return seq.replaceAll("U", "T"); }
function toRNA(seq: string): string { return seq.replaceAll("T", "U"); }

function translateCodon(codon: string): string {
  const aa = GENETIC_CODE[codon];
  if (!aa) throw new Error(`Invalid DNA codon: ${codon}`);
  return aa;
}

function wrapFasta(seq: string, width = 70): string {
  const out: string[] = [];
  for (let i = 0; i < seq.length; i += width) out.push(seq.slice(i, i + width));
  return out.join("\n");
}

function optimizeFromProtein(protein: string, outputAlphabet: "dna" | "rna") {
  const outDNA = Array.from(protein)
    .map((aa, i) => {
      const codon = PREFERRED_DNA[aa];
      if (!codon) throw new Error(`Unsupported amino acid at ${i + 1}: ${aa}`);
      return codon;
    })
    .join("");
  return outputAlphabet === "dna" ? outDNA : toRNA(outDNA);
}

function optimizeFromDNA(dnaOrRna: string, outputAlphabet: "dna" | "rna") {
  const dna = toDNA(dnaOrRna);
  if (dna.length % 3 !== 0) throw new Error(`Input length ${dna.length} not divisible by 3.`);
  const outDNA: string[] = [];
  for (let i = 0; i < dna.length; i += 3) {
    const codon = dna.slice(i, i + 3);
    const aa = translateCodon(codon);
    const preferred = PREFERRED_DNA[aa];
    if (!preferred) throw new Error(`No preferred codon for AA '${aa}' at pos ${i / 3 + 1}`);
    outDNA.push(preferred);
  }
  const seq = outDNA.join("");
  return outputAlphabet === "dna" ? seq : toRNA(seq);
}

// === Decorative DNA Helix SVG ===
function HelixGraphic() {
  return (
    <svg
      viewBox="0 0 600 300"
      aria-hidden
      className="absolute -top-10 -right-10 h-56 w-[560px] opacity-20"
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M0,150 C100,60 200,240 300,150 C400,60 500,240 600,150" fill="none" stroke="url(#grad)" strokeWidth="6" />
      <path d="M0,150 C100,240 200,60 300,150 C400,240 500,60 600,150" fill="none" stroke="url(#grad)" strokeWidth="6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1={i * 50}
          y1={i % 2 ? 110 : 190}
          x2={i * 50 + 50}
          y2={i % 2 ? 190 : 110}
          stroke="url(#grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default function App() {
  const [rawInput, setRawInput] = useState("");
  const [inputType, setInputType] = useState<"auto" | "protein" | "dna">("auto");
  const [outputAlphabet, setOutputAlphabet] = useState<"dna" | "rna">("dna");
  const [recordName, setRecordName] = useState("optimized");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  const detected = useMemo(() => {
    const { seq } = parseFASTA(rawInput);
    const cleaned = cleanSeq(seq);
    if (!cleaned) return "none";
    return isProtein(cleaned) ? "protein" : "dna";
  }, [rawInput]);

  function onOptimize() {
    try {
      setError(null);
      const { name, seq } = parseFASTA(rawInput);
      const cleaned = cleanSeq(seq);
      if (!cleaned) throw new Error("No sequence found.");
      const mode = inputType === "auto" ? (isProtein(cleaned) ? "protein" : "dna") : inputType;
      const outSeq =
        mode === "protein"
          ? optimizeFromProtein(cleaned, outputAlphabet)
          : optimizeFromDNA(cleaned, outputAlphabet);
      const header = `>${recordName || name}`;
      setResult(`${header}\n${wrapFasta(outSeq)}\n`);
    } catch (e: any) {
      setError(e.message || String(e));
      setResult("");
    }
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
  }

  function onDownload() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recordName || "optimized"}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onLoadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    setRawInput(txt);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-gray-900">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-10">
          <div className="relative rounded-3xl bg-white/70 ring-1 ring-gray-200 backdrop-blur p-8 md:p-10 shadow-sm">
            <HelixGraphic />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              A. borkumensis Codon Optimizer
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600 text-base md:text-lg">
              Greedy single-pass optimizer — replace every amino acid with the organism’s most-preferred codon.
              Paste a sequence, pick options, hit <span className="font-semibold text-emerald-700">Optimize</span>.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm text-emerald-800 ring-1 ring-emerald-200">
              Beautiful UI • Fast results • Copy/Download
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left column: Input */}
          <section className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-6 md:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-lg">Input sequence (FASTA or raw)</label>
              <input
                type="file"
                accept=".fa,.fasta,.txt"
                onChange={onLoadFile}
                className="text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder=">mySeq\nM V S ...  or  ATGGTC..."
              className="w-full h-56 md:h-64 resize-y border rounded-xl p-4 leading-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400"
            />

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Interpret input as</div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="auto"
                      checked={inputType === "auto"}
                      onChange={() => setInputType("auto")}
                    />
                    Auto <span className="text-gray-400">({detected === "none" ? "–" : detected})</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="protein"
                      checked={inputType === "protein"}
                      onChange={() => setInputType("protein")}
                    />
                    Protein
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="dna"
                      checked={inputType === "dna"}
                      onChange={() => setInputType("dna")}
                    />
                    DNA/RNA
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-500">Output alphabet</div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="alphabet"
                      value="dna"
                      checked={outputAlphabet === "dna"}
                      onChange={() => setOutputAlphabet("dna")}
                    />
                    DNA (A,T,G,C)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="alphabet"
                      value="rna"
                      checked={outputAlphabet === "rna"}
                      onChange={() => setOutputAlphabet("rna")}
                    />
                    RNA (A,U,G,C)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">FASTA record name</label>
              <input
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onOptimize}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:translate-y-px transition"
              >
                Optimize
              </button>
              <button
                onClick={() => setRawInput("")}
                className="px-5 py-2.5 rounded-xl bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200 transition"
              >
                Clear input
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl ring-1 ring-red-200">
                {error}
              </div>
            )}
          </section>

          {/* Right column: Output */}
          <section className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-6 md:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Optimized FASTA</h2>
              <div className="flex gap-2">
                <button
                  onClick={onCopy}
                  disabled={!result}
                  className="px-3 py-2 rounded-lg bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200 disabled:opacity-50 transition"
                >
                  Copy
                </button>
                <button
                  onClick={onDownload}
                  disabled={!result}
                  className="px-3 py-2 rounded-lg bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200 disabled:opacity-50 transition"
                >
                  Download
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={result}
              placeholder=">optimized\n(Your optimized sequence will appear here)"
              className="w-full h-64 md:h-[22rem] resize-y border rounded-xl p-4 bg-gray-50"
            />

            <div className="text-sm text-gray-600">
              <p className="mb-1 font-semibold">Notes</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Greedy replacement: each amino acid → most-preferred codon for <em>A. borkumensis</em>.</li>
                <li>Auto-detect infers protein vs DNA/RNA.</li>
                <li>For DNA/RNA inputs, length must be divisible by 3 and valid in the standard genetic code.</li>
                <li>Advanced features (GC windowing, restriction-site blacklists, mRNA hairpin checks) can be added later.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-xs text-gray-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} A. borkumensis Codon Optimizer • Greedy v1.0</p>
          <a className="inline-flex items-center gap-1 text-emerald-700 hover:underline" href="#top">
            Back to top ↑
          </a>
        </footer>
      </main>
    </div>
  );
}
