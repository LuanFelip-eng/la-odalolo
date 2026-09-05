/* =========================================================
   LAÇOS DA LÔLÔ — CAMADA DE DADOS COMPARTILHADA
   Usada pelo site público (js/script.js) e pelo painel
   administrativo (dashboard/js/*.js).

   Hoje: localStorage.
   Preparado para futuramente virar chamadas ao Supabase
   (Database, Storage e Auth) sem precisar reescrever quem
   consome este arquivo — troque só o "miolo" das funções
   abaixo por chamadas assíncronas (async/await + Supabase).
   ========================================================= */

/* =========================================================
   ⚙️ CONFIGURAÇÕES GERAIS — edite aqui
   ========================================================= */
const CONFIG = {
  NOME_LOJA: "Laços da Lôlô",
  // Número de WhatsApp da loja, formato internacional sem espaços/símbolos (DDI + DDD + número)
  WHATSAPP_NUMERO: "5585992773336",
  MENSAGEM_WHATSAPP_FLUTUANTE: "Olá! Vim pelo site da Laços da Lôlô e gostaria de tirar uma dúvida.",
  CORES_PRINCIPAIS: {
    rosa: "#F2A6C6",
    lilas: "#C6B2EA",
    azul: "#A9D6EC",
    amarelo: "#F7D488"
  }
};

/* =========================================================
   🗄️ CHAVES DE ARMAZENAMENTO (localStorage)
   Estrutura pensada para futura substituição por uma API.
   ========================================================= */
const CHAVES = {
  PRODUTOS: "lacos_produtos",
  CORES: "lacos_cores",
  VARIACOES: "lacos_variacoes",
  CATEGORIAS: "lacos_categorias",
  CARRINHO: "lacos_carrinho",
  SESSAO_ADMIN: "lacos_sessao_admin",
  CREDENCIAL_ADMIN: "lacos_credencial_admin"
};

/* =========================================================
   🖼️ IMAGENS DISPONÍVEIS NO PROJETO
   Como ainda não temos upload para um servidor/Storage,
   o seletor de imagens do dashboard escolhe entre os
   arquivos que já existem dentro de img/ e img/produtos/.

   Quando adicionar uma imagem nova na pasta do projeto,
   adicione o caminho dela aqui também para que apareça
   no seletor do dashboard.

   Preparado para futuramente ser substituído por uma
   listagem vinda do Supabase Storage.
   ========================================================= */


/* =========================================================
   🌱 DADOS DE EXEMPLO (seed) — usados apenas se ainda
   não existir nada salvo no localStorage.
   ========================================================= */
const CORES_SEED = [
  { id: "rosa",    nome: "Rosa",    codigo: "#F2A6C6", ativo: true },
  { id: "lilas",   nome: "Lilás",   codigo: "#C6B2EA", ativo: true },
  { id: "azul",    nome: "Azul",    codigo: "#A9D6EC", ativo: true },
  { id: "amarelo", nome: "Amarelo", codigo: "#F7D488", ativo: true },
  { id: "branco",  nome: "Branco",  codigo: "#FBEFF3", ativo: true },
  { id: "coral",   nome: "Coral",   codigo: "#F6B5A8", ativo: true }
];

const VARIACOES_SEED = ["Pequeno", "Médio", "Grande"];

const CATEGORIAS_SEED = [
  { id: "Laços",     nome: "Laços",     ativo: true },
  { id: "Presilhas", nome: "Presilhas", ativo: true },
  { id: "Tiaras",    nome: "Tiaras",    ativo: true },
  { id: "Kits",      nome: "Kits",      ativo: true }
];


/* =========================================================
   🧠 CAMADA DE DADOS (hoje: localStorage — amanhã: API)
   Isolar todo o acesso a dados aqui facilita a troca futura
   por chamadas de backend/banco de dados (Supabase).
   ========================================================= */
