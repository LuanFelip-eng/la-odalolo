/* =========================================================
   LAÇOS DA LÔLÔ — SCRIPT PRINCIPAL DO SITE (PARTE VISUAL)
   A camada de dados (CONFIG, CHAVES, seeds, objeto Dados,
   formatarPreco, $, $all) mora agora em js/dados.js, que
   este arquivo espera que já tenha sido carregado antes
   dele no HTML (veja index.html).
   ========================================================= */

/* =========================================================
   🧭 CABEÇALHO / MENU MOBILE
   ========================================================= */

const SUPABASE_URL = "https://uczemxrafdjxmoeshygp.supabase.co";

const SUPABASE_KEY = "sb_publishable_tGT7hRjpq1CgCd9semzbbw_vLDzQdn5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);




  (function iniciarCabecalho(){
  const cabecalho = $("#cabecalho");
  const btnHamburguer = $("#btnHamburguer");
  const nav = $("#navPrincipal");

  window.addEventListener("scroll", () => {
    cabecalho.classList.toggle("rolado", window.scrollY > 12);
  });

  btnHamburguer.addEventListener("click", () => {
    btnHamburguer.classList.toggle("aberto");
    nav.classList.toggle("aberto");
  });

  $all(".nav-principal a").forEach(link => {
    link.addEventListener("click", () => {
      btnHamburguer.classList.remove("aberto");
      nav.classList.remove("aberto");
    });
  });
})();

/* =========================================================
   ✨ ANIMAÇÃO DE ENTRADA AO ROLAR A PÁGINA
   ========================================================= */
(function iniciarRevelacaoScroll(){
  const alvos = $all(".revelar, .card-produto");
  if(!("IntersectionObserver" in window)){
    alvos.forEach(el => el.classList.add("visivel"));
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if(entrada.isIntersecting){
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });
  alvos.forEach(el => observador.observe(el));
})();

/* =========================================================
   🎀 INTERAÇÃO ESPECIAL COM O LAÇO DO HERO
   Ao tocar/clicar: o laço "dança" e soltam-se
   brilhos/corações delicados ao redor.
   ========================================================= */
(function iniciarLacoInterativo(){
  const palco = $("#palcoLaco");
  const laco = $("#lacoSvg");
  if(!palco || !laco) return;

  const emojisParticula = ["✨", "💕", "🎀", "💫"];

  function criarParticulas(){
    for(let i = 0; i < 6; i++){
      const p = document.createElement("span");
      p.className = "particula brilha";
      p.textContent = emojisParticula[Math.floor(Math.random() * emojisParticula.length)];
      const anguloX = (Math.random() - 0.5) * 160;
      p.style.setProperty("--dx", `${anguloX}px`);
      p.style.left = `${45 + (Math.random() * 20)}%`;
      p.style.top = `${40 + (Math.random() * 15)}%`;
      p.style.animationDelay = `${i * 0.04}s`;
      palco.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  }

  function dancar(){
    laco.classList.remove("dancando");
    // força reflow para permitir reiniciar a animação
    void laco.offsetWidth;
    laco.classList.add("dancando");
    criarParticulas();
  }

  palco.addEventListener("click", dancar);
  palco.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); dancar(); }
  });
})();

/* =========================================================
   🛒 ESTADO DO CARRINHO
   ========================================================= */
