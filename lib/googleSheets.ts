import { google } from "googleapis";

// Parse the sheet ID to remove any URL fragments or query params
function extractSheetId(id: string): string {
  const match = id.match(/[-\w]{25,}/);
  if (match) return match[0];
  console.warn(
    "GOOGLE_SHEET_ID may be incorrectly formatted. Please use only the ID, not the full URL."
  );
  return id;
}

interface GoogleServiceAccount {
  client_email?: string;
  private_key?: string;
}

let serviceAccount: GoogleServiceAccount = {};
try {
  serviceAccount = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    "{}"
  );
} catch {
  console.warn("Google Sheets API: Failed to parse GOOGLE_SERVICE_ACCOUNT env var.");
}

const rawSheetId = process.env.GOOGLE_SHEET_ID || "";
const sheetId = extractSheetId(rawSheetId);
const sheetName = process.env.GOOGLE_SHEET_FILENAME || "Tadorado";

// Fix: Convert literal \n or \r\n to real newlines in the private key
const fixedPrivateKey = serviceAccount?.private_key
  ? serviceAccount.private_key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n")
  : undefined;

const auth = new google.auth.JWT({
  email: serviceAccount?.client_email,
  key: fixedPrivateKey,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

// Debug: List all sheet/tab names in the spreadsheet
export async function logSheetTabNames() {
  if (!serviceAccount?.client_email || !sheetId) {
    console.warn("Google Sheets API: Credentials or Sheet ID missing. Skipping logSheetTabNames.");
    return [];
  }
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const tabs = res.data.sheets?.map((s) => s.properties?.title) || [];
    console.log("Google Sheets API - Available tab names:", tabs);
    return tabs;
  } catch (error) {
    console.error("Error fetching sheet tab names:", error);
    return [];
  }
}

// Debug: Log Drive file info as seen by the service account
export async function logDriveFileInfo() {
  if (!serviceAccount?.client_email || !sheetId) {
    console.warn("Google Sheets API: Credentials or Sheet ID missing. Skipping logDriveFileInfo.");
    return null;
  }
  try {
    const res = await drive.files.get({
      fileId: sheetId,
      fields: "id, name, owners",
    });
    console.log("Drive file info:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching Drive file info:", error);
    return null;
  }
}

// Call the debug functions at startup only in development
if (process.env.NODE_ENV === "development" && serviceAccount?.client_email && sheetId) {
  console.log(`Google Sheets API: Using spreadsheet ID: ${sheetId}`);
  console.log(
    `Google Sheets API: Using service account: ${serviceAccount.client_email}`
  );
  logSheetTabNames();
  logDriveFileInfo();
}

export async function appendOrderToSheet(orderData: Record<string, unknown>) {
  if (!serviceAccount?.client_email || !sheetId) {
    return {
      success: false,
      error: "Google Sheets credentials or Sheet ID missing in environment variables.",
    };
  }
  try {
    // Format measurements as multi-line string
    let measurementsFormatted = "";
    if (Array.isArray(orderData.measurements)) {
      measurementsFormatted = orderData.measurements
        .map((m: Record<string, unknown>, idx: number) => {
          const label = m.label || `Person ${idx + 1}`;
          // Collect all measurement fields except label and gender
          const details = Object.entries(m)
            .filter(([k, v]) => k !== "label" && k !== "gender" && v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"); // Use newline for each measurement
          return `${label} (${m.gender}):\n${details}`;
        })
        .join("\n\n"); // Separate people by double newline
    } else if (typeof orderData.measurements === "string") {
      measurementsFormatted = orderData.measurements;
    }

    // Helper to trim and format text fields
    const formatCell = (val: unknown) =>
      typeof val === "string" ? val.trim() : val ?? "";

    // Format address with newlines for commas, only if it's a string
    const formattedAddress = (() => {
      const addr = formatCell(orderData.deliveryAddress);
      return typeof addr === "string" ? addr.replace(/, /g, "\n") : addr;
    })();

    // Organize columns: id, name, email, phone, product, quantity, price, address, city, state, zip, country, measurements, notes, etc.
    let row = [
      formatCell(orderData.orderNumber), // id
      formatCell(orderData.customerName), // name
      formatCell(orderData.customerEmail), // email
      formatCell(orderData.customerPhone), // phone
      formatCell(orderData.productName), // product(s)
      formatCell(orderData.productQuantity), // quantity
      formatCell(orderData.productPrice), // price
      formatCell(orderData.totalAmount), // total
      formatCell(orderData.shippingCost), // shipping
      formatCell(orderData.taxAmount), // tax
      formatCell(orderData.orderDate), // order date
      formatCell(orderData.orderStatus), // status
      formattedAddress, // address (newlines for commas)
      formatCell(orderData.deliveryCity), // city
      formatCell(orderData.deliveryState), // state
      formatCell(orderData.deliveryZipCode), // zip
      formatCell(orderData.deliveryCountry), // country
      measurementsFormatted, // measurements (multi-line)
      formatCell(orderData.notes), // notes
      formatCell(orderData.productCategory), // category
      formatCell(orderData.productSubCategory), // subcategory
      formatCell(orderData.productImage), // product image(s)
      formatCell(orderData.paymentMethod), // payment method
    ];
    // Ensure the row always has exactly 23 columns (A–W)
    if (row.length < 23) {
      row = row.concat(Array(23 - row.length).fill(""));
    } else if (row.length > 23) {
      row = row.slice(0, 23);
    }
    // Ensure the sheet/tab exists, create if missing
    const ss = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const exists = ss.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      console.log(`Created new sheet/tab: ${sheetName}`);
    }
    // Always append to the table anchored at column A (A1), so every order starts at column A
    const range = `${sheetName}!A1`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Google Sheets export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
