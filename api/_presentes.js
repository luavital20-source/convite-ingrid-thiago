/**
 * Tabela OFICIAL de presentes (fonte de verdade dos preços).
 *
 * O valor cobrado no cartão vem SEMPRE daqui — nunca do navegador.
 * Isso impede que alguém altere o preço pelo DevTools e pague R$ 1
 * por uma cota de R$ 2.300.
 *
 * Ao alterar um preço, altere também na lista PRESENTES do index.html
 * (aquela é só para exibição).
 */

const PRESENTES = [
  { id: 1,  nome: 'Kit Maracujina',              valor: 270,  foto: 'presentes/01.jpg' },
  { id: 2,  nome: 'Vale Netflix / Streaming',    valor: 250,  foto: 'presentes/02.jpg' },
  { id: 3,  nome: 'Jantar dos noivos',           valor: 350,  foto: 'presentes/03.jpg' },
  { id: 4,  nome: 'Procedimentos estéticos',     valor: 720,  foto: 'presentes/04.jpg' },
  { id: 5,  nome: 'Cervejinha dos noivos',       valor: 400,  foto: 'presentes/05.jpg' },
  { id: 6,  nome: 'Cueca chic',                  valor: 185,  foto: 'presentes/06.jpg' },
  { id: 7,  nome: 'Lingerie chic',               valor: 200,  foto: 'presentes/07.jpg' },
  { id: 8,  nome: 'Kit churrasco de patrão',     valor: 550,  foto: 'presentes/08.jpg' },
  { id: 9,  nome: 'Mão de vaca',                 valor: 120,  foto: 'presentes/09.jpg' },
  { id: 10, nome: 'Nome na barra do vestido',    valor: 450,  foto: 'presentes/10.jpg' },
  { id: 11, nome: 'SPA dos noivos',              valor: 900,  foto: 'presentes/11.jpg' },
  { id: 12, nome: 'Cota para os futuros filhos', valor: 2300, foto: 'presentes/12.jpg' },
  { id: 13, nome: 'Pet do casal',                valor: 980,  foto: 'presentes/13.jpg' },
  { id: 14, nome: 'Despedida da noiva',          valor: 800,  foto: 'presentes/14.jpg' },
  { id: 15, nome: 'Despedida do noivo',          valor: 1000, foto: 'presentes/15.jpg' },
  { id: 16, nome: '1 ano de barba feita',        valor: 690,  foto: 'presentes/16.jpg' },
  { id: 17, nome: 'Cobertor da noiva',           valor: 170,  foto: 'presentes/17.jpg' },
  { id: 18, nome: 'Ajuda na lua de mel',         valor: 1900, foto: 'presentes/18.jpg' },
  { id: 19, nome: '1 mês de faxina',             valor: 1500, foto: 'presentes/19.jpg' },
  { id: 20, nome: 'Prioridade na fila do buffet', valor: 380, foto: 'presentes/20.jpg' },
];

function buscarPresente(id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  return PRESENTES.find((p) => p.id === n) || null;
}

module.exports = { PRESENTES, buscarPresente };