const Carrinho = {
  itens: Dados.lerCarrinho(),

  chaveItem(produtoId, cor, variacao){
    return `${produtoId}-${cor}-${variacao}`;
  },

  adicionar(produto, cor, variacao, quantidade){
    const chave = this.chaveItem(produto.id, cor, variacao);
    const existente = this.itens.find(i => i.chave === chave);
    if(existente){
      existente.quantidade += quantidade;
    }else{
      this.itens.push({
        chave,
        produtoId: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        preco: produto.preco,
        cor,
        variacao,
        quantidade
      });
    }
    this.persistir();
  },

  alterarQuantidade(chave, delta){
    const item = this.itens.find(i => i.chave === chave);
    if(!item) return;
    item.quantidade += delta;
    if(item.quantidade <= 0){
      this.itens = this.itens.filter(i => i.chave !== chave);
    }
    this.persistir();
  },

  remover(chave){
    this.itens = this.itens.filter(i => i.chave !== chave);
    this.persistir();
  },

  total(){
    return this.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  },

  quantidadeTotal(){
    return this.itens.reduce((soma, item) => soma + item.quantidade, 0);
  },

  persistir(){
    Dados.salvarCarrinho(this.itens);
    UI.renderizarCarrinho();
  }
};

/* =========================================================
   🖼️ RENDERIZAÇÃO DA INTERFACE
   ========================================================= */
