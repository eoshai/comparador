import { useEffect, useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, Copy, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { brl, type Loja, type Produto } from "@/lib/comparador";

export type Oferta = { nome: string; preco: number };
export type ItemCarrinho = { id: string; qtd: number; ofertas: Partial<Record<Loja, Oferta>> };

const KEY = "carrinho";

export function itemDe(p: Produto): ItemCarrinho {
  const ofertas: Partial<Record<Loja, Oferta>> = { [p.loja]: { nome: p.nome, preco: p.preco } };
  if (p.eq) ofertas[p.eq.loja] = { nome: p.eq.nome, preco: p.eq.preco };
  return { id: p.loja + "|" + p.nome, qtd: 1, ofertas };
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setItens(JSON.parse(s)); } catch {}
    setPronto(true);
  }, []);
  useEffect(() => { if (pronto) try { localStorage.setItem(KEY, JSON.stringify(itens)); } catch {} }, [itens, pronto]);

  const add = (p: Produto) => setItens((l) => {
    const novo = itemDe(p);
    // mesmo produto (por qualquer uma das lojas) soma quantidade
    const nomes = Object.values(novo.ofertas).map((o) => o!.nome);
    const k = l.findIndex((i) => Object.values(i.ofertas).some((o) => nomes.includes(o!.nome)));
    if (k >= 0) return l.map((i, j) => (j === k ? { ...i, qtd: i.qtd + 1 } : i));
    return [...l, novo];
  });
  const setQtd = (id: string, qtd: number) =>
    setItens((l) => (qtd <= 0 ? l.filter((i) => i.id !== id) : l.map((i) => (i.id === id ? { ...i, qtd } : i))));
  const limpar = () => setItens([]);
  return { itens, add, setQtd, limpar };
}

const LOJAS: Loja[] = ["Atacadão", "Mateus Mais"];
const dot = (l: Loja) => (l === "Atacadão" ? "bg-orange-500" : "bg-sky-500");

export function Carrinho({ c }: { c: ReturnType<typeof useCarrinho> }) {
  const { itens, setQtd, limpar } = c;
  const [copiado, setCopiado] = useState(false);
  const totalQtd = itens.reduce((s, i) => s + i.qtd, 0);

  const total = (l: Loja) => {
    let t = 0, falta = 0;
    itens.forEach((i) => { const o = i.ofertas[l]; if (o) t += o.preco * i.qtd; else falta++; });
    return { t, falta };
  };
  const melhorDe = (i: ItemCarrinho) =>
    LOJAS.filter((l) => i.ofertas[l]).reduce<Loja | null>((b, l) => (!b || i.ofertas[l]!.preco < i.ofertas[b]!.preco ? l : b), null);
  const misto = itens.reduce((s, i) => s + i.ofertas[melhorDe(i)!]!.preco * i.qtd, 0);
  const tots = LOJAS.map((l) => ({ l, ...total(l) }));
  const completas = tots.filter((x) => x.falta === 0);
  const refUnica = completas.length ? Math.min(...completas.map((x) => x.t)) : null;
  const economia = refUnica != null ? refUnica - misto : 0;

  function copiar() {
    const linhas: string[] = ["🛒 Lista de compras (melhor preço)"];
    LOJAS.forEach((l) => {
      const its = itens.filter((i) => melhorDe(i) === l);
      if (!its.length) return;
      linhas.push("", `*${l}*`);
      its.forEach((i) => linhas.push(`• ${i.qtd}x ${i.ofertas[l]!.nome} — ${brl(i.ofertas[l]!.preco * i.qtd)}`));
    });
    linhas.push("", `Total: ${brl(misto)}`);
    navigator.clipboard.writeText(linhas.join("\n"));
    setCopiado(true); setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Abrir carrinho"
          className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:scale-105">
          <ShoppingCart className="h-4 w-4" />
          {totalQtd > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{totalQtd}</span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-display text-2xl">Meu carrinho</SheetTitle>
        </SheetHeader>

        {itens.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-muted-foreground">
            <div>
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-40" />
              Seu carrinho está vazio.<br />Use o botão “Adicionar” nos produtos.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 border-b border-border p-5">
              {tots.map(({ l, t, falta }) => (
                <div key={l} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${dot(l)}`} />Tudo no {l}</div>
                    {falta > 0 && <div className="text-xs text-muted-foreground">{falta} {falta > 1 ? "itens indisponíveis" : "item indisponível"}</div>}
                  </div>
                  <div className={`font-display text-xl font-bold ${falta ? "text-muted-foreground" : ""}`}>{brl(t)}</div>
                </div>
              ))}
              <div className="rounded-2xl bg-moss/25 px-4 py-3 ring-2 ring-moss/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">Melhor combinação (as duas lojas)</div>
                  <div className="font-display text-xl font-bold">{brl(misto)}</div>
                </div>
                {economia > 0.009 && <div className="mt-1 text-xs font-semibold">Você economiza {brl(economia)} comprando nas duas lojas.</div>}
                {refUnica != null && economia <= 0.009 && <div className="mt-1 text-xs">Compensa comprar tudo numa loja só.</div>}
              </div>
            </div>

            <ul className="flex-1 space-y-3 overflow-y-auto p-5">
              {itens.map((i) => {
                const m = melhorDe(i)!;
                return (
                  <li key={i.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="line-clamp-2 text-sm font-medium">{i.ofertas[m]!.nome}</div>
                    <div className="mt-2 space-y-1">
                      {LOJAS.map((l) => (
                        <div key={l} className={`flex justify-between text-xs ${l === m ? "font-bold" : "text-muted-foreground"}`}>
                          <span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${dot(l)}`} />{l}{l === m && i.ofertas[l === "Atacadão" ? "Mateus Mais" : "Atacadão"] && " · mais barato"}</span>
                          <span>{i.ofertas[l] ? brl(i.ofertas[l]!.preco * i.qtd) : "não encontrado"}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button aria-label="Diminuir" onClick={() => setQtd(i.id, i.qtd - 1)} className="grid h-8 w-8 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center text-sm font-bold">{i.qtd}</span>
                        <button aria-label="Aumentar" onClick={() => setQtd(i.id, i.qtd + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button aria-label="Remover" onClick={() => setQtd(i.id, 0)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex gap-2 border-t border-border p-5">
              <button onClick={limpar} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold">Limpar</button>
              <button onClick={copiar} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copiado ? "Copiado!" : "Copiar lista p/ WhatsApp"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
