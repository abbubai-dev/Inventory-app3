import sql from './db.js';

// 1. Paste your converted Google Sheets stock snapshot array right here
const sheetSnapshot = [
  {
    "Item_Code": "111-002-004-0017",
    "Item_Name": "MASK 3M 8210 N95",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "21",
    "KPP": "30",
    "KPPR": "15",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0015",
    "Item_Name": "SURG FACE MASK TIE ON",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "9",
    "KPP": "20",
    "KPPR": "9",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0014",
    "Item_Name": "DISPOSABLE FACE MASK EAR LOOPS",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "2",
    "KPP": "20",
    "KPPR": "9",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0432",
    "Item_Name": "DISPOSABLE HEAD COVER (HOOD/TUDUNG) 1pax=100pcs",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "9",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0197",
    "Item_Name": "DISPOSABLE GOWN SLEEVE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "9",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0434",
    "Item_Name": "DISPOSABLE BOOT COVER 1box=150pair",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "9",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0394",
    "Item_Name": "DISPOSABLE CLIP CAP 1pax=50pcs",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "2",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0019",
    "Item_Name": "DISPOSABLE PLASTIC APRON (SLEVELESS) 1pax=100pcs",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0085",
    "Item_Name": "ISOLATION SURGICAL GOWN (PAX)",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "111-001-004-0004",
    "Item_Name": "CPE PROTECTIVE GOWN (THUMB HOOK GOWN) 1pax=100",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0087",
    "Item_Name": "GLOVE DENTAL - EXTRA SMALL ( 1Big Box=10 Small box)",
    "MinStock": "10",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0088",
    "Item_Name": "GLOVE DENTAL - SMALL (1Big Box=10 Small box)",
    "MinStock": "10",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0146",
    "Item_Name": "GLOVE DENTAL - MEDIUM (1Big Box=10 Small box)",
    "MinStock": "10",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0089",
    "Item_Name": "GLOVE DENTAL - LARGE  (1Big Box=10 Small box)",
    "MinStock": "10",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "35",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-006-0008",
    "Item_Name": "GLOVE SURG. LAT.SZ 6 BOX",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-006-0006",
    "Item_Name": "GLOVE SURG.LAT. SZ 6.5 BOX",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-006-0007",
    "Item_Name": "GLOVE SURG.LAT.SZ 7 BOX",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-006-0037",
    "Item_Name": "GLOVE SURG.LAT. SZ 7.5 BOX",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-008-001-0014",
    "Item_Name": "DISINFECTANT HAND RUB/GEL",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-018-001-0115",
    "Item_Name": "ALCOHOL PREP PAD",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0103",
    "Item_Name": "DISINFECTANT FOR SUCTON LINES ASPIRMATIC",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0155",
    "Item_Name": "AUTOCLAVE TAPE 2CM WIDE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0066",
    "Item_Name": "BIOLOGICAL INDICATORS (AUTOCLAVE)",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0067",
    "Item_Name": "BOWEDICK TEST",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0504",
    "Item_Name": "CHLORHEXIDINE GLUCONATE 5 PERCENT",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0065",
    "Item_Name": "DISINFECTANT WIPES",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0078",
    "Item_Name": "SARAYA SHAFONET HAND SOAP 1 LITRE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0065",
    "Item_Name": "SURFACE DISINFECTANT CLEANER (SURFA 'SAFE, MIKROZID, ACTOANID)",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0017",
    "Item_Name": "MICROBRUSH DISPOSABLE APPLICATOR WITH DISPENSER",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0044",
    "Item_Name": "PAPER ARTICULATING",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-004-0005",
    "Item_Name": "KALZINOL LIQUID/POWDER",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-004-0003",
    "Item_Name": "CAVIT TEMPORARY FILLING",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-003-0018",
    "Item_Name": "SDI ICE COMPOSITE A2",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-003-0019",
    "Item_Name": "SDI ICE COMPOSITE A3",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-003-0013",
    "Item_Name": "LIGHT CURE COMPOSITE (ANTERIOR /Z 250 (OFFICER))",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-003-0016",
    "Item_Name": "LIGHT CURE COMPOSITE POLOFIL",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-003-0037",
    "Item_Name": "SELF ADHESIVE FLOWABLE COMPOSITE RESIN",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-007-0007",
    "Item_Name": "DENTIN CONDITIONER",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0005",
    "Item_Name": "CHULK DYCAL",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "21",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-007-0002",
    "Item_Name": "ETCHING GEL",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "2",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0068",
    "Item_Name": "FISSURE SEALANT RESIN (LIGHT CURE)",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-005-0006",
    "Item_Name": "GC FUJI GOLD LABEL GLASS LONOMER",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-005-0001",
    "Item_Name": "GC FUJI IX GLASS IONOMER",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-005-0005",
    "Item_Name": "GIC RIVA",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0067",
    "Item_Name": "GC FUJI VII",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0135",
    "Item_Name": "BONDING AGENT",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0066",
    "Item_Name": "COCOA BUTTER 10G",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "6",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0033",
    "Item_Name": "CALCIUM HYDROXIDE PASTE (non setting RCT temp med)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "2",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0034",
    "Item_Name": "EDTA LUBRICANT (GLYDE) (root canal conditioner)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0007",
    "Item_Name": "GUTTA PERCHA POINT SZ: 15-40",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0006",
    "Item_Name": "GUTTA PERCHA POINT SZ: 45-80",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0013",
    "Item_Name": "GUTTA PERCHA POINT SZ: F1-F3 (PROTAPER)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0008",
    "Item_Name": "GUTTA PERCHA POINT SZ 15",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0002",
    "Item_Name": "LEDERMIX (5G)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0074",
    "Item_Name": "PAPER POINT ABST SZ: 45-80",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0086",
    "Item_Name": "PAPER POINT SZ: F1-F3 (PROTAPER)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0085",
    "Item_Name": "PAPER POINT SZ: 15-40",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0003",
    "Item_Name": "TOP SEAL ROOT CANAL SEALER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0137",
    "Item_Name": "ALVOGYL PASTE",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-010-004-0001",
    "Item_Name": "DISPOSABLE LANCET",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-010-002-0007",
    "Item_Name": "BLOOD GLUCOSE TEST STRIPS",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0113",
    "Item_Name": "PARACETAMOL 500MG TAB (BOX)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0100",
    "Item_Name": "FLOURIDE VARNISH CLINPRO (1 Box= 20 Tubes)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-002-007-0221",
    "Item_Name": "VICRYL 4/0 VCP 304H COATED VICRYL PLUS ANTIBACTERIAL 17 MM 1/2 C TAPPER 70 CM",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-002-007-0471",
    "Item_Name": "SUTURE VICRYL 3/0",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-002-007-0472",
    "Item_Name": "SUTURE VICRYL 5/0",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-002-006-0057",
    "Item_Name": "SUTURE BRILON 5/0 (Ethilon)",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0144",
    "Item_Name": "INJ.LIGNOCAINE / MEPIVACAINE",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-001-004-0010",
    "Item_Name": "NEEDLE DISP. 23 G X 30 MM",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0111",
    "Item_Name": "DISPOSIBLE NEEDLES 26G X 25 MM",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-009-0099",
    "Item_Name": "NEEDLE DISP 27G X 41 MM (LONG)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0142",
    "Item_Name": "NEEDLE HYPODERMIC DIP. 27G x 22MM short (0.4x22mm)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0119",
    "Item_Name": "TOPICAL ANESTHETIC GEL (XYLOCAINE/GESICANE)",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0010",
    "Item_Name": "COTTON WOOL ROOL NO: 2",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0014",
    "Item_Name": "BIB FOR CHILDREN 3PLY",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0002",
    "Item_Name": "DENTAL FLOSS",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0004",
    "Item_Name": "DENTAL SPONGOSTAN",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0023",
    "Item_Name": "DISPOSABLE DENTAL MOUTH MIRROR",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0020",
    "Item_Name": "DISP PAPER CUP (1Pax=50pcs)",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0022",
    "Item_Name": "DISPOSABLE PROBE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0156",
    "Item_Name": "SYRINGE DISP. 20ML (Box=50 Units)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-001-007-0004",
    "Item_Name": "SYRINGE DISPOSABLE 10 ML (1 Box=100 Unit)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0112",
    "Item_Name": "SYRINGE DISP 5ML",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0013",
    "Item_Name": "DISPOSABLE APPLICATORS",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0021",
    "Item_Name": "DISPOSABLE TWEEZER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0002",
    "Item_Name": "HAND TOWEL TISSUE (Big BOX= 20 Small Box)",
    "MinStock": "5",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0036",
    "Item_Name": "SALIVA EJECTOR DISP Pax",
    "MinStock": "3",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0018",
    "Item_Name": "NACL 0.9 PERATUS 500 ML. INJ. (NORMAL SALINE)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-002-012-0012",
    "Item_Name": "SURGITIP",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0153",
    "Item_Name": "ABSORBANT GAUZE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0139",
    "Item_Name": "IMPRESSION MATERIAL - ALGINATE",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0051",
    "Item_Name": "PLASTER OF PARIS (DENTAL POP) 10 kg",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0105",
    "Item_Name": "DENTAL STONE 5KG",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0050",
    "Item_Name": "DENTURE MATERIAL SELF CURE (PINK P/L)",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-006-0002",
    "Item_Name": "ZINC OXIDE IMP PASTE",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0016",
    "Item_Name": "GREEN STICK",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0023",
    "Item_Name": "MODELLING WAX 500 G (500 GM)",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0045",
    "Item_Name": "STICKY WAX",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0024",
    "Item_Name": "WAX BITE BLOCK",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-009-001-0023",
    "Item_Name": "BUNSEN BURNER",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0104",
    "Item_Name": "X-RAY PERIAPICAL (X-RAY FILM)",
    "MinStock": "2",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "108-001-013-0074",
    "Item_Name": "COLD SPRAY MEDIC-ETHYL CHLORIDE 100ML",
    "MinStock": "1",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "108-001-009-0086",
    "Item_Name": "CHOLINE SALICYLATE CETYLKONIUM CHLORIDA",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "108-001-008-0040",
    "Item_Name": "IBUPROFEN 200 MG TABLET",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0324",
    "Item_Name": "DISPOSABLE EXAMINATION",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0299",
    "Item_Name": "SANITIP AND SLEEVES",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0298",
    "Item_Name": "STERILIZING PAPER BAG Q 110X45X190MM",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0295",
    "Item_Name": "BARRIER FILM 4X6 INCH 1200 SHEET/ROLL",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0281",
    "Item_Name": "PLASTIC SLEEVE COVER BAG CODE 4_500 (CROSS PROTECTION)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0265",
    "Item_Name": "MICRO-10",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0262",
    "Item_Name": "CHILDREN TOOTHBRUSH",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0246",
    "Item_Name": "DISINFECTANT FOR INSTRUMENT 2L ROTASEPT",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0239",
    "Item_Name": "DENTURE HARD LINER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0229",
    "Item_Name": "PAPER BAGS (HEAT SEAL) CODE D SIZE 140 X 75 X 250",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0227",
    "Item_Name": "PAPER BAGS (HEAT SEAL) CODE A SIZE 90 X 50 X 168",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0140",
    "Item_Name": "VASELIN",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0109",
    "Item_Name": "STERLIZATION WRAPPING PAPER (GREEN PAPER)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0073",
    "Item_Name": "LUBRIMED (GREASE FOR HANDPIECES)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0068",
    "Item_Name": "HELIX TEST",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0061",
    "Item_Name": "TRAY ADHESIVE",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0058",
    "Item_Name": "MANDRELL FOR SANDPAPER (LAB)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0057",
    "Item_Name": "POLISHING PASTE/CREAM FOR LAB",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0055",
    "Item_Name": "CALESTONE POWDER/10 kg",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0052",
    "Item_Name": "PLASTER REMOVER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0048",
    "Item_Name": "METAL SCRAPPER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0038",
    "Item_Name": "HEADSTROOM FILES (H FILESO SZ 15-40)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0035",
    "Item_Name": "ENDODONTIC STOPPER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0032",
    "Item_Name": "RUBBER POLISHING CUPS (RA)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0030",
    "Item_Name": "PROPHYLAXIS PASTE",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0029",
    "Item_Name": "SCALER TIPS (EMS)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-014-0021",
    "Item_Name": "HEADREST SLEEVE (500 S)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0015",
    "Item_Name": "STELLON COLD MOULD SEAL",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0012",
    "Item_Name": "MOP CALICO MEDIUM",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0005",
    "Item_Name": "COLD CURE LIQUID (150 ML)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0004",
    "Item_Name": "HEAT CURE LIQUID (500 ML)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-012-0002",
    "Item_Name": "BEGO PUMICE POWDER",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0112",
    "Item_Name": "SPADNS2 FLUORIDE REAGENT",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0107",
    "Item_Name": "PROPHY BRUSHES (BRISTLE)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0098",
    "Item_Name": "SCALER TIP DTE / SATELEC/NSK",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0091",
    "Item_Name": "SURGICAL ASPIRATOR MICROTIP WITH DIAMETER 2.5MM",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0079",
    "Item_Name": "(ANISOYME)DISINFECTION AND 26 CLEANING DENTAL INSTRUMENT",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0077",
    "Item_Name": "SARAYA ALSOFT A 1 LITRE",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0054",
    "Item_Name": "MIRROR DEFOGER (1000 ML)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-011-0031",
    "Item_Name": "TRAY CLEANER LIQUID",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0023",
    "Item_Name": "DENTAL PLAQUE DISCLOSING TABLET",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0012",
    "Item_Name": "MOUTH RINSE (100 ML)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-012-022-0012",
    "Item_Name": "CHOLESTROL TEST STRIPS (10 STIPS)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-001-0004",
    "Item_Name": "HYPOALLERGENIC SURGICAL TAPE 2.5 CM X 9.1 M",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-008-001-0029",
    "Item_Name": "DISINFECTANT FOGGING SOLUTION",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-008-001-0003",
    "Item_Name": "CLEANING SOLUTION/DETERGENT",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0023",
    "Item_Name": "DENTAL PLAQUE DISCLOSING TABLET",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-013-010-0012",
    "Item_Name": "MOUTH RINSE (100 ML)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-012-022-0012",
    "Item_Name": "CHOLESTROL TEST STRIPS (10 STIPS)",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "107-006-001-0004",
    "Item_Name": "HYPOALLERGENIC SURGICAL TAPE 2.5 CM X 9.1 M",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-008-001-0029",
    "Item_Name": "DISINFECTANT FOGGING SOLUTION",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  },
  {
    "Item_Code": "106-008-001-0003",
    "Item_Name": "CLEANING SOLUTION/DETERGENT",
    "MinStock": "0",
    "KPH": "13",
    "KPKK": "12",
    "KPP": "20",
    "KPPR": "8",
    "KPSS": "6",
    "KPM": "10"
  }
    // ... paste the rest of your sheet rows here
];

