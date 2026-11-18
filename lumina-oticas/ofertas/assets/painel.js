document.addEventListener('DOMContentLoaded', () => {
    const leadsTableBody = document.getElementById('leads-table-body');
    const loadingSpinner = document.getElementById('loading-spinner');

    const kpiTotalLeads = document.getElementById('kpi-total-leads');
    const kpiLeadsToday = document.getElementById('kpi-leads-today');
    const kpiBestUnit = document.getElementById('kpi-best-unit');
    const kpiBestCampaign = document.getElementById('kpi-best-campaign');

    const filtersForm = document.getElementById('filters-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const unitFilterInput = document.getElementById('unit-filter');
    const clearFiltersButton = document.getElementById('clear-filters');
    const searchInput = document.getElementById('search-input');
    const exportCsvButton = document.getElementById('export-csv');

    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const sortableHeaders = document.querySelectorAll('th.sortable');

    let allLeads = [];
    let displayedLeads = [];
    let currentPage = 1;
    const LEADS_PER_PAGE = 15;
    let sortState = { column: 'dataCadastro', direction: 'desc' };

    function makeTimestamp(ms) {
        return {
            toDate: () => new Date(ms),
            toMillis: () => ms
        };
    }

    function formatTimestamp(timestamp) {
        if (!timestamp || !timestamp.toDate) return 'Data inválida';
        const date = timestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function formatUnitName(unitSlug) {
        if (!unitSlug) return 'Não especificada';
        return unitSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function renderTablePage() {
        leadsTableBody.innerHTML = '';
        const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
        const endIndex = startIndex + LEADS_PER_PAGE;
        const pageLeads = displayedLeads.slice(startIndex, endIndex);

        if (pageLeads.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.textContent = 'Nenhum lead encontrado.';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            leadsTableBody.appendChild(tr);
            return;
        }

        const createCell = (text) => {
            const td = document.createElement('td');
            td.textContent = text;
            return td;
        };

        pageLeads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.appendChild(createCell(formatTimestamp(lead.dataCadastro)));
            tr.appendChild(createCell(lead.nome || ''));
            tr.appendChild(createCell(lead.telefone || ''));
            tr.appendChild(createCell(lead.email || ''));
            tr.appendChild(createCell(formatUnitName(lead.unidade)));
            tr.appendChild(createCell(lead.origem ? (lead.origem.campaign || 'N/A') : 'N/A'));
            leadsTableBody.appendChild(tr);
        });
    }

    function updatePagination() {
        const totalPages = Math.ceil(displayedLeads.length / LEADS_PER_PAGE);
        pageInfo.textContent = `Página ${currentPage} de ${totalPages > 0 ? totalPages : 1}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    }

    function updateKpis(leads) {
        kpiTotalLeads.textContent = leads.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const leadsToday = leads.filter(l => l.dataCadastro && l.dataCadastro.toDate() >= today);
        kpiLeadsToday.textContent = leadsToday.length;

        const calculateBestOf = (key) => {
            if (leads.length === 0) return "N/A";
            const counts = leads.reduce((acc, lead) => {
                const value = key === 'unidade' ? lead.unidade : lead.origem?.campaign;
                if (value) acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
            if (Object.keys(counts).length === 0) return "N/A";
            const bestSlug = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            return key === 'unidade' ? formatUnitName(bestSlug) : bestSlug;
        };

        kpiBestUnit.textContent = calculateBestOf('unidade');
        kpiBestCampaign.textContent = calculateBestOf('campaign');
    }

    function updateDisplay() {
        const startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
        const selectedUnit = unitFilterInput.value;
        const searchTerm = searchInput.value.toLowerCase();

        let filteredLeads = allLeads.filter(lead => {
            const leadDate = lead.dataCadastro ? lead.dataCadastro.toDate() : null;
            if (!leadDate) return false;
            const isAfterStartDate = !startDate || leadDate >= startDate;
            const isBeforeEndDate = !endDate || leadDate <= endDate;
            const isCorrectUnit = !selectedUnit || lead.unidade === selectedUnit;
            const matchesSearch = !searchTerm ||
                (lead.nome && lead.nome.toLowerCase().includes(searchTerm)) ||
                (lead.email && lead.email.toLowerCase().includes(searchTerm)) ||
                (lead.telefone && lead.telefone.includes(searchTerm));
            return isAfterStartDate && isBeforeEndDate && isCorrectUnit && matchesSearch;
        });

        filteredLeads.sort((a, b) => {
            let valA, valB;
            if (sortState.column === 'dataCadastro') {
                valA = a.dataCadastro?.toMillis() || 0;
                valB = b.dataCadastro?.toMillis() || 0;
            } else if (sortState.column === 'campanha') {
                valA = a.origem?.campaign?.toLowerCase() || '';
                valB = b.origem?.campaign?.toLowerCase() || '';
            } else {
                valA = a[sortState.column]?.toLowerCase() || '';
                valB = b[sortState.column]?.toLowerCase() || '';
            }
            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        });

        displayedLeads = filteredLeads;
        currentPage = 1;
        renderTablePage();
        updatePagination();
    }

    function exportToCsv() {
        if (displayedLeads.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const headers = ["Data de Cadastro", "Nome", "Telefone", "Email", "Unidade", "Campanha (UTM)"];
        const rows = displayedLeads.map(lead => [
            `"${formatTimestamp(lead.dataCadastro)}"`,
            `"${lead.nome || ''}"`,
            `"${lead.telefone || ''}"`,
            `"${lead.email || ''}"`,
            `"${formatUnitName(lead.unidade)}"`,
            `"${lead.origem ? (lead.origem.campaign || 'N/A') : 'N/A'}"`
        ].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(',')].concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads_lumina_oticas.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function loadDemoLeads() {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        const now = Date.now();
        const hr = 3600 * 1000;
        const day = 24 * hr;

        const seedLeads = [
            { ms: now - 15 * 60 * 1000, nome: 'Mariana Costa Ribeiro', telefone: '(22) 99814-2390', email: 'mariana.ribeiro@gmail.com', unidade: 'rio-das-ostras-centro', campaign: 'promo-2por299' },
            { ms: now - 42 * 60 * 1000, nome: 'Carlos Eduardo Mendonça', telefone: '(22) 99741-8821', email: 'cadu.mendonca@hotmail.com', unidade: 'macae', campaign: 'promo-1hora' },
            { ms: now - 2 * hr, nome: 'Fernanda Oliveira Santos', telefone: '(31) 99128-4410', email: 'fernanda.santos@yahoo.com.br', unidade: 'belo-horizonte', campaign: 'promo-2por299' },
            { ms: now - 3.5 * hr, nome: 'Rafael Almeida Prado', telefone: '(22) 99902-1145', email: 'rafael.prado@outlook.com', unidade: 'cabo-frio', campaign: 'promo70' },
            { ms: now - 5 * hr, nome: 'Juliana Ferreira Lima', telefone: '(27) 99281-6630', email: 'juliana.flima@gmail.com', unidade: 'laranjeiras', campaign: 'promo-antirreflexo' },
            { ms: now - 1 * day - 2 * hr, nome: 'Roberto Alves Nascimento', telefone: '(32) 98845-7712', email: 'roberto.nasc@gmail.com', unidade: 'juiz-de-fora', campaign: 'promo-armacoes49' },
            { ms: now - 1 * day - 5 * hr, nome: 'Patrícia Vieira Souza', telefone: '(22) 99877-3019', email: 'patricia.vsouza@gmail.com', unidade: 'rio-das-ostras-shopping', campaign: 'promo-2por299' },
            { ms: now - 1 * day - 8 * hr, nome: 'Lucas Martins Rocha', telefone: '(27) 99612-4900', email: 'lucas.rocha@gmail.com', unidade: 'cariacica', campaign: 'promo-oculos-antigo' },
            { ms: now - 2 * day - 1 * hr, nome: 'Camila Barbosa Azevedo', telefone: '(22) 99711-5528', email: 'camila.azevedo@gmail.com', unidade: 'macae', campaign: 'promo-1hora' },
            { ms: now - 2 * day - 4 * hr, nome: 'Bruno Henrique Teixeira', telefone: '(31) 98410-9923', email: 'bruno.teixeira@empresa.com.br', unidade: 'belo-horizonte', campaign: 'promo70' },
            { ms: now - 3 * day - 2 * hr, nome: 'Aline Cardoso Freitas', telefone: '(22) 99834-1209', email: 'aline.freitas@gmail.com', unidade: 'rio-das-ostras-centro', campaign: 'promo-2por299' },
            { ms: now - 3 * day - 6 * hr, nome: 'Thiago Moreira Dias', telefone: '(22) 99945-8172', email: 'thiago.mdias@hotmail.com', unidade: 'cabo-frio', campaign: 'promo-armacoes49' },
            { ms: now - 4 * day - 3 * hr, nome: 'Vanessa Gomes Castro', telefone: '(27) 99755-6041', email: 'vanessa.castro@gmail.com', unidade: 'laranjeiras', campaign: 'promo-antirreflexo' },
            { ms: now - 4 * day - 7 * hr, nome: 'Diego Santana Borges', telefone: '(32) 99104-3389', email: 'diego.borges@gmail.com', unidade: 'juiz-de-fora', campaign: 'promo-1hora' },
            { ms: now - 5 * day - 2 * hr, nome: 'Larissa Monteiro Pires', telefone: '(22) 99822-7410', email: 'larissa.pires@gmail.com', unidade: 'rio-das-ostras-shopping', campaign: 'promo-2por299' },
            { ms: now - 6 * day - 4 * hr, nome: 'Gustavo Nogueira Ramos', telefone: '(22) 99790-4152', email: 'gustavo.ramos@outlook.com', unidade: 'macae', campaign: 'promo-oculos-antigo' },
            { ms: now - 7 * day - 1 * hr, nome: 'Beatriz Duarte Lemos', telefone: '(31) 99231-6704', email: 'beatriz.lemos@gmail.com', unidade: 'belo-horizonte', campaign: 'promo70' },
            { ms: now - 8 * day - 5 * hr, nome: 'Marcelo Tavares Cunha', telefone: '(27) 99819-2034', email: 'marcelo.cunha@gmail.com', unidade: 'cariacica', campaign: 'promo-2por299' }
        ].map(item => ({
            dataCadastro: makeTimestamp(item.ms),
            nome: item.nome,
            telefone: item.telefone,
            email: item.email,
            unidade: item.unidade,
            origem: { campaign: item.campaign }
        }));

        let customLeads = [];
        try {
            const raw = JSON.parse(localStorage.getItem('lumina_portfolio_leads') || '[]');
            customLeads = raw.map(item => ({
                dataCadastro: makeTimestamp(item.dataCadastroMillis || Date.now()),
                nome: item.nome,
                telefone: item.telefone,
                email: item.email,
                unidade: item.unidade,
                origem: item.origem || { campaign: 'promo-2por299' }
            }));
        } catch (err) {
            console.warn(err);
        }

        allLeads = [...customLeads, ...seedLeads];
        updateDisplay();
        updateKpis(allLeads);
    }

    [startDateInput, endDateInput, unitFilterInput].forEach(el => el.addEventListener('change', updateDisplay));
    searchInput.addEventListener('input', updateDisplay);

    clearFiltersButton.addEventListener('click', () => {
        filtersForm.reset();
        searchInput.value = '';
        sortState = { column: 'dataCadastro', direction: 'desc' };
        updateSortHeaders();
        updateDisplay();
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage();
            updatePagination();
        }
    });
    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(displayedLeads.length / LEADS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTablePage();
            updatePagination();
        }
    });

    function updateSortHeaders() {
        sortableHeaders.forEach(header => {
            const column = header.dataset.sort;
            const arrow = header.querySelector('.sort-arrow');
            if (column === sortState.column) {
                header.classList.add(sortState.direction);
                arrow.innerHTML = sortState.direction === 'asc' ? '&#9650;' : '&#9660;';
            } else {
                header.classList.remove('asc', 'desc');
                arrow.innerHTML = '&#8693;';
            }
        });
    }

    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (sortState.column === column) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = column;
                sortState.direction = 'desc';
            }
            updateSortHeaders();
            updateDisplay();
        });
    });

    exportCsvButton.addEventListener('click', exportToCsv);

    updateSortHeaders();
    loadDemoLeads();
});