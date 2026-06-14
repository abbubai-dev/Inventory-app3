import sql from './db';

const masterItems = [
  {
    "item_code": "111-002-004-0017",
    "item_name": "MASK 3M 8210 N95",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0015",
    "item_name": "SURG FACE MASK TIE ON",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0014",
    "item_name": "DISPOSABLE FACE MASK EAR LOOPS",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0432",
    "item_name": "DISPOSABLE HEAD COVER (HOOD/TUDUNG) 1pax=100pcs",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0197",
    "item_name": "DISPOSABLE GOWN SLEEVE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0434",
    "item_name": "DISPOSABLE BOOT COVER 1box=150pair",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0394",
    "item_name": "DISPOSABLE CLIP CAP 1pax=50pcs",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0019",
    "item_name": "DISPOSABLE PLASTIC APRON (SLEVELESS) 1pax=100pcs",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0085",
    "item_name": "ISOLATION SURGICAL GOWN (PAX)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "111-001-004-0004",
    "item_name": "CPE PROTECTIVE GOWN (THUMB HOOK GOWN) 1pax=100",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0087",
    "item_name": "GLOVE DENTAL - EXTRA SMALL ( 1Big Box=10 Small box)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0283, 107-013-014-0148"
  },
  {
    "item_code": "107-013-014-0088",
    "item_name": "GLOVE DENTAL - SMALL (1Big Box=10 Small box)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0284, 107-013-014-0149"
  },
  {
    "item_code": "107-013-014-0146",
    "item_name": "GLOVE DENTAL - MEDIUM (1Big Box=10 Small box)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0285, 107-013-014-0150"
  },
  {
    "item_code": "107-013-014-0089",
    "item_name": "GLOVE DENTAL - LARGE  (1Big Box=10 Small box)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0286"
  },
  {
    "item_code": "107-006-006-0008",
    "item_name": "GLOVE SURG. LAT.SZ 6 BOX",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-006-006-0006",
    "item_name": "GLOVE SURG.LAT. SZ 6.5 BOX",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-006-006-0007",
    "item_name": "GLOVE SURG.LAT.SZ 7 BOX",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-006-006-0037",
    "item_name": "GLOVE SURG.LAT. SZ 7.5 BOX",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "106-008-001-0014",
    "item_name": "DISINFECTANT HAND RUB/GEL",
    "unit_multiplier": "1",
    "alias": "107-013-011-0108"
  },
  {
    "item_code": "107-018-001-0115",
    "item_name": "ALCOHOL PREP PAD",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0103",
    "item_name": "DISINFECTANT FOR SUCTON LINES ASPIRMATIC",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0155",
    "item_name": "AUTOCLAVE TAPE 2CM WIDE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0066",
    "item_name": "BIOLOGICAL INDICATORS (AUTOCLAVE)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0067",
    "item_name": "BOWEDICK TEST",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0504",
    "item_name": "CHLORHEXIDINE GLUCONATE 5 PERCENT",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0065",
    "item_name": "DISINFECTANT WIPES",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0078",
    "item_name": "SARAYA SHAFONET HAND SOAP 1 LITRE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0065",
    "item_name": "SURFACE DISINFECTANT CLEANER (SURFA 'SAFE, MIKROZID, ACTOANID)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0017",
    "item_name": "MICROBRUSH DISPOSABLE APPLICATOR WITH DISPENSER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0044",
    "item_name": "PAPER ARTICULATING",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-004-0005",
    "item_name": "KALZINOL LIQUID/POWDER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-004-0003",
    "item_name": "CAVIT TEMPORARY FILLING",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-003-0018",
    "item_name": "SDI ICE COMPOSITE A2",
    "unit_multiplier": "1",
    "alias": "107-013-003-0004"
  },
  {
    "item_code": "107-013-003-0019",
    "item_name": "SDI ICE COMPOSITE A3",
    "unit_multiplier": "1",
    "alias": "107-013-003-0005"
  },
  {
    "item_code": "107-013-003-0013",
    "item_name": "LIGHT CURE COMPOSITE (ANTERIOR /Z 250 (OFFICER))",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-003-0016",
    "item_name": "LIGHT CURE COMPOSITE POLOFIL",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-003-0037",
    "item_name": "SELF ADHESIVE FLOWABLE COMPOSITE RESIN",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-007-0007",
    "item_name": "DENTIN CONDITIONER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0005",
    "item_name": "CHULK DYCAL",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-007-0002",
    "item_name": "ETCHING GEL",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0068",
    "item_name": "FISSURE SEALANT RESIN (LIGHT CURE)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-005-0006",
    "item_name": "GC FUJI GOLD LABEL GLASS LONOMER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-005-0001",
    "item_name": "GC FUJI IX GLASS IONOMER",
    "unit_multiplier": "1",
    "alias": "107-013-005-0003"
  },
  {
    "item_code": "107-013-005-0005",
    "item_name": "GIC RIVA",
    "unit_multiplier": "1",
    "alias": "107-013-011-0075"
  },
  {
    "item_code": "107-013-011-0067",
    "item_name": "GC FUJI VII",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0135",
    "item_name": "BONDING AGENT",
    "unit_multiplier": "1",
    "alias": "107-013-007-0001"
  },
  {
    "item_code": "107-013-011-0066",
    "item_name": "COCOA BUTTER 10G",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0033",
    "item_name": "CALCIUM HYDROXIDE PASTE (non setting RCT temp med)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0034",
    "item_name": "EDTA LUBRICANT (GLYDE) (root canal conditioner)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0007",
    "item_name": "GUTTA PERCHA POINT SZ: 15-40",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0006",
    "item_name": "GUTTA PERCHA POINT SZ: 45-80",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0013",
    "item_name": "GUTTA PERCHA POINT SZ: F1-F3 (PROTAPER)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0008",
    "item_name": "GUTTA PERCHA POINT SZ 15",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0002",
    "item_name": "LEDERMIX (5G)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0074",
    "item_name": "PAPER POINT ABST SZ: 45-80",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0086",
    "item_name": "PAPER POINT SZ: F1-F3 (PROTAPER)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0085",
    "item_name": "PAPER POINT SZ: 15-40",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0003",
    "item_name": "TOP SEAL ROOT CANAL SEALER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0137",
    "item_name": "ALVOGYL PASTE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-010-004-0001",
    "item_name": "DISPOSABLE LANCET",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-010-002-0007",
    "item_name": "BLOOD GLUCOSE TEST STRIPS",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0113",
    "item_name": "PARACETAMOL 500MG TAB (BOX)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0100",
    "item_name": "FLOURIDE VARNISH CLINPRO (1 Box= 20 Tubes)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0028"
  },
  {
    "item_code": "107-002-007-0221",
    "item_name": "VICRYL 4/0 VCP 304H COATED VICRYL PLUS ANTIBACTERIAL 17 MM 1/2 C TAPPER 70 CM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-002-007-0471",
    "item_name": "SUTURE VICRYL 3/0",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-002-007-0472",
    "item_name": "SUTURE VICRYL 5/0",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-002-006-0057",
    "item_name": "SUTURE BRILON 5/0 (Ethilon)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0144",
    "item_name": "INJ.LIGNOCAINE / MEPIVACAINE",
    "unit_multiplier": "1",
    "alias": "N01BB53974P3001a, N01BB53974P3001XX"
  },
  {
    "item_code": "107-001-004-0010",
    "item_name": "NEEDLE DISP. 23 G X 30 MM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0111",
    "item_name": "DISPOSIBLE NEEDLES 26G X 25 MM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-009-0099",
    "item_name": "NEEDLE DISP 27G X 41 MM (LONG)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0142",
    "item_name": "NEEDLE HYPODERMIC DIP. 27G x 22MM short (0.4x22mm)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0119",
    "item_name": "TOPICAL ANESTHETIC GEL (XYLOCAINE/GESICANE)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0010",
    "item_name": "COTTON WOOL ROOL NO: 2",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0014",
    "item_name": "BIB FOR CHILDREN 3PLY",
    "unit_multiplier": "1",
    "alias": "107-013-011-0047"
  },
  {
    "item_code": "107-013-010-0002",
    "item_name": "DENTAL FLOSS",
    "unit_multiplier": "1",
    "alias": "107-013-018-0119"
  },
  {
    "item_code": "107-013-010-0004",
    "item_name": "DENTAL SPONGOSTAN",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0023",
    "item_name": "DISPOSABLE DENTAL MOUTH MIRROR",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0020",
    "item_name": "DISP PAPER CUP (1Pax=50pcs)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0022",
    "item_name": "DISPOSABLE PROBE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0156",
    "item_name": "SYRINGE DISP. 20ML (Box=50 Units)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-001-007-0004",
    "item_name": "SYRINGE DISPOSABLE 10 ML (1 Box=100 Unit)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0112",
    "item_name": "SYRINGE DISP 5ML",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0013",
    "item_name": "DISPOSABLE APPLICATORS",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0021",
    "item_name": "DISPOSABLE TWEEZER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0002",
    "item_name": "HAND TOWEL TISSUE (Big BOX= 20 Small Box)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0036",
    "item_name": "SALIVA EJECTOR DISP Pax",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-010-0018",
    "item_name": "NACL 0.9 PERATUS 500 ML. INJ. (NORMAL SALINE)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-002-012-0012",
    "item_name": "SURGITIP",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0153",
    "item_name": "ABSORBANT GAUZE",
    "unit_multiplier": "1",
    "alias": "107-006-005-0006, 107-006-005-0022"
  },
  {
    "item_code": "107-013-014-0139",
    "item_name": "IMPRESSION MATERIAL - ALGINATE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0051",
    "item_name": "PLASTER OF PARIS (DENTAL POP) 10 kg",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0105",
    "item_name": "DENTAL STONE 5KG",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0050",
    "item_name": "DENTURE MATERIAL SELF CURE (PINK P/L)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0134"
  },
  {
    "item_code": "107-013-006-0002",
    "item_name": "ZINC OXIDE IMP PASTE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0016",
    "item_name": "GREEN STICK",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0023",
    "item_name": "MODELLING WAX 500 G (500 GM)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0045",
    "item_name": "STICKY WAX",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0024",
    "item_name": "WAX BITE BLOCK",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "106-009-001-0023",
    "item_name": "BUNSEN BURNER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0104",
    "item_name": "X-RAY PERIAPICAL (X-RAY FILM)",
    "unit_multiplier": "1",
    "alias": "107-013-011-0099"
  },
  {
    "item_code": "108-001-013-0074",
    "item_name": "COLD SPRAY MEDIC-ETHYL CHLORIDE 100ML",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "108-001-009-0086",
    "item_name": "CHOLINE SALICYLATE CETYLKONIUM CHLORIDA",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "108-001-008-0040",
    "item_name": "IBUPROFEN 200 MG TABLET",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0324",
    "item_name": "DISPOSABLE EXAMINATION",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0299",
    "item_name": "SANITIP AND SLEEVES",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0298",
    "item_name": "STERILIZING PAPER BAG Q 110X45X190MM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0295",
    "item_name": "BARRIER FILM 4X6 INCH 1200 SHEET/ROLL",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0281",
    "item_name": "PLASTIC SLEEVE COVER BAG CODE 4_500 (CROSS PROTECTION)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0265",
    "item_name": "MICRO-10",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0262",
    "item_name": "CHILDREN TOOTHBRUSH",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0246",
    "item_name": "DISINFECTANT FOR INSTRUMENT 2L ROTASEPT",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0239",
    "item_name": "DENTURE HARD LINER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0229",
    "item_name": "PAPER BAGS (HEAT SEAL) CODE D SIZE 140 X 75 X 250",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0227",
    "item_name": "PAPER BAGS (HEAT SEAL) CODE A SIZE 90 X 50 X 168",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0140",
    "item_name": "VASELIN",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0109",
    "item_name": "STERLIZATION WRAPPING PAPER (GREEN PAPER)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0073",
    "item_name": "LUBRIMED (GREASE FOR HANDPIECES)",
    "unit_multiplier": "1",
    "alias": "107-013-014-0072"
  },
  {
    "item_code": "107-013-014-0068",
    "item_name": "HELIX TEST",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0061",
    "item_name": "TRAY ADHESIVE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0058",
    "item_name": "MANDRELL FOR SANDPAPER (LAB)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0057",
    "item_name": "POLISHING PASTE/CREAM FOR LAB",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0055",
    "item_name": "CALESTONE POWDER/10 kg",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0052",
    "item_name": "PLASTER REMOVER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0048",
    "item_name": "METAL SCRAPPER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0038",
    "item_name": "HEADSTROOM FILES (H FILESO SZ 15-40)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0035",
    "item_name": "ENDODONTIC STOPPER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0032",
    "item_name": "RUBBER POLISHING CUPS (RA)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0030",
    "item_name": "PROPHYLAXIS PASTE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0029",
    "item_name": "SCALER TIPS (EMS)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-014-0021",
    "item_name": "HEADREST SLEEVE (500 S)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0015",
    "item_name": "STELLON COLD MOULD SEAL",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0012",
    "item_name": "MOP CALICO MEDIUM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0005",
    "item_name": "COLD CURE LIQUID (150 ML)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0004",
    "item_name": "HEAT CURE LIQUID (500 ML)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-012-0002",
    "item_name": "BEGO PUMICE POWDER",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0112",
    "item_name": "SPADNS2 FLUORIDE REAGENT",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0107",
    "item_name": "PROPHY BRUSHES (BRISTLE)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0098",
    "item_name": "SCALER TIP DTE / SATELEC/NSK",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0091",
    "item_name": "SURGICAL ASPIRATOR MICROTIP WITH DIAMETER 2.5MM",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0079",
    "item_name": "(ANISOYME)DISINFECTION AND 26 CLEANING DENTAL INSTRUMENT",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0077",
    "item_name": "SARAYA ALSOFT A 1 LITRE",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0054",
    "item_name": "MIRROR DEFOGER (1000 ML)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-011-0031",
    "item_name": "TRAY CLEANER LIQUID",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-010-0023",
    "item_name": "DENTAL PLAQUE DISCLOSING TABLET",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-013-010-0012",
    "item_name": "MOUTH RINSE (100 ML)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-012-022-0012",
    "item_name": "CHOLESTROL TEST STRIPS (10 STIPS)",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "107-006-001-0004",
    "item_name": "HYPOALLERGENIC SURGICAL TAPE 2.5 CM X 9.1 M",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "106-008-001-0029",
    "item_name": "DISINFECTANT FOGGING SOLUTION",
    "unit_multiplier": "1",
    "alias": ""
  },
  {
    "item_code": "106-008-001-0003",
    "item_name": "CLEANING SOLUTION/DETERGENT",
    "unit_multiplier": "1",
    "alias": ""
  }
];

async function seedMasterCatalog() {
    console.log("📦 Initializing Master Items Seed Run...");
    let count = 0;

    for (const item of masterItems) {
        try {
            await sql`
                INSERT INTO items (item_code, item_name, unit_multiplier, alias)
                VALUES (${item.item_code}, ${item.item_name}, ${item.unit_multiplier}, ${item.alias})
                ON CONFLICT (item_code) 
                DO UPDATE SET 
                    item_name = EXCLUDED.item_name,
                    unit_multiplier = EXCLUDED.unit_multiplier,
                    alias = EXCLUDED.alias
            `;
            console.log(`✅ Seeded Item: [${item.item_code}] - ${item.alias}`);
            count++;
        } catch (err) {
            console.error(`❌ Failed seeding item ${item.item_code}:`, err.message);
        }
    }

    console.log(`\n🎉 Success! Added ${count} items to the master repository.`);
    process.exit(0);
}

seedMasterCatalog();