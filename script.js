// script.js

let representanteCount = 0;

// Inicializar o primeiro representante ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  adicionarRepresentante();
});

// LÓGICA DE ADICIONAR RESPONSÁVEL DINAMICAMENTE
function adicionarRepresentante() {
  representanteCount++;
  const container = document.getElementById('representantes-container');

  const card = document.createElement('div');
  card.id = `rep-card-${representanteCount}`;
  card.className = "bg-white p-4 rounded-lg border border-slate-300 relative space-y-3 shadow-sm";

  card.innerHTML = `
    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
      <span class="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
        <i data-lucide="user-check" class="w-4 h-4"></i> Responsável Legal / Sócio #${representanteCount}
      </span>
      ${representanteCount > 1 ? `
        <button type="button" onclick="removerRepresentante(${representanteCount})" class="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Remover
        </button>
      ` : ''}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
        <input type="text" name="rep_nome_${representanteCount}" placeholder="Nome do responsável" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-900">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
        <input type="text" name="rep_cpf_${representanteCount}" placeholder="000.000.000-00" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-900">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Cargo *</label>
        <input type="text" name="rep_cargo_${representanteCount}" placeholder="Ex: Sócio-Administrador, Diretor" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-900">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
        <input type="email" name="rep_email_${representanteCount}" placeholder="email@empresa.com.br" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-900">
      </div>

      <div class="md:col-span-2">
        <label class="block text-xs font-semibold text-slate-700 mb-1">Telefone Direto *</label>
        <input type="text" name="rep_tel_${representanteCount}" placeholder="(00) 00000-0000" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-blue-900">
      </div>
    </div>
  `;

  container.appendChild(card);
  lucide.createIcons();
}

function removerRepresentante(id) {
  const card = document.getElementById(`rep-card-${id}`);
  if (card) {
    card.remove();
  }
}

// CONSULTA AUTOMÁTICA BRASILAPI
async function consultarCNPJ() {
  const cnpj = document.getElementById('cnpj').value.replace(/\D/g, '');
  const loading = document.getElementById('cnpj-loading');
  
  if (cnpj.length !== 14) {
    alert('Por favor, digite um CNPJ válido com 14 dígitos.');
    return;
  }

  loading.classList.remove('hidden');

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!response.ok) throw new Error('CNPJ não encontrado');
    
    const data = await response.json();
    
    document.getElementById('empresa-email').value = data.email || '';
    document.getElementById('empresa-telefone').value = data.ddd_telefone_1 || '';
    document.getElementById('endereco').value = `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}`;
    
    if (data.opcao_pelo_simples) {
      document.getElementById('tributacao').value = 'simples';
    }

    alert(`Dados da empresa "${data.razao_social}" importados com sucesso!`);
  } catch (err) {
    alert('Não foi possível buscar os dados automaticamente. Preencha manualmente.');
  } finally {
    loading.classList.add('hidden');
  }
}

// TROCA DE PASSOS DA TRILHA
function nextStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`form-step-${i}`).classList.add('hidden');
    
    const node = document.getElementById(`step-node-${i}`);
    const icon = document.getElementById(`step-icon-${i}`);
    const status = document.getElementById(`step-status-${i}`);
    
    if (i < step) {
      node.classList.remove('opacity-60');
      icon.className = "w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center relative shadow-sm";
      icon.innerHTML = '<i data-lucide="check" class="w-6 h-6"></i>';
      status.className = "text-[10px] md:text-xs font-semibold text-emerald-600";
      status.innerText = "Concluído";
    } else if (i === step) {
      node.classList.remove('opacity-60');
      icon.className = "w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-900 border-4 border-amber-400 text-white flex items-center justify-center shadow-md animate-pulse";
      status.className = "text-[10px] md:text-xs font-semibold text-amber-500";
      status.innerText = "Você está aqui";
    } else {
      node.classList.add('opacity-60');
      icon.className = "w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center";
      status.className = "text-[10px] md:text-xs font-semibold text-slate-400";
      status.innerText = "Aguardando";
    }
  }

  document.getElementById(`form-step-${step}`).classList.remove('hidden');
  lucide.createIcons();
}

function toggleLGPDWarning(checkbox) {
  const warning = document.getElementById('lgpd-warning');
  const btnNext = document.getElementById('btn-step-3-next');
  
  if (checkbox.checked) {
    warning.classList.add('hidden');
    btnNext.disabled = false;
    btnNext.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    warning.classList.remove('hidden');
    btnNext.disabled = true;
    btnNext.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function finalizarCadastro() {
  alert('Cadastro enviado com sucesso ao Portal Petronect!');
}