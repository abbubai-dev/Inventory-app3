import sql from './db.js';
function parseDate(dateStr) {
    if (!dateStr) return null;

    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`;
}

// 1. Paste your data snapshot here. Ensure the key names match your spreadsheet headers.
const historicalLogs = [
  {
    "txnID": "TXN-1776754159788",
    "code": "107-013-014-0119",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NOR AZIAN BINTI MOHD HUSSEIN",
    "qty": "3",
    "op": "deduct",
    "status": "Used",
    "oldDate": "21/4/2026 14:49:20"
  },
  {
    "txnID": "TXN-1776819308004",
    "code": "106-008-001-0014",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:08"
  },
  {
    "txnID": "TXN-1776819308355",
    "code": "107-013-010-0023",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:08"
  },
  {
    "txnID": "TXN-1776819309649",
    "code": "107-013-014-0019",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "6",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:10"
  },
  {
    "txnID": "TXN-1776819309944",
    "code": "107-013-014-0156",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:10"
  },
  {
    "txnID": "TXN-1776819310087",
    "code": "107-001-007-0004",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:10"
  },
  {
    "txnID": "TXN-1776819311379",
    "code": "107-013-014-0432",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "4",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:11"
  },
  {
    "txnID": "TXN-1776819311527",
    "code": "107-013-014-0504",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:55:12"
  },
  {
    "txnID": "TXN-1776819369694",
    "code": "107-013-011-0103",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "8",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 8:56:10"
  },
  {
    "txnID": "TXN-1776819681467",
    "code": "107-013-014-0089",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:01:21"
  },
  {
    "txnID": "TXN-1776819681687",
    "code": "107-013-014-0088",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "80",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:01:22"
  },
  {
    "txnID": "TXN-1776819681984",
    "code": "107-013-014-0146",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "30",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:01:22"
  },
  {
    "txnID": "TXN-1776819786766",
    "code": "107-013-011-0014",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "30",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:03:07"
  },
  {
    "txnID": "TXN-1776819786975",
    "code": "107-013-011-0015",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "20",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:03:07"
  },
  {
    "txnID": "TXN-1776819818931",
    "code": "107-013-014-0085",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "60",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:03:39"
  },
  {
    "txnID": "TXN-1776819851508",
    "code": "107-006-006-0007",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:04:12"
  },
  {
    "txnID": "TXN-1776819851683",
    "code": "107-006-006-0008",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:04:12"
  },
  {
    "txnID": "TXN-1776819851860",
    "code": "107-006-006-0006",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:04:12"
  },
  {
    "txnID": "TXN-1776819852049",
    "code": "107-006-006-0037",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "22/4/2026 9:04:12"
  },
  {
    "txnID": "TXN-1776991469025",
    "code": "107-013-014-0002",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NORHANIZA BINTI SANIMAN",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 8:44:29"
  },
  {
    "txnID": "TXN-1776993236299",
    "code": "107-013-011-0015",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 9:13:56"
  },
  {
    "txnID": "TXN-1776993236498",
    "code": "107-013-011-0014",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 9:13:56"
  },
  {
    "txnID": "TXN-1777002487735",
    "code": "107-013-014-0087",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MEOR AL HAFIZ BIN MEOR ABD HALIM",
    "qty": "10",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 11:48:08"
  },
  {
    "txnID": "TXN-1777002488056",
    "code": "107-013-014-0088",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MEOR AL HAFIZ BIN MEOR ABD HALIM",
    "qty": "10",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 11:48:08"
  },
  {
    "txnID": "TXN-1777002488317",
    "code": "107-013-014-0146",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MEOR AL HAFIZ BIN MEOR ABD HALIM",
    "qty": "10",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 11:48:08"
  },
  {
    "txnID": "TXN-1777015140617",
    "code": "111-002-004-0017",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 15:19:01"
  },
  {
    "txnID": "TXN-1777015191409",
    "code": "107-013-014-0088",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "24/4/2026 15:19:51"
  },
  {
    "txnID": "TXN-1777258179773",
    "code": "107-013-014-0119",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NORHANIZA BINTI SANIMAN",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "27/4/2026 10:49:40"
  },
  {
    "txnID": "TXN-1777446351488",
    "code": "107-013-014-0113",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NORHANIZA BINTI SANIMAN",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "29/4/2026 15:05:51"
  },
  {
    "txnID": "TXN-1777451797066",
    "code": "107-013-014-0135",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "4",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:36:37"
  },
  {
    "txnID": "TXN-1777451797291",
    "code": "107-013-011-0079",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:36:37"
  },
  {
    "txnID": "TXN-1777451881891",
    "code": "107-013-007-0007",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:02"
  },
  {
    "txnID": "TXN-1777451882015",
    "code": "107-013-011-0031",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "2",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:02"
  },
  {
    "txnID": "TXN-1777451882369",
    "code": "107-013-014-0246",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:02"
  },
  {
    "txnID": "TXN-1777451882487",
    "code": "107-013-014-0111",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:02"
  },
  {
    "txnID": "TXN-1777451883227",
    "code": "107-013-014-0139",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "25",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:03"
  },
  {
    "txnID": "TXN-1777451883566",
    "code": "107-013-014-0142",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:04"
  },
  {
    "txnID": "TXN-1777451883667",
    "code": "107-013-005-0006",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:04"
  },
  {
    "txnID": "TXN-1777451883776",
    "code": "107-013-005-0001",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "10",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:04"
  },
  {
    "txnID": "TXN-1777451883886",
    "code": "107-013-006-0002",
    "location": "KPP",
    "fromLocation": "STOR",
    "username": "NOOR AZILINDA BINTI MOHAMAD YUSOP",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "29/4/2026 16:38:04"
  },
  {
    "txnID": "TXN-1777452170603",
    "code": "107-013-014-0135",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NORHANIZA BINTI SANIMAN",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "29/4/2026 16:42:51"
  },
  {
    "txnID": "TXN-1777534281403",
    "code": "111-002-004-0017",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "30/4/2026 15:31:21"
  },
  {
    "txnID": "TXN-1777856243699",
    "code": "107-013-014-0085",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "AARON LAM WUI VUN",
    "qty": "3",
    "op": "deduct",
    "status": "Used",
    "oldDate": "4/5/2026 8:57:24"
  },
  {
    "txnID": "TXN-1777865260902",
    "code": "107-013-011-0015",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "4/5/2026 11:27:41"
  },
  {
    "txnID": "TXN-1777865261123",
    "code": "107-013-014-0135",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "4/5/2026 11:27:41"
  },
  {
    "txnID": "TXN-1777947704541",
    "code": "107-013-011-0036",
    "location": "KPPR",
    "fromLocation": "STOR",
    "username": "DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL",
    "qty": "5",
    "op": "add",
    "status": "Add",
    "oldDate": "5/5/2026 10:21:45"
  },
  {
    "txnID": "TXN-1777947734261",
    "code": "107-013-011-0104",
    "location": "KPPR",
    "fromLocation": "STOR",
    "username": "DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL",
    "qty": "3",
    "op": "add",
    "status": "Add",
    "oldDate": "5/5/2026 10:22:14"
  },
  {
    "txnID": "TXN-1777953670083",
    "code": "107-013-007-0002",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "5/5/2026 12:01:10"
  },
  {
    "txnID": "TXN-1777965891126",
    "code": "107-013-011-0015",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "5/5/2026 15:24:51"
  },
  {
    "txnID": "TXN-1778113034066",
    "code": "107-013-003-0018",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 8:17:14"
  },
  {
    "txnID": "TXN-1778113034239",
    "code": "107-013-003-0019",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 8:17:14"
  },
  {
    "txnID": "TXN-1778126990994",
    "code": "107-013-011-0103",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 12:09:51"
  },
  {
    "txnID": "TXN-1778138106271",
    "code": "107-013-011-0036",
    "location": "KPPR",
    "fromLocation": "STOR",
    "username": "DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL",
    "qty": "5",
    "op": "add",
    "status": "Add",
    "oldDate": "7/5/2026 15:15:06"
  },
  {
    "txnID": "TXN-1778138203170",
    "code": "107-013-011-0036",
    "location": "KPPR",
    "fromLocation": "STOR",
    "username": "DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL",
    "qty": "5",
    "op": "add",
    "status": "Add",
    "oldDate": "7/5/2026 15:16:43"
  },
  {
    "txnID": "TXN-1778139067876",
    "code": "107-013-014-0087",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:08"
  },
  {
    "txnID": "TXN-1778139069444",
    "code": "107-013-011-0103",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:09"
  },
  {
    "txnID": "TXN-1778139069647",
    "code": "107-013-011-0015",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:10"
  },
  {
    "txnID": "TXN-1778139069850",
    "code": "107-013-005-0006",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:10"
  },
  {
    "txnID": "TXN-1778139070070",
    "code": "107-013-011-0005",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:10"
  },
  {
    "txnID": "TXN-1778139070263",
    "code": "107-013-011-0036",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:10"
  },
  {
    "txnID": "TXN-1778139070464",
    "code": "107-013-011-0036",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "7/5/2026 15:31:10"
  },
  {
    "txnID": "TXN-1778209521185",
    "code": "107-013-005-0001",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "8/5/2026 11:05:21"
  },
  {
    "txnID": "TXN-1778567098764",
    "code": "107-013-014-0135",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "12/5/2026 14:24:59"
  },
  {
    "txnID": "TXN-1778567099076",
    "code": "107-013-014-0119",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "12/5/2026 14:24:59"
  },
  {
    "txnID": "TXN-1778631217094",
    "code": "107-013-014-0135",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "13/5/2026 8:13:37"
  },
  {
    "txnID": "TXN-1778633230821",
    "code": "107-013-003-0018",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "13/5/2026 8:47:11"
  },
  {
    "txnID": "TXN-1778812140849",
    "code": "107-013-014-0002",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 10:29:01"
  },
  {
    "txnID": "TXN-1778812457643",
    "code": "107-013-014-0019",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 10:34:18"
  },
  {
    "txnID": "TXN-1778812457938",
    "code": "107-013-011-0079",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "4",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 10:34:18"
  },
  {
    "txnID": "TXN-1778812459234",
    "code": "107-013-011-0036",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "5",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 10:34:19"
  },
  {
    "txnID": "TXN-1778812459490",
    "code": "107-013-014-0014",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "5",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 10:34:19"
  },
  {
    "txnID": "TXN-1778833853873",
    "code": "107-013-014-0139",
    "location": "PATIENT",
    "fromLocation": "KPPR",
    "username": "DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL",
    "qty": "3",
    "op": "deduct",
    "status": "Used",
    "oldDate": "15/5/2026 16:30:54"
  },
  {
    "txnID": "TXN-1779067542867",
    "code": "107-013-011-0015",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "18/5/2026 9:25:43"
  },
  {
    "txnID": "TXN-1779067543192",
    "code": "107-013-005-0001",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "NURUL NADIA BINTI MAT NOOR",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "18/5/2026 9:25:43"
  },
  {
    "txnID": "TXN-1779240294909",
    "code": "111-002-004-0017",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "DR SHARMILLA A/P MURAGAYA",
    "qty": "2",
    "op": "deduct",
    "status": "Used",
    "oldDate": "20/5/2026 9:24:55"
  },
  {
    "txnID": "TXN-1779245812061",
    "code": "107-013-014-0085",
    "location": "KPH",
    "fromLocation": "STOR",
    "username": "DR MAISARAH",
    "qty": "1",
    "op": "add",
    "status": "Add",
    "oldDate": "20/5/2026 10:56:52"
  },
  {
    "txnID": "TXN-1779245931620",
    "code": "107-013-011-0036",
    "location": "KPH",
    "fromLocation": "STOR",
    "username": "DR MAISARAH",
    "qty": "2",
    "op": "add",
    "status": "Add",
    "oldDate": "20/5/2026 10:58:52"
  },
  {
    "txnID": "TXN-1779344584406",
    "code": "107-013-014-0085",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "MUHD SYAFIQ MONGGIE BIN ABDULLAH",
    "qty": "3",
    "op": "deduct",
    "status": "Used",
    "oldDate": "21/5/2026 14:23:04"
  },
  {
    "txnID": "TXN-1779349153130",
    "code": "107-013-003-0018",
    "location": "PATIENT",
    "fromLocation": "KPP",
    "username": "WAN SITI AMINAH BINTI WAN ISMAIL",
    "qty": "1",
    "op": "deduct",
    "status": "Used",
    "oldDate": "21/5/2026 15:39:13"
  }
    // ... paste all your legacy log rows here
];

async function runHistoryMigration() {
    console.log("🚀 Initializing legacy transaction database injection...");
    let successCount = 0;
    let skipCount = 0;

    for (const log of historicalLogs) {
        try {
            // A. Cross-reference textual spreadsheet properties to database relational IDs
            const [item] = await sql`
                SELECT id FROM items WHERE item_code = ${log.code}
            `;

            // Handle PATIENT transactions
            let actualLocation = log.location;

            if (log.location === "PATIENT") {
                actualLocation = log.fromLocation;
            }

            const [loc] = await sql`
                SELECT id FROM locations WHERE location_name = ${actualLocation}
            `;

            const [user] = await sql`
                SELECT id FROM users WHERE LOWER(username) = LOWER(${log.username})
            `;
            
            // B. Resolve the sender location tracking link safely if present
            let fromLocId = null;
            if (log.fromLocation) {
                const [fromLoc] = await sql`SELECT id FROM locations WHERE location_name = ${log.fromLocation}`;
                if (fromLoc) fromLocId = fromLoc.id;
            }

            // C. Poka-Yoke: Skip if core structural dependencies do not exist in system
            if (!item || !loc || !user) {
                console.warn(
                    `⚠️ Skipping ${log.txnID}`,
                    {
                        itemFound: !!item,
                        locationFound: !!loc,
                        userFound: !!user,
                        code: log.code,
                        location: log.location,
                        username: log.username
                    }
                );

                skipCount++;
                continue;
            }

            // D. Insert row using ON CONFLICT protection to make it safe to re-run
            await sql`
                INSERT INTO transactions (
                    id, -- ✅ FIXED: Added target ID column
                    item_id,
                    location_id,
                    from_location_id,
                    user_id,
                    quantity,
                    operation,
                    status_override,
                    timestamp
                )
                VALUES (
                    ${log.txnID}, -- ✅ FIXED: Passed transaction ID data map asset
                    ${item.id},
                    ${loc.id},
                    ${fromLocId},
                    ${user.id},
                    ${Number(log.qty)},
                    ${log.op},
                    ${log.status},
                    ${parseDate(log.oldDate)}
                )
                ON CONFLICT (id) DO NOTHING; -- ✅ FIXED: Added true conflict safeguard handler
            `;
            
            successCount++;
        } catch (err) {
            console.error(`❌ Database write failure on transaction ${log.txnID}:`, err.message);
            skipCount++;
        }
    }

    console.log(`\n🎉 Migration engine run complete!`);
    console.log(`✅ Successfully injected: ${successCount} logs.`);
    console.log(`⚠️ Skipped/Failed entries: ${skipCount}.`);
    process.exit(0);
}

runHistoryMigration();