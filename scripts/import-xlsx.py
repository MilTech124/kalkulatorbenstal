"""Jednorazowy import tabeli bazowej z Excela do src/lib/pricing/data/base-table.ts.

Uzycie:  py scripts/import-xlsx.py "sciezka/do/pliku.xlsx"
Czyta arkusz 1 (Cennik BEN-STAL) bez openpyxl - bezposrednio z XML.
Kolumny: A szer, B dl, C spad do tylu, H dwuspad, M kolor, N kolor/10cm,
         O drewno, P drewno/10cm, Q 10cm doplata, R poziomy panel.
"""
import sys, zipfile, json
import xml.etree.ElementTree as ET

M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
COLS = {'A': 'width', 'B': 'length', 'C': 'rear', 'H': 'gable', 'M': 'color',
        'N': 'colorPer10', 'O': 'wood', 'P': 'woodPer10', 'Q': 'heightPer10', 'R': 'horizontalPanel'}

def main(path):
    z = zipfile.ZipFile(path)
    ss = [''.join(t.text or '' for t in si.iter(M + 't'))
          for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(M + 'si')]
    root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for row in root.iter(M + 'row'):
        if row.attrib.get('r') == '1':
            continue
        rec = {}
        for c in row.findall(M + 'c'):
            col = ''.join(ch for ch in c.attrib['r'] if ch.isalpha())
            v = c.find(M + 'v')
            if col not in COLS or v is None:
                continue
            val = ss[int(v.text)] if c.attrib.get('t') == 's' else v.text
            rec[COLS[col]] = float(val)
        if len(rec) == len(COLS):
            rows.append(rec)
    keys = list(COLS.values())
    lines = ['// Wygenerowane przez scripts/import-xlsx.py z cennika BEN-STAL (Excel).',
             '// Kolumny okucia/filc/rynny/blachodachowka pominiete - liczone z mb/m2 w silniku.',
             "import type { BaseTableRow } from '../types';", '',
             'export const BASE_TABLE: BaseTableRow[] = [']
    for r in rows:
        lines.append('  { ' + ', '.join(f'{k}: {int(r[k]) if r[k].is_integer() else r[k]}' for k in keys) + ' },')
    lines += ['];', '']
    out = 'src/lib/pricing/data/base-table.ts'
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'Zapisano {len(rows)} wierszy do {out}')

if __name__ == '__main__':
    main(sys.argv[1])
