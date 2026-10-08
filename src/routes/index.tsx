import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Search, Check, X, Loader2, Award, ArrowDown, ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Carrinho, useCarrinho } from "@/components/Carrinho";
import {
  brl, buscarAtacadao, buscarMateus, DEMO, norm, parear, precoUnit, rotuloUn,
  type Loja, type Produto,
} from "@/lib/comparador";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarrinhoLeve — Comparar Preços" },
      { name: "description", content: "Compare preços de supermercado do Atacadão e do Mateus lado a lado, com preço por unidade." },
      { property: "og:title", content: "Comparador de preços — Atacadão x Mateus" },
      { property: "og:description", content: "Encontre o melhor preço entre Atacadão e Mateus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const LOJAS: [Loja, (t: string) => Promise<Produto[]>][] = [
  ["Atacadão", buscarAtacadao],
  ["Mateus Mais", buscarMateus],
];
type St = { state: "loading" | "ok" | "err"; n?: number };
const SUG = ["ovos", "leite", "arroz", "café", "amaciante"];

function Index() {
  // 1. Inicializa lendo direto do localStorage (evita atraso)
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const salvo = localStorage.getItem("tema");
      if (salvo) return salvo === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 8; // Quantidade de cards por página (8 ou 12 é o ideal)


  const [q, setQ] = useState("");
  const [termo, setTermo] = useState("");
  const [itensBase, setItensBase] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Record<string, St>>({});
  const [erros, setErros] = useState<string[]>([]);
  const [ord, setOrd] = useState<"rel" | "preco" | "un">("rel");
  const [loja, setLoja] = useState<"todas" | Loja>("todas");
  const [soEq, setSoEq] = useState(false);
  const [exato, setExato] = useState(true);
  const carrinho = useCarrinho();

  // 2. Busca inicial dos produtos
  useEffect(() => {
    buscar("");
  }, []);

  // 3. Salva a escolha do usuário e aplica no <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("tema", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  async function buscar(t: string) {
    setPagina(1);
    setTermo(t); setLoading(true); setErros([]);
    setStatus(Object.fromEntries(LOJAS.map(([n]) => [n, { state: "loading" }])));
    const res = await Promise.allSettled(LOJAS.map(([n, fn]) =>
      fn(t).then(
        (v) => { setStatus((s) => ({ ...s, [n]: { state: "ok", n: v.length } })); return v; },
        (er) => { setStatus((s) => ({ ...s, [n]: { state: "err" } })); throw er; },
      )));
    const itens: Produto[] = []; const errs: string[] = [];
    res.forEach((r, k) => {
      const n = LOJAS[k]![0];
      if (r.status === "fulfilled") r.value.forEach((p, i) => { p.rank = i; itens.push(p); });
      else errs.push(n + ": " + (r.reason as Error).message);
    });
    if (errs.length) {
      const falhou = LOJAS.filter((_, k) => res[k]!.status === "rejected").map((l) => l[0]);
      DEMO.filter((d) => falhou.includes(d.loja)).forEach((p, i) => itens.push({ ...p, rank: i }));
    }
    setErros(errs); setItensBase(itens); setLoading(false);
  }

  const { itens, melhor, barato } = useMemo(() => {
    let itens = itensBase.map((p) => ({ ...p }));
    if (exato) {
      const palavras = norm(termo).split(/\s+/).filter(Boolean);
      itens = itens.filter((p) => { const n = norm(p.nome); return palavras.every((w: string) => n.includes(w)); });
    }
    parear(itens);
    if (soEq) itens = itens.filter((p) => p.eq);
    if (loja !== "todas") itens = itens.filter((p) => p.loja === loja);
    if (ord === "preco") itens.sort((a, b) => a.preco - b.preco);
    else if (ord === "un") itens.sort((a, b) => (precoUnit(a) ?? Infinity) - (precoUnit(b) ?? Infinity));
    else itens.sort((a, b) => a.rank! - b.rank! || (a.loja < b.loja ? -1 : 1));
    let melhor: Produto | null = null;
    itens.forEach((p) => { const u = precoUnit(p); if (u != null && (melhor === null || u < precoUnit(melhor)!)) melhor = p; });
    const barato = itens.length ? itens.reduce((x, y) => (y.preco < x.preco ? y : x)) : null;
    return { itens, melhor, barato };
  }, [itensBase, termo, exato, soEq, loja, ord]);

  // Volta para a página 1 quando filtros/ordenação mudam
  useEffect(() => {
    setPagina(1);
  }, [ord, loja, soEq, exato]);

  const totalPaginas = Math.ceil(itens.length / ITENS_POR_PAGINA) || 1;
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensPaginados = itens.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const cont = (l: Loja) => itens.filter((p) => p.loja === l).length;
  const submit = (t: string) => { setQ(t); buscar(t.trim()); };

  return (
    <div className="relative min-h-screen text-foreground transition-colors overflow-x-hidden">
      {/* Camada de textura de fundo esfumada e proporcional */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${dark ? "/bg-dark.png" : "/bg-light.png"})`,
          backgroundRepeat: "repeat",
          backgroundSize: "850px auto", // Proporcional e sem esticar, traços bem maiores
          opacity: dark ? 0.22 : 0.15, // Esfuma a textura (fica sutil como marca d'água)
          filter: "blur(0.5px)", // Suaviza os contornos
        }}
      />

      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="h-3 w-3 -ml-1 rounded-full bg-sky-500" />
            <span className="ml-1 font-display text-lg font-bold">CarrinhoLeve</span>
          </div>
          <div className="flex items-center gap-2">
            <Carrinho c={carrinho} />
            <button onClick={() => setDark(!dark)} aria-label="Alternar tema"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:scale-105">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to px-6 py-5 text-cream sm:px-8 sm:py-6">
{/* Ribbon diagonal com centralização matemática garantida */}
<div className="pointer-events-none absolute right-0 top-0 h-28 w-28 overflow-hidden">
  <div className="absolute right-[-40px] top-[26px] w-[150px] rotate-45 bg-gradient-to-r from-orange-500 to-amber-500 py-1 text-center shadow-md">
    <span className="block text-[10px] font-black uppercase tracking-wider text-white">
      Preços Reais
    </span>
  </div>
</div>


          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Atacadão
              </span>
              <span className="text-xs text-cream/40">vs</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Mateus Mais
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Compare preços em tempo real e descubra onde comprar mais barato.
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); submit(q); }}
              className="mt-4 flex gap-2 rounded-full bg-card p-1 shadow-lg">
              <div className="flex flex-1 items-center gap-2 pl-3 text-foreground">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busque leite, café, arroz..."
                  className="w-full min-w-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <button className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110">Buscar</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUG.map((s) => (
                <button key={s} onClick={() => submit(s)}
                  className="rounded-full border border-cream/25 bg-cream/10 px-3.5 py-1 text-sm transition hover:bg-cream/20">{s}</button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 min-h-8">
              {LOJAS.map(([n]) => {
                const st = status[n]; if (!st) return null;
                return (
                  <span key={n} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                    st.state === "ok" ? "bg-moss text-forest" : st.state === "err" ? "bg-rose text-forest" : "bg-cream/15"}`}>
                    {st.state === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {st.state === "ok" && <Check className="h-3.5 w-3.5" />}
                    {st.state === "err" && <X className="h-3.5 w-3.5" />}
                    {n}{st.state === "ok" && ` · ${st.n}`}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-3xl font-bold">{termo ? `Resultados para “${termo}”` : "Produtos em destaque"}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Seg value={ord} onChange={setOrd} opts={[["rel", "Relevância"], ["preco", "Menor preço"], ["un", "Preço/unidade"]]} />
            <Seg value={loja} onChange={setLoja} opts={[["todas", "Todas"], ["Atacadão", "Atacadão"], ["Mateus Mais", "Mateus"]]} />
            <Toggle on={soEq} set={setSoEq}>Só nas duas lojas</Toggle>
            <Toggle on={exato} set={setExato}>Todas as palavras</Toggle>
          </div>
        </div>

        {erros.length > 0 && !loading && (
          <div className="mb-6 rounded-2xl border-l-4 border-rose bg-rose/15 px-4 py-3 text-sm">
            Falha ao consultar ({erros.join(" | ")}). Verifique se o proxy está rodando. Mostrando dados de exemplo das lojas que falharam.
          </div>
        )}

        {!loading && itens.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat v={String(itens.length)} l="produtos" />
            <Stat v={String(cont("Atacadão"))} l="no Atacadão" dot="bg-orange-500" />
            <Stat v={String(cont("Mateus Mais"))} l="no Mateus Mais" dot="bg-sky-500" />
            <Stat v={brl(barato!.preco)} l={`mais barato · ${barato!.loja}`} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-border bg-card p-3">
                  <div className="shimmer aspect-square rounded-2xl" />
                  <div className="shimmer mt-4 h-4 w-1/3 rounded-full" />
                  <div className="shimmer mt-3 h-3.5 rounded-full" />
                  <div className="shimmer mt-2 h-3.5 w-2/3 rounded-full" />
                  <div className="shimmer mt-5 h-7 w-1/2 rounded-full" />
                </div>
              ))
            : itens.length === 0
              ? <p className="col-span-full py-16 text-center text-muted-foreground">Nenhum resultado. Tente outra palavra ou desmarque os filtros.</p>
              : itensPaginados.map((p, i) => <Card key={p.loja + p.nome + i} p={p} i={i} best={p === melhor} onAdd={() => { carrinho.add(p); toast.success("Adicionado ao carrinho"); }} />)}
        </div>

        {/* Controle de paginação */}
        {!loading && totalPaginas > 1 && (
          <div className="mt-8 mb-12 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setPagina(Math.max(1, paginaAtual - 1));
                window.scrollTo({ top: 350, behavior: "smooth" });
              }}
              disabled={paginaAtual === 1}
              aria-label="Página anterior"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            >
              &lt;
            </button>

            <span className="text-sm font-semibold tracking-wide text-foreground">
              Página <strong className="font-bold text-primary">{paginaAtual}</strong> de {totalPaginas}
            </span>

            <button
              onClick={() => {
                setPagina(Math.min(totalPaginas, paginaAtual + 1));
                window.scrollTo({ top: 350, behavior: "smooth" });
              }}
              disabled={paginaAtual === totalPaginas}
              aria-label="Próxima página"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            >
              &gt;
            </button>
          </div>
        )}
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">Preço em tempo real · 9° Ano Cohama · Feira do Empreendedor</footer>
      <Toaster position="bottom-center" />
    </div>
  );
}

