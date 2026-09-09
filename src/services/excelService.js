import * as XLSX from 'xlsx';

/**
 * Parses uploaded .xlsx / .xls file into normalized member records
 * Handles various header spellings e.g. "MEMBERS NAME", "PHONE NUMER", "MEMBERS ADDERS",
 * as well as positional columns (Column A: Name, Column B: Phone, Column C: Address).
 * @param {File} file 
 * @returns {Promise<{success: boolean, data?: Array, error?: string, totalRows?: number}>}
 */
export function parseExcelFile(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
          
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            return resolve({ success: false, error: "The Excel file does not contain any sheets." });
          }

          const worksheet = workbook.Sheets[firstSheetName];
          
          // Read as 2D array of rows (header: 1)
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

          if (!rawRows || rawRows.length === 0) {
            return resolve({ success: false, error: "The Excel sheet is empty." });
          }

          // Filter out completely empty rows
          const nonEmptyRows = rawRows.filter(r => Array.isArray(r) && r.some(cell => String(cell).trim().length > 0));

          if (nonEmptyRows.length === 0) {
            return resolve({ success: false, error: "No data found in the Excel sheet." });
          }

          // Check if first row is header
          const firstRow = nonEmptyRows[0].map(c => String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
          
          let nameColIdx = 0;
          let phoneColIdx = 1;
          let addrColIdx = 2;
          let startIndex = 0;

          const isHeader = firstRow.some(cell => 
            cell.includes('name') || 
            cell.includes('phone') || 
            cell.includes('numer') || 
            cell.includes('number') || 
            cell.includes('adder') || 
            cell.includes('address') ||
            cell.includes('member')
          );

          if (isHeader) {
            startIndex = 1; // skip header row

            // Identify column indices based on header names (Address checked first to prevent 'membersadders' matching 'member')
            firstRow.forEach((h, idx) => {
              if (h.includes('adder') || h.includes('addr') || h.includes('address') || h.includes('residen') || h.includes('street') || h.includes('city') || h.includes('location')) {
                addrColIdx = idx;
              } else if (h.includes('phone') || h.includes('numer') || h.includes('number') || h.includes('mobile') || h.includes('num') || h.includes('contact') || h.includes('tel')) {
                phoneColIdx = idx;
              } else if (h.includes('name') || h.includes('member') || h.includes('rtn') || h.includes('person')) {
                nameColIdx = idx;
              }
            });
          }


          // If no address header found but 3 columns exist, default addr to col 2
          const dataRows = nonEmptyRows.slice(startIndex);

          const normalizedRecords = [];

          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            const rawName = String(row[nameColIdx] !== undefined ? row[nameColIdx] : (row[0] || '')).trim();
            const rawPhone = String(row[phoneColIdx] !== undefined ? row[phoneColIdx] : (row[1] || '')).trim();
            const rawAddr = String(row[addrColIdx] !== undefined ? row[addrColIdx] : (row[2] || '')).trim();

            // Clean 10 digit phone (strip spaces, symbols like 97869 33499 -> 9786933499)
            const cleanedDigits = rawPhone.replace(/\D/g, '');
            const cleanPhone = cleanedDigits.length >= 10 ? cleanedDigits.slice(-10) : cleanedDigits;

            // Row is valid if it has at least a Name or an Address
            const isValidName = rawName.length > 0;
            const hasData = isValidName || rawAddr.length > 0;

            if (hasData) {
              normalizedRecords.push({
                rowIndex: i + 1,
                name: rawName || 'Member',
                phone: cleanPhone || '',
                memberAddress: rawAddr,
                isValid: true,
                validationErrors: []
              });
            }
          }

          resolve({
            success: true,
            data: normalizedRecords,
            totalRows: normalizedRecords.length,
            validRows: normalizedRecords.filter(r => r.isValid).length,
            invalidRows: normalizedRecords.filter(r => !r.isValid).length
          });

        } catch (parseError) {
          console.error("Excel parse inner error:", parseError);
          resolve({ success: false, error: `Failed to read Excel data: ${parseError.message}` });
        }
      };

      reader.onerror = (error) => {
        resolve({ success: false, error: "Failed to read file from disk." });
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Generates and downloads a sample 3-column template for users
 */
export function downloadSampleTemplate() {
  const sampleData = [
    {
      "MEMBERS NAME": "ASHOK KUMAR .A",
      "PHONE NUMER": "97869 33499",
      "MEMBERS ADDERS": "138 , MILLAI NAGAR PERUNDURAI ,ERODE - 638052"
    },
    {
      "MEMBERS NAME": "ANADHA KUMAR .S",
      "PHONE NUMER": "98428 38239",
      "MEMBERS ADDERS": "24 , POONDURAI MAIN ROAD , MULLAMPARAPPU , ERODE - 638115"
    },
    {
      "MEMBERS NAME": "CHANDRA SEKARAN .SKM",
      "PHONE NUMER": "",
      "MEMBERS ADDERS": "123, GANDHIJI STREET - 2 KARUR BY PASS ROAD , ERODE - 638002"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Name
    { wch: 20 }, // Phone
    { wch: 55 }  // Address
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

  XLSX.writeFile(workbook, "Rotary_Erode_Central_Members_Template.xlsx");
}

/**
 * Export current members list to Excel
 */
export function exportMembersToExcel(members, fileName = "Rotary_Erode_Central_Members.xlsx") {
  const sortedMembers = [...members].sort((a, b) => 
    (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' })
  );

  const exportData = sortedMembers.map((m, idx) => ({
    "S.No": idx + 1,
    "Member Name": m.name || "",
    "Phone Number": m.phone || "",
    "Member Address": m.memberAddress || "",
    "Business Address": m.businessAddress || "",
    "Vertical / Classification": m.vertical || "Not specified",
    "Profile Status": m.status || "Pending",
    "Account Status": m.isActive === false ? "Disabled" : "Active",
    "Photo Attached": m.profilePhoto ? "Yes" : "No"
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 16 },
    { wch: 35 },
    { wch: 35 },
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  XLSX.writeFile(workbook, fileName);
}
