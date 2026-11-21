"""Regras do site usadas pelos PDFs (RD-0193, RD-0220): carrega o ../../scripts/gerar_site.py (dono: web-site) uma vez só,
sem cópia. G.refs_de e G.so_codigo (referências, no montar.py) e G.FORNECEDOR_RE (trava dos PDFs, no digital2.py)."""
import importlib.util as _ilu, os as _os

_GS = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'scripts', 'gerar_site.py')
_spec = _ilu.spec_from_file_location('gerar_site', _GS)
G = _ilu.module_from_spec(_spec); _spec.loader.exec_module(G)
