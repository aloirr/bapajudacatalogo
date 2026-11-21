"""Teste do bloco B dos PDFs (T-0019; aprovado no R-20261121-200058-alexandre): B9 (subtítulo sem repetir a aplicação,
detalhe._tail), B10 (tag NOVO que desce, digital2.novo_desce) e o "Leve também" pelo sistema (oferta.sis_ok, com a
tabela e a regra do site: G.SIS_COMPAT e G.sistemas_de do scripts/gerar_site.py). Como rodar: LEIA_GERADOR.md (tabela
de comandos). Lê a base (montar) e monta as famílias (moto)."""
import unittest
from unittest import mock

import detalhe as DT
import digital2 as D2
import moto
import oferta as O
import print_cat as PC
import tags as TG
from site_regras import G

SERVO = 'SERVO EMBREAGEM MBB LS 1630 1929 1932 1934 LS1941 VWC 16210 17240 1730 - 111693'   # DESCRICAO do SCE14002 (v25)
SERVO_APL = 'Servo Embreagem Mbb LS 1630 1929 · 1932 · 1934 LS1941 Vwc 16210 17240 1730 · 111693'


def linha(code):
    return next((f, r) for f in moto.FAMS for r in f['rows'] if r['code'] == code)


class B9Subtitulo(unittest.TestCase):
    def compacto(self, desc, sub, apl):
        with mock.patch.dict(DT._desc(), {'TST0001': desc}):
            return DT.compacto('Teste', 'TST0001', sub, apl)

    def test_trecho_da_aplicacao_sai(self):
        # SCE14002 (RD-0252): 5 ou mais palavras seguidas da DESCRICAO que estão todas na aplicação não completam o
        # subtítulo; o "-" no meio do trecho sai junto
        sub = 'Servo embreagem cilindro curto sem indicador…'
        self.assertEqual(self.compacto(SERVO, sub, SERVO_APL), 'Servo embreagem cilindro curto s/ indicador')
        self.assertIn('MBB LS 1630', self.compacto(SERVO, sub, ''))          # sem a aplicação, como antes

    def test_trecho_curto_fica(self):
        out = self.compacto('KIT EMBREAGEM 750MM VW GOL', 'Kit embreagem…', 'VW Gol 1999')
        self.assertIn('750MM', out)
        self.assertIn('VW', out)


class B10TagNovo(unittest.TestCase):
    def test_codigo_longo_desce_a_tag_no_a4(self):
        f, _ = linha('EMB3400700639R')
        cols, widths = PC.table_cols(f)
        for r in f['rows']:
            if r.get('nov'): PC.row_cells(f, r, cols, widths)
        desceu = sorted(r['code'] for r in f['rows'] if r.get('_novo_baixo'))
        self.assertEqual(desceu, ['EMB3400700639R', 'EMB3400700648R', 'EMB3400700649R'])
        r = next(r for r in f['rows'] if r['code'] == 'EMB3400700639R')
        self.assertGreater(r['_ind'], 0)                     # sem tags: NOVO na 1ª linha da descrição curta, com recuo
        self.assertEqual(r['_tl'], [])

    def test_codigo_curto_nao_desce(self):
        r = dict(code='AMT7503', nov=True)
        self.assertFalse(D2.novo_desce(r, 10, 104, 6.4, 3.5, 5))
        self.assertFalse(D2.novo_desce(dict(code='EMB3400700639R', nov=False), 10, 104, 6.4, 3.5, 5))

    def test_lugar_e_cor_da_tag_que_desceu(self):
        self.assertEqual(D2.novo_na_sobra(['DIANT.'], 'texto'), (['NOVO', 'DIANT.'], 0))   # na frente das tags
        self.assertEqual(D2.novo_na_sobra([], ''), (['NOVO'], 0))                          # sozinha
        cores = {}

        class Dc:
            def tag(self, x, y, t, size, fundo, cor, pad): cores[t] = (fundo, cor)
        TG.desenhar(Dc(), D2.lw, 0, 0, ['NOVO', 'DIANT.'], 200)
        self.assertEqual(cores, {'NOVO': ('otag', 'otext'), 'DIANT.': ('hero', 'gtext')})


class LeveTambemSistema(unittest.TestCase):
    def test_cub60235_sem_rolamento_de_cambio(self):
        _, r = linha('CUB60235')
        ofertas = r['extra'].split(' · ')
        self.assertNotIn('ROL32008', ofertas)
        self.assertNotIn('ROL32009', ofertas)
        self.assertTrue(all(O.sis_ok('CUB60235', c) for c in ofertas), ofertas)

    def test_rolamento_de_cambio_sem_par_fica_traco(self):
        self.assertEqual(O.sistemas('ROL32009'), {'CÂMBIO E DIFERENCIAL'})    # na base, RODAGEM; o texto diz câmbio
        self.assertEqual(linha('ROL32009')[1]['extra'], '—')

    def test_tabela_nao_simetrica(self):
        self.assertFalse(O.sis_ok('CUB60235', 'ROL32009'))     # cubo não oferece rolamento de câmbio
        self.assertTrue(O.sis_ok('ROL32009', 'ROL32008'))
        self.assertIn('RODAGEM', G.SIS_COMPAT['TRANSMISSÃO'])  # semi-eixo oferece o cubo
        self.assertNotIn('TRANSMISSÃO', G.SIS_COMPAT['RODAGEM'])

    def test_fonte_unica_com_o_site(self):
        self.assertIs(O._G, G)                                 # a do scripts/gerar_site.py, pelo site_regras
        self.assertFalse(hasattr(O, 'SIS_COMPAT'))             # sem cópia da tabela no gerador


if __name__ == '__main__':
    unittest.main()
