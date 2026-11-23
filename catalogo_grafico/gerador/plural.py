"""Singular e plural do texto dos PDFs, num lugar só (RD-0510, RD-0526 e RD-0527): os geradores importam daqui."""


def plural(n, um='item', varios='itens'):
    return um if n == 1 else varios
