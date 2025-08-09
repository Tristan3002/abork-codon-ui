---

## A. borkumensis Codon Optimizer (React + Vite + Tailwind)

A clean, browser-based codon optimizer for *Alcanivorax borkumensis*.
Paste a protein (amino-acid) sequence **or** a DNA/RNA coding sequence (FASTA or raw), pick options, and export an **optimized FASTA** that uses the organism’s **most-preferred codon** for every amino acid.

---

## Why this exists

When expressing heterologous genes in *A. borkumensis*, codon usage mismatches can throttle translation. This tool performs a **greedy** optimization, each residue is mapped to the **top-frequency codon** from the organism’s codon usage table. It’s intentionally simple and fast, with room for smarter heuristics later.

---

## Features

* **One-click** greedy optimization (AA → preferred codon)
*  Accepts **protein** or **DNA/RNA** (FASTA or plain text)
*  Auto-detects input type; RNA/DNA **output alphabet toggle**
*  **FASTA export** (copy or download)
*  Polished, responsive UI (Tailwind v4)

---

## Tech stack

* **Vite** + **React (TypeScript)**
* **Tailwind v4** via `@tailwindcss/postcss` + PostCSS
* No backend; static site deployable anywhere

---

## Quickstart (local)

```bash
# clone
git clone <your-repo-url> abork-codon-ui
cd abork-codon-ui

# install (use Node >= 18)
npm ci

# dev server
npm run dev   # open the printed URL, usually http://localhost:5173
```

### Build & preview

```bash
npm run build       # generates /dist
npm run preview     # serves dist at http://localhost:5173
```

> Tip: If you see a Tailwind error about using `tailwindcss` directly as a PostCSS plugin, ensure `postcss.config.js` uses `@tailwindcss/postcss`.

---

## How to use the app

1. **Paste a sequence** (left panel). Accepted formats:

   * **Protein**: single-letter AAs (`ACDEFGHIKLMNPQRSTVWY*`), e.g.
     `>eGFP`
     `MVSKGEELFTGVVPIL...`
   * **DNA/RNA**: `ATGC` or `AUGC`, length must be a multiple of 3. FASTA headers (`>name`) are ok.
2. Choose **Interpret input as**:

   * **Auto** (recommended): detects protein vs DNA/RNA.
   * **Protein**: treats input as amino acids.
   * **DNA/RNA**: treats input as coding nucleotides.
3. Choose **Output alphabet**: **DNA (A,T,G,C)** or **RNA (A,U,G,C)**.
4. Optionally edit the **FASTA record name** (header line).
5. Click **Optimize** → the right panel shows your **optimized FASTA**.
6. **Copy** or **Download** the result.

### Example

* Input (protein):

  ```
  >toy
  MVSP
  ```
* Output (DNA, preferred codons per AA):

  ```
  >optimized
  ATGGTGAGCCCG
  ```

---

## What “greedy optimization” means

* **Protein input:** each amino acid is replaced by the **single most frequent codon** observed in *A. borkumensis* (SK2).
* **DNA/RNA input:** the sequence is translated with the **standard genetic code**, then each amino acid is mapped as above.
* **Start codon** is whatever the first AA maps to (usually `ATG` for `M`).
* **Stops** (`*`) map to **TAA** (the most common stop).
* Invalid characters are stripped; ambiguous bases aren’t supported.

### Preferred codons used (DNA alphabet)

```
F TTT   L CTG   I ATT   M ATG   V GTG
S AGC   P CCG   T ACC   A GCC   Y TAC
H CAC   Q CAG   N AAC   K AAA   D GAT
E GAA   C TGC   W TGG   R CGC   G GGC
Stop: TAA
```

*Source: Kazusa codon usage table for *A. borkumensis* SK2.*

---

## Limitations & future work

This v1 is intentionally simple:

* No GC%/GC3 targeting or windowing
* No restriction-site blacklisting (e.g., BsaI, BsmBI, EcoRI)
* No avoidance of homopolymers/repeats or mRNA hairpins (ΔG)
* No CAI or tRNA adaptation index scoring
* No codon cycling (secondary/tertiary choices to balance motifs)

**Planned enhancements:**

* GC% badge + sliding-window control
* Inline **CAI** score vs native genes
* Restriction-site **blacklist** (user-editable)
* Avoid specific motifs (e.g., `RBS`-like internal sites, poly-T runs)
* Export both **DNA and RNA** simultaneously
* Minimal **test suite** for the optimizer core (Vitest)

---

## Project structure

```
abork-codon-ui/
├─ public/
├─ src/
│  ├─ App.tsx          # UI + optimizer logic
│  ├─ main.tsx         # app entry
│  └─ index.css        # Tailwind entry
├─ index.html
├─ tailwind.config.js
├─ postcss.config.js
├─ package.json
└─ vite.config.ts
```

**Where to change codons:** edit the `PREFERRED_DNA` map in `src/App.tsx`.
**Where to change the genetic code:** edit `GENETIC_CODE` in `src/App.tsx`.

---

## Troubleshooting

* **PowerShell blocked `npm.ps1`:**
  Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force`, open a new terminal.
* **Tailwind v4 PostCSS error:**
  Ensure `postcss.config.js` is:

  ```js
  export default { plugins: { '@tailwindcss/postcss': {}, autoprefixer: {} } }
  ```

  and your CSS entry is either:

  ```css
  @import "tailwindcss";
  ```

  *or*

  ```css
  @tailwind base; @tailwind components; @tailwind utilities;
  ```
* **Unterminated regex in `App.tsx`:** make sure `split(/\r?\n/)` is on **one line** (or use a `LINE_SPLIT` constant).
* **Blank output:** ensure your input isn’t empty and, for DNA/RNA mode, that length is a multiple of 3.

---

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build -> /dist
npm run preview   # serve /dist locally
```

---

## License

MIT © *Tristan Crawford, 2025*

