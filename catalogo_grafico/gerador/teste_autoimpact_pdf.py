"""Teste da AUTOIMPACT nos PDFs (T-0017; R-20261121-113400-alexandre e "1 a"): a trava_pdf (digital2.py) barra a
concorrência fora da referência cruzada e deixa dentro dela (Doc.ref); a referência da concorrência vai por último
(montar.concorrente_por_ultimo). Como rodar: LEIA_GERADOR.md (tabela de comandos). Lê a base (montar) e o
entradas/complementos_fraga_13112026.json."""
import os, tempfile, unittest

import digital2 as D2
import fraga_complementos as F
import montar as M
import print_cat as PC

REFS = 'Bosch 3397006888 · Tecfil TPB14 · Autoimpact PA14'


def pdf(pasta, desenho, Doc=D2.Doc):
    """PDF de uma página com o desenho(dc); devolve o caminho e as caixas das referências"""
    out = os.path.join(pasta, 't.pdf')
    dc = Doc(out); desenho(dc); dc.end(); dc.c.save()
    return out, dc.areas_ref


class TravaPdf(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)

    def bloqueia(self, desenho):
        out, areas = pdf(self.tmp.name, desenho)
        with self.assertRaises(SystemExit):
            D2.trava_pdf(out, areas)
        self.assertTrue(os.path.exists(out + '.BLOQUEADO'))

    def test_concorrencia_fora_da_referencia_para(self):
        for s in ('Autoimpact PA14', 'AUTO IMPACT', 'Auto-Impact', 'Palheta igual à da autoimpact'):
            with self.subTest(s=s):
                self.bloqueia(lambda dc: (dc.ref(40, 300, 104, REFS, 8, 10.6), dc.label(40, 100, s, 10, 'ink')))

    def test_concorrencia_na_referencia_passa(self):
        for Doc in (D2.Doc, PC.PDoc):                  # digital e A4 (com a sangria, a caixa muda de lugar)
            with self.subTest(Doc=Doc.__name__):
                out, areas = pdf(self.tmp.name, lambda dc: (dc.label(40, 100, 'CL14', 10, 'ink'),
                                                             dc.ref(40, 300, 104, REFS, 8, 10.6)), Doc)
                self.assertEqual(len(areas), 1)
                D2.trava_pdf(out, areas)               # não para
                self.assertTrue(os.path.exists(out))

    def test_sem_caixa_a_referencia_tambem_para(self):
        # a exceção é só a caixa guardada pelo Doc.ref: a mesma referência desenhada pelo text para
        self.bloqueia(lambda dc: dc.text(40, 300, 104, REFS, 8, 10.6))

    def test_fornecedor_para_ate_na_referencia(self):
        self.bloqueia(lambda dc: dc.ref(40, 300, 104, 'Bosch 3397006888 · Sunrise X1', 8, 10.6))


class Ordem(unittest.TestCase):
    def test_concorrencia_por_ultimo(self):
        esperado = 'Bosch 3397006888 · Tecfil TPB14 · Autoimpact PA14'
        self.assertEqual(M.refs_pela_regra('Autoimpact PA14 · Bosch 3397006888 · Tecfil TPB14'), esperado)
        self.assertEqual(M.refs_unicas('Autoimpact PA14 · Bosch 3397006888 · Tecfil TPB14 · Bosch 3397006888'), esperado)
        self.assertEqual(M.refs_from_base('AUTOIMPACT PN: PA14; BOSCH: 3397006888; TECFIL PN: TPB14'), esperado)
        self.assertEqual(M.concorrente_por_ultimo(['Auto Impact TR 10', 'Nakata N1', 'Autoimpact PA14', 'Axios 2']),
                         ['Nakata N1', 'Axios 2', 'Auto Impact TR 10', 'Autoimpact PA14'])     # estável

    def test_palheta_do_catalogo_antigo_com_o_fraga(self):
        # CL14: "Autoimpact PA14" do catálogo antigo, mais AUTOIMPACT PU14, BOSCH e TECFIL do Fraga de 13/11
        r = dict(code='CL14', refs=M.refs_pela_regra('Autoimpact PA14'), segs=[])
        F.aplicar([dict(name='Palhetas Limpa-Parabrisa', rows=[r])])
        self.assertEqual(r['refs'].split(' · '),
                         ['Bosch 3397006888', 'Tecfil TPB14', 'Autoimpact PA14', 'Autoimpact PU14'])


if __name__ == '__main__':
    unittest.main()