const UI = {
  produtoSelecionado: null,
  corSelecionada: null,
  variacaoSelecionada: null,
  qtdSelecionada: 1,
  imagemAtualIndex: 0,

  /* ---------- CATÁLOGO ---------- */
  montarFiltros(){
    const selectCategoria = $("#filtroCategoria");
    Dados.listarCategorias().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat; opt.textContent = cat;
      selectCategoria.appendChild(opt);
    });

    const selectCor = $("#filtroCor");
    Dados.listarCores().forEach(cor => {
      const opt = document.createElement("option");
      opt.value = cor.id; opt.textContent = cor.nome;
      selectCor.appendChild(opt);
    });
  },

  produtosFiltrados(){
    const termo = $("#campoPesquisa").value.trim().toLowerCase();
    const categoria = $("#filtroCategoria").value;
    const cor = $("#filtroCor").value;
    const faixa = $("#filtroPreco").value;

    return Dados.listarProdutos().filter(produto => {
      const combinaTermo = !termo || produto.nome.toLowerCase().includes(termo) || produto.descricao.toLowerCase().includes(termo);
      const combinaCategoria = !categoria || produto.categoria === categoria;
      const combinaCor = !cor || produto.cores.includes(cor);
      let combinaFaixa = true;
      if(faixa){
        const [min, max] = faixa.split("-").map(Number);
        combinaFaixa = produto.preco >= min && produto.preco <= max;
      }
      return combinaTermo && combinaCategoria && combinaCor && combinaFaixa;
    });
  },

  renderizarCatalogo(){
    const grade = $("#gradeProdutos");
    const produtos = this.produtosFiltrados();
    grade.innerHTML = "";

    if(produtos.length === 0){
      grade.innerHTML = `<div class="estado-vazio">Nenhum laço encontrado com esses filtros. 🎀<br>Tente outra busca!</div>`;
      return;
    }

    produtos.forEach(produto => {
      const card = document.createElement("article");
      card.className = "card-produto revelar";
      card.innerHTML = `
        <div class="capa-produto">
          ${produto.selo ? `<span class="selo-produto">${produto.selo}</span>` : ""}
          <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
        </div>
        <div class="corpo-produto">
          <h3>${produto.nome}</h3>
          <p class="descricao-curta">${produto.descricao}</p>
          <div class="linha-preco-cores">
            <span class="preco-produto">${formatarPreco(produto.preco)}</span>
            <div class="mini-cores">
              ${produto.cores.slice(0, 4).map(idCor => {
                const cor = Dados.obterCor(idCor);
                return cor ? `<span class="bolinha-cor" style="background:${cor.codigo}" title="${cor.nome}"></span>` : "";
              }).join("")}
            </div>
          </div>
          <div class="acoes-produto">
            <button class="botao botao-secundario" data-ver="${produto.id}">Ver detalhes</button>
            <button class="botao botao-primario" data-add-rapido="${produto.id}">Adicionar</button>
          </div>
        </div>
      `;
      grade.appendChild(card);
    });

    // liga eventos dos novos cards
    $all("[data-ver]").forEach(btn => btn.addEventListener("click", () => this.abrirModal(btn.dataset.ver)));
    $all("[data-add-rapido]").forEach(btn => btn.addEventListener("click", () => {
      const produto = Dados.obterProduto(btn.dataset.addRapido);
      const corPadrao = produto.cores[0];
      const variacaoPadrao = produto.variacoes[0];
      Carrinho.adicionar(produto, corPadrao, variacaoPadrao, 1);
      this.mostrarToast(`${produto.nome} adicionado ao carrinho!`);
    }));

    // observa novos cards para a animação de entrada
    if("IntersectionObserver" in window){
      const observador = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
          if(entrada.isIntersecting){
            entrada.target.classList.add("visivel");
            observador.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.1 });
      $all(".card-produto").forEach(el => observador.observe(el));
    }else{
      $all(".card-produto").forEach(el => el.classList.add("visivel"));
    }
  },

  /* ---------- MODAL DE PRODUTO ---------- */
  abrirModal(produtoId){
    const produto = Dados.obterProduto(produtoId);
    if(!produto) return;

    this.produtoSelecionado = produto;
    this.corSelecionada = produto.cores[0];
    this.variacaoSelecionada = produto.variacoes[0];
    this.qtdSelecionada = 1;
    this.imagemAtualIndex = 0;

    $("#nomeModal").textContent = produto.nome;
    $("#precoModal").textContent = formatarPreco(produto.preco);
    $("#descricaoModal").textContent = produto.descricao;
    $("#qtdModal").textContent = "1";

    this.renderizarGaleriaModal();
    this.renderizarOpcoesCor();
    this.renderizarOpcoesVariacao();

    $("#sobreposicaoModal").classList.add("visivel");
    document.body.style.overflow = "hidden";
  },

  fecharModal(){
    $("#sobreposicaoModal").classList.remove("visivel");
    document.body.style.overflow = "";
  },

  renderizarGaleriaModal(){
    const produto = this.produtoSelecionado;
    const imagens = produto.imagens && produto.imagens.length ? produto.imagens : [produto.imagem];
    $("#imagemPrincipalModal").src = imagens[this.imagemAtualIndex];
    $("#imagemPrincipalModal").alt = produto.nome;

    const wrap = $("#miniaturasModal");
    wrap.innerHTML = "";
    if(imagens.length > 1){
      imagens.forEach((img, indice) => {
        const btn = document.createElement("button");
        btn.className = indice === this.imagemAtualIndex ? "ativa" : "";
        btn.innerHTML = `<img src="${img}" alt="Miniatura ${indice + 1}">`;
        btn.addEventListener("click", () => {
          this.imagemAtualIndex = indice;
          this.renderizarGaleriaModal();
        });
        wrap.appendChild(btn);
      });
    }
  },

  renderizarOpcoesCor(){
    const wrap = $("#opcoesCorModal");
    wrap.innerHTML = "";
    this.produtoSelecionado.cores.forEach(idCor => {
      const cor = Dados.obterCor(idCor);
      if(!cor) return;
      const btn = document.createElement("button");
      btn.className = "opcao-cor" + (idCor === this.corSelecionada ? " selecionada" : "");
      btn.style.background = cor.codigo;
      btn.setAttribute("aria-label", cor.nome);
      btn.title = cor.nome;
      btn.addEventListener("click", () => {
        this.corSelecionada = idCor;
        this.renderizarOpcoesCor();
      });
      wrap.appendChild(btn);
    });
  },

  renderizarOpcoesVariacao(){
    const wrap = $("#opcoesVariacaoModal");
    wrap.innerHTML = "";
    this.produtoSelecionado.variacoes.forEach(variacao => {
      const btn = document.createElement("button");
      btn.className = "opcao-variacao" + (variacao === this.variacaoSelecionada ? " selecionada" : "");
      btn.textContent = variacao;
      btn.addEventListener("click", () => {
        this.variacaoSelecionada = variacao;
        this.renderizarOpcoesVariacao();
      });
      wrap.appendChild(btn);
    });
  },

  /* ---------- CARRINHO (GAVETA) ---------- */
  abrirCarrinho(){
    $("#gavetaCarrinho").classList.add("aberta");
    document.body.style.overflow = "hidden";
  },
  fecharCarrinho(){
    $("#gavetaCarrinho").classList.remove("aberta");
    document.body.style.overflow = "";
  },

  renderizarCarrinho(){
    const container = $("#itensCarrinho");
    const rodape = $("#rodapeCarrinho");
    const contador = $("#contadorCarrinho");

    contador.textContent = Carrinho.quantidadeTotal();

    if(Carrinho.itens.length === 0){
      container.innerHTML = `
        <div class="carrinho-vazio">
          <span class="emoji-vazio">🎀</span>
          Seu carrinho ainda está vazio.<br>Que tal escolher um laço especial?
        </div>`;
      rodape.style.display = "none";
      return;
    }

    rodape.style.display = "flex";
    container.innerHTML = Carrinho.itens.map(item => {
      const cor = Dados.obterCor(item.cor);
      const subtotal = item.preco * item.quantidade;
      return `
        <div class="item-carrinho">
          <img src="${item.imagem}" alt="${item.nome}">
          <div class="info-item-carrinho">
            <h4>${item.nome}</h4>
            <p class="meta-item">${cor ? cor.nome : ""} · ${item.variacao}</p>
            <div class="controle-qtd-carrinho">
              <button data-menos="${item.chave}" aria-label="Diminuir quantidade">−</button>
              <span>${item.quantidade}</span>
              <button data-mais="${item.chave}" aria-label="Aumentar quantidade">+</button>
            </div>
            <p class="subtotal-item">${formatarPreco(subtotal)}</p>
          </div>
          <button class="remover-item" data-remover="${item.chave}" aria-label="Remover item">✕</button>
        </div>
      `;
    }).join("");

    $("#totalCarrinho").textContent = formatarPreco(Carrinho.total());

    $all("[data-menos]").forEach(b => b.addEventListener("click", () => Carrinho.alterarQuantidade(b.dataset.menos, -1)));
    $all("[data-mais]").forEach(b => b.addEventListener("click", () => Carrinho.alterarQuantidade(b.dataset.mais, 1)));
    $all("[data-remover]").forEach(b => b.addEventListener("click", () => Carrinho.remover(b.dataset.remover)));
  },

  /* ---------- TOAST ---------- */
  mostrarToast(texto){
    const toast = $("#toast");
    $("#toastTexto").textContent = texto;
    toast.classList.add("mostrar");
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => toast.classList.remove("mostrar"), 2600);
  }
};

