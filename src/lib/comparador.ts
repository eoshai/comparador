// @ts-nocheck
// Lógica copiada sem alterações de comparador.html (pareamento + preço por unidade).

/** URL base do proxy — única constante a alterar. */
export const PROXY_BASE = "https://comparador-proxy.onrender.com";

export type Loja = "Atacadão" | "Mateus Mais";
export interface Produto {
  loja: Loja; nome: string; preco: number; de: number; img?: string; link: string | null;
  rank?: number; tok?: Set<string>; tam?: { qtd: number; base: string } | null; eq?: Produto | null;
}

export const brl = (n: number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

export async function buscarAtacadao(termo): Promise<Produto[]>{
  const r = await fetch(PROXY_BASE+"/api/atacadao?term="+encodeURIComponent(termo));
  if(!r.ok) throw new Error("Atacadão HTTP "+r.status);
  const j = await r.json();
  return j.data.search.products.edges.map(({node:n}) => ({
    loja:"Atacadão", nome:n.name, preco:n.offers.lowPrice, de:n.offers.highPrice,
    img:n.image?.[0]?.url, link:"https://www.atacadao.com.br/"+n.slug+"/p"}));
}

export async function buscarMateus(termo): Promise<Produto[]>{
  const r = await fetch(PROXY_BASE+"/api/mateus?term="+encodeURIComponent(termo));
  if(!r.ok) throw new Error("Mateus HTTP "+r.status);
  const j = await r.json();
  return j.hits.map(h => ({loja:"Mateus Mais", nome:h.name, preco:h.sale_price ?? h.price, de:h.price,
    img:h.small_image || h.image, link:null}));
}

export const DEMO: Produto[] = [
 {loja:"Atacadão",nome:"Ovo Branco Grande 20 un",preco:9.99,de:9.99},
 {loja:"Atacadão",nome:"Ovo Branco Grande 30 un",preco:18.75,de:18.75},
 {loja:"Atacadão",nome:"Ovo de Codorna 30 un",preco:6.99,de:7.35},
 {loja:"Atacadão",nome:"Ovo Caipira Vermelho Grande 20 un",preco:18.49,de:18.49},
 {loja:"Mateus Mais",nome:"Amaciante Downy Frescor da Primavera 1L",preco:17.99,de:31.59},
 {loja:"Mateus Mais",nome:"Amaciante Downy Brisa Intenso 1,5L",preco:31.99,de:44.29},
 {loja:"Mateus Mais",nome:"Amaciante Downy Brisa Suave 500ml",preco:14.59,de:17.85},
];

export const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const STOP = new Set(['de','da','do','com','e','para','o','a','em','un','pague','leve','frasco','pacote']);

// extrai tamanho do nome: devolve {qtd, base:'ml'|'g'|'un'}
export function tamanho(nome){
  const m = norm(nome).match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|un|unidades?)\b/);
  if(!m) return null;
  let q = parseFloat(m[1].replace(',','.')), u = m[2];
  if(u==='kg'){q*=1000;u='g'} else if(u==='l'){q*=1000;u='ml'} else if(u.startsWith('un')) u='un';
  return {qtd:q, base:u};
}
export function tokens(nome){
  return new Set(norm(nome).replace(/\d+(?:[.,]\d+)?\s*(kg|g|ml|l|un|unidades?)\b/g,' ')
    .split(/[^a-z0-9]+/).filter(w=>w && !STOP.has(w)));
}
export function jaccard(a,b){ let i=0; a.forEach(x=>{if(b.has(x))i++}); return i/(a.size+b.size-i||1); }
export function precoUnit(p){
  if(!p.tam) return null;
  const k = p.tam.base==='ml' ? 1000 : p.tam.base==='g' ? 1000 : 1;   // R$/L, R$/kg, R$/un
  return p.preco / p.tam.qtd * k;
}
export const rotuloUn = p => p.tam ? (p.tam.base==='ml'?'/L':p.tam.base==='g'?'/kg':'/un') : '';

// pareia produtos equivalentes entre lojas (mesmo tamanho + nomes parecidos)
export function parear(itens){
  itens.forEach(p=>{p.tok=tokens(p.nome); p.tam=tamanho(p.nome); p.eq=null;});
  for(const p of itens){
    let melhor=null, sc=0;
    for(const q of itens){
      if(q.loja===p.loja || !p.tam || !q.tam) continue;
      if(p.tam.base!==q.tam.base || p.tam.qtd!==q.tam.qtd) continue;
      const j = jaccard(p.tok,q.tok);
      if(j>sc){sc=j;melhor=q}
    }
    if(melhor && sc>=0.5) p.eq=melhor;
  }
}