function Card({ p, i, best, onAdd }: { p: Produto; i: number; best: boolean; onAdd: () => void }) {
  const pu = precoUnit(p);
  const dif = p.eq ? p.preco - p.eq.preco : 0;
  const nome = p.link
    ? <a href={p.link} target="_blank" rel="noopener" className="hover:underline decoration-moss">{p.nome}</a>
    : p.nome;
  return (
    <article style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
      className={`rise group relative flex flex-col rounded-3xl border bg-card p-3 transition hover:-translate-y-1 hover:shadow-xl ${best ? "border-moss ring-2 ring-moss/40" : "border-border"}`}>
      {best && (
        <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1 rounded-full bg-moss px-2.5 py-1 text-[11px] font-bold text-forest shadow">
          <Award className="h-3 w-3" /> Melhor preço/un
        </span>
      )}
      <div className="aspect-square overflow-hidden rounded-2xl bg-img p-4">
        {p.img && <img src={p.img} alt={p.nome} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-105" />}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        {/* Badge arredondado com destaque da loja */}
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
            p.loja === "Atacadão"
              ? "border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"
              : "border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              p.loja === "Atacadão" ? "bg-orange-500" : "bg-sky-500"
            }`}
          />
          {p.loja}
        </span>

        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-medium leading-snug">{nome}</h3>
        <div className="mt-auto pt-3">
          {p.de > p.preco && <div className="text-xs text-muted-foreground line-through">{brl(p.de)}</div>}
          <div className="font-display text-2xl font-bold">{brl(p.preco)}</div>
          {pu != null && <div className="text-xs font-semibold text-accent">{brl(pu)} {rotuloUn(p)}</div>}
        </div>
        {p.eq && (
          <div className={`mt-3 rounded-xl px-3 py-2 text-xs leading-snug ${dif > 0 ? "bg-rose/15" : "bg-moss/20"}`}>
            <b className="inline-flex items-center gap-1">
              {dif <= 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
              {dif <= 0 ? "Mais barato" : "Mais caro"}
            </b>{" "}que no {p.eq.loja} ({brl(p.eq.preco)})
          </div>
        )}
        <button onClick={onAdd}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </article>
  );
}

function Seg<T extends string>({ value, onChange, opts }: { value: T; onChange: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1.5 font-semibold transition ${value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}
function Toggle({ on, set, children }: { on: boolean; set: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button onClick={() => set(!on)}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${on ? "border-moss bg-moss/20" : "border-border bg-card text-muted-foreground"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full ${on ? "bg-moss text-forest" : "border border-border"}`}>{on && <Check className="h-3 w-3" />}</span>
      {children}
    </button>
  );
}
function Stat({ v, l, dot }: { v: string; l: string; dot?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="font-display text-2xl font-bold">{v}</div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}{l}</div>
    </div>
  );
}