/* =========================================================
   📲 MONTAGEM DA MENSAGEM E ABERTURA DO WHATSAPP
   ========================================================= */
function montarMensagemPedido(){
  let mensagem = `Olá! Gostaria de fazer um pedido na ${CONFIG.NOME_LOJA}.\n\n🛍️ Pedido:\n`;

  Carrinho.itens.forEach(item => {
    const cor = Dados.obterCor(item.cor);
    const subtotal = item.preco * item.quantidade;
    mensagem += `\n🎀 ${item.nome}\n`;
    mensagem += `Cor: ${cor ? cor.nome : item.cor}\n`;
    mensagem += `Tamanho: ${item.variacao}\n`;
    mensagem += `Quantidade: ${item.quantidade}\n`;
    mensagem += `Preço unitário: ${formatarPreco(item.preco)}\n`;
    mensagem += `Subtotal: ${formatarPreco(subtotal)}\n`;
  });

  mensagem += `\n💰 Total: ${formatarPreco(Carrinho.total())}\n\nGostaria de confirmar meu pedido.`;
  return mensagem;
}

function abrirWhatsAppComMensagem(mensagem){
  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener");
}

/* =========================================================
   🔗 LIGAÇÃO DOS EVENTOS GERAIS
   ========================================================= */
function iniciarEventos(){
  // filtros e busca do catálogo
  ["#campoPesquisa", "#filtroCategoria", "#filtroCor", "#filtroPreco"].forEach(sel => {
    const el = $(sel);
    const evento = sel === "#campoPesquisa" ? "input" : "change";
    el.addEventListener(evento, () => UI.renderizarCatalogo());
  });

  // modal de produto
  $("#btnFecharModal").addEventListener("click", () => UI.fecharModal());
  $("#sobreposicaoModal").addEventListener("click", (e) => {
    if(e.target.id === "sobreposicaoModal") UI.fecharModal();
  });
  $("#btnQtdMenos").addEventListener("click", () => {
    if(UI.qtdSelecionada > 1) UI.qtdSelecionada--;
    $("#qtdModal").textContent = UI.qtdSelecionada;
  });
  $("#btnQtdMais").addEventListener("click", () => {
    UI.qtdSelecionada++;
    $("#qtdModal").textContent = UI.qtdSelecionada;
  });
  $("#btnAdicionarModal").addEventListener("click", () => {
    Carrinho.adicionar(UI.produtoSelecionado, UI.corSelecionada, UI.variacaoSelecionada, UI.qtdSelecionada);
    UI.mostrarToast(`${UI.produtoSelecionado.nome} adicionado ao carrinho!`);
    UI.fecharModal();
    UI.abrirCarrinho();
  });

  // carrinho
  $("#btnAbrirCarrinho").addEventListener("click", () => UI.abrirCarrinho());
  $("#btnFecharCarrinho").addEventListener("click", () => UI.fecharCarrinho());
  $("#btnFinalizarPedido").addEventListener("click", () => {
    if(Carrinho.itens.length === 0) return;
    const mensagem = montarMensagemPedido();
    abrirWhatsAppComMensagem(mensagem);
  });

  // fechar sobreposições com ESC
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      UI.fecharModal();
      UI.fecharCarrinho();
    }
  });

  // whatsapp flutuante + link do rodapé
  const urlWhatsFlutuante = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent(CONFIG.MENSAGEM_WHATSAPP_FLUTUANTE)}`;
  $("#btnWhatsFlutuante").setAttribute("href", urlWhatsFlutuante);
  const linkRodape = $("#linkRodapeWhats");
  if(linkRodape){
    linkRodape.setAttribute("href", urlWhatsFlutuante);
    linkRodape.setAttribute("target", "_blank");
    linkRodape.setAttribute("rel", "noopener");
  }

  // ano atual no rodapé
  const anoEl = $("#anoAtual");
  if(anoEl) anoEl.textContent = new Date().getFullYear();
}

/* =========================================================
   🚀 INICIALIZAÇÃO
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*");

  console.log("ERRO:", error);
  console.log("DADOS:", data);

  if (error) {
    console.error("Erro Supabase:", error);
    return;
  }

  localStorage.setItem(
    "lacos_produtos",
    JSON.stringify(data || [])
  );

  UI.montarFiltros();
  UI.renderizarCatalogo();
  UI.renderizarCarrinho();
  iniciarEventos();

}); // <- linha 546 aproximadamente


// COLE AQUI EMBAIXO

const herolaco = document.querySelector(".hero-laco");

if (herolaco) {

  function moverLaco(xPos, yPos) {

    const x = (xPos / window.innerWidth - 0.5) * 30;
    const y = (yPos / window.innerHeight - 0.5) * 30;

    herolaco.style.transform =
      `translate(${x}px, ${y}px) rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  // Computador
  document.addEventListener("mousemove", (e) => {
    moverLaco(e.clientX, e.clientY);
  });

  // Celular
  document.addEventListener("touchmove", (e) => {
    const toque = e.touches[0];
    moverLaco(toque.clientX, toque.clientY);
  });

}

  });

}
