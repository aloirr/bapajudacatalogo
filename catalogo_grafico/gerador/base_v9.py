import openpyxl, re, collections
from openpyxl.styles import Font, PatternFill, Alignment
from copy import copy as cp
import taxo
SRC='entradas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx'
OUT='saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v9.xlsx'
wb=openpyxl.load_workbook(SRC)
ws=wb['PRODUTOS']; H={c.value:i+1 for i,c in enumerate(ws[1])}
log=[]; cnt=collections.Counter()
FIXFLU={'FLU15001':'Fluido de freio DOT 3 500 ml — sistemas de freio e embreagem hidráulicos que especificam DOT 3, conforme manual do fabricante.',
        'FLU15002':'Fluido de freio DOT 4 500 ml — sistemas de freio e embreagem hidráulicos que especificam DOT 4, conforme manual do fabricante.'}
LINFIX={'ROL30204':'UNIVERSAL','ROL30303':'UNIVERSAL','FSE6117':'PESADA'}
for r in range(2, ws.max_row+1):
    code=str(ws.cell(r,H['CODIGO_BAP']).value or '').strip()
    sis=ws.cell(r,H['SISTEMA']).value; fam=ws.cell(r,H['FAMILIA']).value; lin=ws.cell(r,H['LINHA']).value
    prod=ws.cell(r,H['PRODUTO']).value; app=str(ws.cell(r,H['APLICACAO']).value or '')
    if sis=='ARREFECIMENTO' and fam!='ARREFECIMENTO DO MOTOR':
        ws.cell(r,H['FAMILIA']).value='ARREFECIMENTO DO MOTOR'; cnt['familia']+=1
        log.append(('CLASSIFICACAO_ALTERADA','PRODUTOS',code,'Decisão do Alexandre 19/10 (recado bap-tools)',f'FAMILIA {fam} -> ARREFECIMENTO DO MOTOR'))
    if code in FIXFLU:
        ws.cell(r,H['APLICACAO']).value=FIXFLU[code]; cnt['flu']+=1
        log.append(('APLICACAO_SUBSTITUIDA','PRODUTOS',code,'Catálogo 2026','Texto de aditivo de radiador trocado pela aplicação de fluido de freio'))
    if lin=='MOTO' and prod=='Rolamentos' or code in LINFIX:
        new=LINFIX.get(code) or ('PESADA' if taxo.HEAVY.search(app.upper()) and not (taxo.LIGHT_BR.search(app.upper()) or taxo.LIGHT_MODELS.search(app.upper())) else 'LEVE E PESADA' if taxo.HEAVY.search(app.upper()) else 'UNIVERSAL')
        if new!=lin:
            ws.cell(r,H['LINHA']).value=new; cnt['linha']+=1
            log.append(('CLASSIFICACAO_ALTERADA','PRODUTOS',code,'Revisão da regra de LINHA',f'LINHA {lin} -> {new} ("Titan 17.310" é caminhão VW, não moto)'))
# TAXONOMIA
wt=wb['TAXONOMIA']
for r in range(2, wt.max_row+1):
    if wt.cell(r,1).value in ('Eletroventiladores',"Bomba D'Água"): wt.cell(r,4).value='ARREFECIMENTO DO MOTOR'
# RESUMO recalculado
wr=wb['RESUMO']
rows=[[ws.cell(r,H[k]).value for k in ('CATEGORIA','SISTEMA','FAMILIA','LINHA','STATUS_CADASTRO')] for r in range(2, ws.max_row+1)]
agg=collections.defaultdict(collections.Counter)
for cat,sis,fam,lin,st in rows:
    if st=='ATIVO': agg[(cat,sis,fam)][lin]+=1
wr.delete_rows(4, wr.max_row)
K=['LEVE','PESADA','LEVE E PESADA','MOTO','UNIVERSAL']; tot=collections.Counter()
for key in sorted(agg):
    v=agg[key]; wr.append(list(key)+[v.get(k,0) for k in K]+[sum(v.values())]); tot.update(v)
wr.append(['TOTAL','','']+[tot.get(k,0) for k in K]+[sum(tot.values())])
for c in wr[wr.max_row]: c.font=Font(name='Arial',bold=True,size=10)
wr['A1'].value='RESUMO DOS SKUs ATIVOS (estoque de 13/10/2026) — v9'
# LOG
wl=wb['LOG_CORRECOES']
for rec in log:
    i=wl.max_row+1
    for c,v in enumerate(rec, start=1):
        cell=wl.cell(i,c); s=wl.cell(2,c); cell.value=v; cell.font=cp(s.font); cell.alignment=cp(s.alignment)
# LEIA-ME
lm=wb['LEIA-ME']; lm.insert_rows(1,6)
bold=Font(name='Arial',bold=True,size=11); reg=Font(name='Arial',size=10)
L=[('BASE BAP UNIFICADA v9 (19/10/2026)',None),
   ('Família nova',"ARREFECIMENTO DO MOTOR junta COMPONENTES MECÂNICOS (bombas d'água) e COMPONENTES ELÉTRICOS E TÉRMICOS (eletroventiladores): 141 produtos (decisão do Alexandre, 19/10)."),
   ('Aplicação corrigida','FLU15001 e FLU15002 (fluido de freio DOT 3/DOT 4) estavam com o texto de aditivo de radiador.'),
   ('LINHA corrigida','Rolamentos de caminhão marcados como MOTO ("Titan 17.310" é caminhão VW) passaram para PESADA ou LEVE E PESADA; rolamentos universais para UNIVERSAL; FSE6117 (Agrale) para PESADA.'),
   ('Sem mudança','Colunas, abas e as 5 primeiras colunas (compatíveis com o BAP Ajuda) continuam iguais à v8.'),(None,None)]
for i,(k,v) in enumerate(L, start=1):
    if k: lm.cell(i,1,k).font=bold if v is None else Font(name='Arial',bold=True,size=10)
    if v: lm.cell(i,2,v).font=reg; lm.cell(i,2).alignment=Alignment(wrap_text=True,vertical='top')
wb.save(OUT); print(dict(cnt), '| log', len(log))
