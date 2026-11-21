"""Teste curto do _norm e da aplicacao_unica (fraga_complementos.py, T-0019): o "DE" antes do ano não conta na
comparação ("Gol DE 1999" = "Gol 1999"); o "DE" em outra posição conta. Só a biblioteca padrão.
Rodar dentro de catalogo_grafico/gerador/:  PYTHONHASHSEED=0 python3 -m unittest -v teste_fraga_complementos
"""
import unittest

import fraga_complementos as F


class NormDE(unittest.TestCase):
    def test_de_antes_do_ano_e_ignorado(self):
        base = F._norm('Gol 1999')
        for s in ('Gol DE 1999', 'Gol de 1999', 'Gol DE1999', 'Gol - DE 1999'):
            self.assertEqual(F._norm(s), base, s)
        self.assertEqual(F._norm('Gol DE 1999–2002'), F._norm('Gol 1999-2002'))
        self.assertEqual(F._norm('Gol DE 1999 em Diante'), F._norm('Gol 1999 em Diante'))

    def test_de_fora_da_posicao_antes_do_ano_fica(self):
        self.assertIn(' DE ', F._norm('Gol DE LUXE 1999'))
        self.assertNotEqual(F._norm('Gol DE LUXE 1999'), F._norm('Gol LUXE 1999'))
        self.assertNotEqual(F._norm('Gol 1999 DE'), F._norm('Gol 1999'))
        self.assertNotEqual(F._norm('Gol DE 99'), F._norm('Gol 99'))          # 99 não é ano (datas.Y)
        self.assertEqual(F._norm('MERCEDES1999'), ' MERCEDES1999 ')            # "DE" no meio da palavra fica


class AplicacaoUnicaDE(unittest.TestCase):
    def test_mesmo_veiculo_com_e_sem_de_sai_uma_vez(self):
        for gol in ('Gol DE 1999', 'Gol DE1999'):
            segs = [['VW', True], [' ' + gol + ' · Gol 1999 · Parati 2000 ', False]]
            self.assertEqual(F.aplicacao_unica(segs), [['VW', True], [' ' + gol + ' · Parati 2000 ', False]], gol)

    def test_de_fora_da_posicao_nao_junta(self):
        segs = [['VW', True], [' Gol DE LUXE 1999 · Gol LUXE 1999 ', False]]
        self.assertEqual(F.aplicacao_unica(segs), segs)


if __name__ == '__main__':
    unittest.main()