async function migrateCurrentStock() {
    console.log("🚀 Starting Current Shelf Stock Migration...");
    
    // Define the exact column headers used for your clinic locations
    const clinicLocations = ["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];
    let insertCount = 0;

    for (const row of sheetSnapshot) {
        try {
            // A. Look up the true database ID for this item code
            const [item] = await sql`SELECT id FROM items WHERE item_code = ${row.Item_Code}`;
            
            if (!item) {
                console.warn(`⚠️ Skipping stock for Code [${row.Item_Code}]: Item does not exist in master items table.`);
                continue;
            }

            // B. Pivot the wide row: Loop through each clinic location column
            for (const locName of clinicLocations) {
                const currentQty = Number(row[locName]) || 0;
                const safetyLimit = Number(row.MinStock) || 0;

                // Look up the database ID for this specific clinic location
                const [loc] = await sql`SELECT id FROM locations WHERE location_name = ${locName}`;
                
                if (!loc) {
                    console.warn(`⚠️ Location [${locName}] not found in database. Skipping.`);
                    continue;
                }

                // C. Poka-Yoke UPSERT: Insert or overwrite stock metrics cleanly
                await sql`
                    INSERT INTO stock (item_id, location_id, quantity, min_stock)
                    VALUES (${item.id}, ${loc.id}, ${currentQty}, ${safetyLimit})
                    ON CONFLICT (item_id, location_id) 
                    DO UPDATE SET 
                        quantity = EXCLUDED.quantity,
                        min_stock = EXCLUDED.min_stock
                `;
                insertCount++;
            }
            
            console.log(`✅ Processed stock allocations for: ${row.Item_Name}`);
        } catch (err) {
            console.error(`❌ Failed migrating stock line for ${row.Item_Code}:`, err.message);
        }
    }

    console.log(`\n🎉 Stock migration complete! Successfully mapped ${insertCount} shelf records.`);
    process.exit(0);
}

migrateCurrentStock();