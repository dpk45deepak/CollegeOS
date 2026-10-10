export interface Candidate {
  id: string;
  documentId: string;
  chunkIndex?: number;
  title: string;
  documentType: string;
  academicYear: string | null;
  pageNumber: number | null;
  content: string;
  vectorScore?: number; // cosine similarity 0..1
  fused: number; // RRF score
}
export interface Ranked extends Candidate {
  rerank: number;
  relevance: number;
}

/** Rerank contract. Swap in a cross-encoder / LLM / hosted reranker (Cohere, Voyage) without touching retrieval. */
export interface Reranker {
  rerank(query: string, candidates: Candidate[]): Promise<Ranked[]>;
}
export const RERANKER = Symbol('RERANKER');

const STOP = new Set(
  'the a an of to in on for and or is are was were be been what which who whom whose when where why how do does did can could should would will shall may might my me i you your our we they their it its this that these those about with from by at as if than then so not no any all'.split(
    ' ',
  ),
);
export const queryTerms = (q: string): string[] => [
  ...new Set(
    q
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP.has(w)),
  ),
];
const stem = (w: string) => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w);

/** Deterministic lexical reranker: term coverage + title match + bigram phrase bonus, blended with fusion rank. */
export class LexicalReranker implements Reranker {
  async rerank(query: string, candidates: Candidate[]): Promise<Ranked[]> {
    const terms = queryTerms(query);
    const stems = terms.map(stem);
    const maxFused = Math.max(1e-9, ...candidates.map((c) => c.fused));
    const bigrams = terms.slice(0, -1).map((t, i) => `${t} ${terms[i + 1]}`);
    return candidates
      .map((c) => {
        const text = c.content.toLowerCase();
        const title = c.title.toLowerCase();
        const coverage = stems.length ? stems.filter((s) => text.includes(s)).length / stems.length : 0;
        const titleHit = stems.length ? stems.filter((s) => title.includes(s)).length / stems.length : 0;
        const phrase = bigrams.length ? bigrams.filter((b) => text.includes(b)).length / bigrams.length : 0;
        const lexical = 0.6 * coverage + 0.2 * titleHit + 0.2 * phrase;
        const rerank = 0.6 * lexical + 0.4 * (c.fused / maxFused);
        // "Is this actually about the question?" — used for the answer/no-answer decision.
        const relevance = Math.max(c.vectorScore ?? 0, coverage * 0.9);
        return { ...c, rerank, relevance };
      })
      .sort((a, b) => b.rerank - a.rerank);
  }
}