const Dados = {
  _ler(chave, semente){
    const bruto = localStorage.getItem(chave);
    if(bruto){
      try{ return JSON.parse(bruto); }catch(e){ /* segue para semente */ }
    }
    localStorage.setItem(chave, JSON.stringify(semente));
    return semente;
  },
  _salvar(chave, valor){
    localStorage.setItem(chave, JSON.stringify(valor));
  },

  /* ---------- PRODUTOS ---------- */

  
  _normalizarProduto(p){
    return {
      precoPromocional: null,
      estoque: 0,
      sku: "",
      destaque: false,
      imagens: p.imagem ? [p.imagem] : [],
      ...p
    };
  },

  // usado pelo site público — só produtos ativos
    listarProdutos(){
    return this._ler(CHAVES.PRODUTOS, [])
    .map(p => this._normalizarProduto(p))
    .filter(p => p.ativo !== false);
},

  // usado pelo dashboard — todos, ativos e inativos
 listarTodosProdutos(){
  return this._ler(CHAVES.PRODUTOS, [])
    .map(p => this._normalizarProduto(p));
},

 obterProduto(id){
  return this.listarProdutos().find(
    p => String(p.id) === String(id)
  );
},

  obterProdutoPorId(id){
  return this.listarTodosProdutos().find(
    p => String(p.id) === String(id)
  );
},

  salvarProdutos(lista){
    this._salvar(CHAVES.PRODUTOS, lista);
  },

  gerarIdProduto(){
    const lista = this.listarTodosProdutos();
    return lista.length ? Math.max(...lista.map(p => p.id)) + 1 : 1;
  },

  adicionarProduto(dadosProduto){
    const lista = this.listarTodosProdutos();
    const novo = this._normalizarProduto({
      ...dadosProduto,
      id: this.gerarIdProduto()
    });
    lista.push(novo);
    this.salvarProdutos(lista);
    return novo;
  },

  editarProduto(id, dadosAtualizados){
    const lista = this.listarTodosProdutos();
    const indice = lista.findIndex(p => p.id === Number(id));
    if(indice === -1) return null;
    lista[indice] = this._normalizarProduto({ ...lista[indice], ...dadosAtualizados, id: Number(id) });
    this.salvarProdutos(lista);
    return lista[indice];
  },

  excluirProduto(id){
    const lista = this.listarTodosProdutos().filter(p => p.id !== Number(id));
    this.salvarProdutos(lista);
  },

  alternarStatusProduto(id){
    const lista = this.listarTodosProdutos();
    const produto = lista.find(p => p.id === Number(id));
    if(!produto) return null;
    produto.ativo = !produto.ativo;
    this.salvarProdutos(lista);
    return produto;
  },

  buscarProduto(termo, incluirInativos){
    const lista = incluirInativos ? this.listarTodosProdutos() : this.listarProdutos();
    const t = (termo || "").trim().toLowerCase();
    if(!t) return lista;
    return lista.filter(p =>
      p.nome.toLowerCase().includes(t) ||
      (p.sku || "").toLowerCase().includes(t) ||
      p.categoria.toLowerCase().includes(t)
    );
  },

  /* ---------- CORES ---------- */
  listarCores(){ return this._ler(CHAVES.CORES, CORES_SEED).filter(c => c.ativo); },
  listarTodasCores(){ return this._ler(CHAVES.CORES, CORES_SEED); },
  obterCor(idCor){ return this.listarTodasCores().find(c => c.id === idCor); },

  /* ---------- VARIAÇÕES ---------- */
  listarVariacoes(){ return this._ler(CHAVES.VARIACOES, VARIACOES_SEED); },

  /* ---------- CATEGORIAS ---------- */
  listarCategorias(){
    // usado pelo site: retorna só os nomes das categorias ativas (mantém compatibilidade)
    return this._ler(CHAVES.CATEGORIAS, CATEGORIAS_SEED).filter(c => c.ativo).map(c => c.nome);
  },
  listarTodasCategorias(){
    return this._ler(CHAVES.CATEGORIAS, CATEGORIAS_SEED);
  },
  salvarCategorias(lista){
    this._salvar(CHAVES.CATEGORIAS, lista);
  },
  adicionarCategoria(nome){
    const lista = this.listarTodasCategorias();
    const existe = lista.some(c => c.nome.trim().toLowerCase() === nome.trim().toLowerCase());
    if(existe) return { erro: "Já existe uma categoria com esse nome." };
    const nova = { id: nome.trim(), nome: nome.trim(), ativo: true };
    lista.push(nova);
    this.salvarCategorias(lista);
    return { categoria: nova };
  },
  editarCategoria(id, novoNome){
    const lista = this.listarTodasCategorias();
    const cat = lista.find(c => c.id === id);
    if(!cat) return { erro: "Categoria não encontrada." };
    const duplicada = lista.some(c => c.id !== id && c.nome.trim().toLowerCase() === novoNome.trim().toLowerCase());
    if(duplicada) return { erro: "Já existe uma categoria com esse nome." };

    // atualiza produtos que usavam o nome antigo, para não quebrar o vínculo
    const nomeAntigo = cat.nome;
    cat.nome = novoNome.trim();
    this.salvarCategorias(lista);

    const produtos = this.listarTodosProdutos();
    let mudou = false;
    produtos.forEach(p => { if(p.categoria === nomeAntigo){ p.categoria = cat.nome; mudou = true; } });
    if(mudou) this.salvarProdutos(produtos);

    return { categoria: cat };
  },
  excluirCategoria(id){
    const lista = this.listarTodasCategorias().filter(c => c.id !== id);
    this.salvarCategorias(lista);
  },
  alternarStatusCategoria(id){
    const lista = this.listarTodasCategorias();
    const cat = lista.find(c => c.id === id);
    if(!cat) return null;
    cat.ativo = !cat.ativo;
    this.salvarCategorias(lista);
    return cat;
  },

  /* ---------- CARRINHO ---------- */
  lerCarrinho(){ return this._ler(CHAVES.CARRINHO, []); },
  salvarCarrinho(carrinho){ this._salvar(CHAVES.CARRINHO, carrinho); }
};

/* =========================================================
   🎀 UTILITÁRIOS COMPARTILHADOS
   ========================================================= */
function formatarPreco(valor){
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function $(seletor, escopo){ return (escopo || document).querySelector(seletor); }
function $all(seletor, escopo){ return Array.from((escopo || document).querySelectorAll(seletor)); }
