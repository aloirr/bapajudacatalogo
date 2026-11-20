from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pandas as pd, re
e=pd.read_excel('entradas/ESTOQUE_BAP.xlsx'); norm=lambda s: re.sub(r'[^A-Z0-9]','',str(s).upper())
e['code']=e.COD_PRODUTO.map(norm); ST=e.groupby('code').ESTOQUE.sum()
est=lambda c:int(ST.get(norm(c),0))
E=[
 ('1. PNEU MOTO SEM CÂMARA', [
  ('PRINCIPAL','Dianteiro','80/100-18 47P V425F','Pneu BAP 80/100-18 47P sem câmara (tubeless) - dianteiro','Honda CG 150/160 Titan e CG 160 Fan; Yamaha Factor 125/150 e YBR 125 (roda de liga leve)','Câmara CAR18 se montado em roda raiada',''),
  ('MENOR 1','Dianteiro','110/70-17 54S V456F','Pneu BAP 110/70-17 54S sem câmara (tubeless) - dianteiro','Honda CB 250F/300F Twister, CB 300R e CBR 250R; Yamaha MT-03 e YZF-R3; Kawasaki Ninja 300/400','—',''),
  ('MENOR 2','Dianteiro','100/80-17 52S V456F','Pneu BAP 100/80-17 52S sem câmara (tubeless) - dianteiro','Honda CBX 250 Twister; Yamaha Fazer 250; Dafra Next 250','—',''),
  ('MENOR 3','Traseiro','90/90-18 51P V425R','Pneu BAP 90/90-18 51P sem câmara (tubeless) - traseiro','Honda CG 150/160 Titan e CG 160 Fan; Yamaha Factor 125/150 e YBR 125 (roda de liga leve)','Câmara CAR18 se montado em roda raiada','Par traseiro do principal'),
  ('MENOR 4','Traseiro','140/70-17 66S V456R','Pneu BAP 140/70-17 66S sem câmara (tubeless) - traseiro','Honda CB 250F/300F Twister, CB 300R e CBR 250R; Yamaha Fazer FZ25 (2018>), MT-03 e YZF-R3; Kawasaki Ninja 300','—',''),
  ('MENOR 5','Traseiro','130/70-17 62S V456R','Pneu BAP 130/70-17 62S sem câmara (tubeless) - traseiro','Honda CBX 250 Twister; Yamaha Fazer 250 (até 2017)','Câmara CAJ17 se montado em roda raiada',''),
 ]),
 ('2. PNEU MOTO COM CÂMARA', [
  ('PRINCIPAL','Traseiro','90/90-18 57P V250R','Pneu BAP 90/90-18 57P com câmara - traseiro','Honda CG 125/150/160 Titan, Fan, Start e Cargo; Yamaha YBR 125 e Factor 125/150; Suzuki Yes 125; Dafra Speed 150','Câmara CAR18',''),
  ('MENOR 1','Dianteiro','2.75-18 42P V250F','Pneu BAP 2.75-18 42P com câmara - dianteiro (TT/TBL)','Honda CG 125/150/160 Titan, Fan, Start e Cargo; Yamaha YBR 125 e Factor 125; Suzuki Yes 125; Dafra Speed 150','Câmara CAR18','Par dianteiro do principal'),
  ('MENOR 2','Dianteiro','90/90-19 52P V307','Pneu BAP 90/90-19 52P com câmara - dianteiro (TT/TBL)','Honda NXR 125/150/160 Bros e XRE 190; Yamaha XTZ 150 Crosser','Câmara CAR19',''),
  ('MENOR 3','Dianteiro','60/100-17 33P V250F','Pneu BAP 60/100-17 33P com câmara - dianteiro','Honda Biz 100/110i/125 e Pop 100/110i; Yamaha Crypton 115; Shineray Jet 125; Bull Live 125','Câmara CAG17 ou CAL17',''),
  ('MENOR 4','Traseiro','80/100-14 49P V250R','Pneu BAP 80/100-14 49P com câmara - traseiro','Honda Biz 100/110i/125 e Pop 100/110i; Yamaha Crypton 115; Shineray Jet 125; Bull Live 125; MVK Fox 110','Câmara CAR14',''),
  ('MENOR 5','Traseiro','110/90-17 60P V307','Pneu BAP 110/90-17 60P com câmara - traseiro (TT/TBL)','Honda NXR 125/150/160 Bros e XRE 190; Yamaha XTZ 150 Crosser','Câmara CAJ17',''),
 ]),
 ('3. CÂMARAS DE AR BAP', [
  ('PRINCIPAL','—','CAR18','Câmara de ar BAP aro 18 (300-18)','Honda CG 125/150/160 Titan, Fan, Start e Cargo; Yamaha YBR 125 e Factor; Suzuki Yes 125; Dafra Speed 150 (dianteiro e traseiro)','Pneus BAP: 2.75-18 42P V250F · 90/90-18 57P V250R · 80/100-18 47P V425F e 90/90-18 51P V425R (em roda raiada)',''),
  ('MENOR 1','—','CAR14','Câmara de ar BAP aro 14 (300-14)','Honda Biz e Pop (traseiro); Yamaha Crypton 115; Shineray Jet 125; Bull Live 125; MVK Fox 110','Pneu BAP: 80/100-14 49P V250R',''),
  ('MENOR 2','—','CAG17','Câmara de ar BAP aro 17 (250-17)','Honda Biz e Pop (dianteiro); Yamaha Crypton 115; Shineray Jet 125; Bull Live 125','Pneu BAP: 60/100-17 33P V250F','CAL17 tem a mesma medida (250-17); escolhida a de maior estoque'),
  ('MENOR 3','—','CAJ17','Câmara de ar BAP aro 17 (460-17)','Honda NXR Bros e XRE 190 (traseiro); Yamaha XTZ 150 Crosser','Pneus BAP: 110/90-17 60P V307 · 130/70-17 62S V456R (em roda raiada)',''),
  ('MENOR 4','—','CAR19','Câmara de ar BAP aro 19 (350-19)','Honda NXR Bros e XRE 190 (dianteiro); Yamaha XTZ 150 Crosser','Pneu BAP: 90/90-19 52P V307',''),
  ('MENOR 5','—','CAR10','Câmara de ar BAP aro 10 (350-10)','Scooters e ciclomotores 50 cc com roda aro 10 (ex.: Shineray Phoenix 50)','Sem pneu BAP aro 10 no mix','Alternativa: CAL17 (aro 17, pneu BAP 60/100-17), mas repete a medida da CAG17'),
 ]),
 ('4. LUBRIFICANTES, QUÍMICOS E FILTROS MOTO', [
  ('PRINCIPAL','—','20W50 4T PROACTIVE','Óleo BAP Proactive 20W50 4T mineral API SL para motocicleta','Motores 4 tempos de motocicleta, conforme manual do fabricante','—',''),
  ('MENOR 1','—','10W30 PROACTIVE210','Óleo BAP Proactive 210 10W30 4T semissintético API SL para motocicleta','Motores 4 tempos de motocicleta, conforme manual do fabricante','—',''),
  ('MENOR 2','—','FLU15002','Fluido de freio BAP DOT 4 - 500 ml','Motos com freio a disco hidráulico que especificam DOT 4','—','Corrigir na base: a aplicação cadastrada fala em "sistemas de arrefecimento"'),
  ('MENOR 3','—','AER12000','Desengripante BAP 300 ml','Corrente, cabos, articulações e parafusos','—','Produto universal'),
  ('MENOR 4','—','AER12001','Descarbonizante BAP 300 ml','Limpeza de carburador e corpo de borboleta','—','Produto universal'),
  ('MENOR 5','—','FAR6365','Filtro de ar BAP para motocicleta','Honda CG 125 Cargo e CG 125i Cargo','—','SEM ESTOQUE em 13/10 - confirmar compra; se não houver, usar AER12002 Silicone 300 ml'),
 ]),
]
wb=Workbook(); ws=wb.active; ws.title='Encartelados Moto'
H=['ENCARTELADO','POSIÇÃO','PARTE','CÓDIGO BAP','DESCRIÇÃO PARA A ARTE','APLICAÇÃO PRINCIPAL','COMPATÍVEL / OFEREÇA JUNTO','ESTOQUE 13/10','OBSERVAÇÃO']
ws.append(['ENCARTELADOS LINHA MOTOCICLETA BAP — LISTA DE PRODUTOS PARA O MARKETING']); ws['A1'].font=Font(name='Arial',bold=True,size=13)
ws.append(['Estrutura: 1 produto principal (tamanho maior) + 5 produtos menores. Pneus organizados em dianteiro e traseiro. Estoque: posição de 13/10/2026.']); ws['A2'].font=Font(name='Arial',size=10,italic=True)
ws.append([])
thin=Side(style='thin',color='D9D9D9')
for nome,itens in E:
    ws.append([nome]); r=ws.max_row
    ws.cell(r,1).font=Font(name='Arial',bold=True,color='FFFFFF',size=11)
    for c in range(1,len(H)+1): ws.cell(r,c).fill=PatternFill('solid',fgColor='141514')
    ws.append(H)
    for c in ws[ws.max_row]: c.font=Font(name='Arial',bold=True,size=9,color='FFFFFF'); c.fill=PatternFill('solid',fgColor='3DAE49'); c.alignment=Alignment(wrap_text=True,vertical='center')
    for pos,parte,cod,desc,app,comp,obs in itens:
        ws.append([nome.split('. ',1)[1],pos,parte,cod,desc,app,comp,est(cod),obs])
        row=ws[ws.max_row]
        for c in row:
            c.font=Font(name='Arial',size=10,bold=(pos=='PRINCIPAL' and c.column in (2,4))); c.alignment=Alignment(wrap_text=True,vertical='top'); c.border=Border(bottom=thin)
            if pos=='PRINCIPAL': c.fill=PatternFill('solid',fgColor='E2EFDA')
        row[7].number_format='#,##0'
        if est(cod)==0: row[7].font=Font(name='Arial',size=10,bold=True,color='C00000')
    ws.append([])
for i,w in enumerate([26,11,10,20,42,52,40,11,44]): ws.column_dimensions[get_column_letter(i+1)].width=w
ws.freeze_panes='A4'
wb.save('saidas/Encartelados_Moto_BAP.xlsx'); print('ok')
