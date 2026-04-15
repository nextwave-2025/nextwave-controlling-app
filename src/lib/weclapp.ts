type WeclappInvoice = {
  id?: string | number;
  invoiceNumber?: string;
  customerId?: string | number;
  customerName?: string;
  invoiceDate?: string;
  netAmount?: number;
  grossAmount?: number;
};

type WeclappResponse = {
  result?: WeclappInvoice[];
};

function getWeclappBaseUrl() {
  const baseUrl = process.env.WECLAPP_BASE_URL;
  if (!baseUrl) {
    throw new Error("WECLAPP_BASE_URL fehlt");
  }
  return baseUrl.replace(/\/$/, "");
}

function getWeclappToken() {
  const token = process.env.WECLAPP_API_TOKEN;
  if (!token) {
    throw new Error("WECLAPP_API_TOKEN fehlt");
  }
  return token;
}

export async function fetchWeclappInvoices(): Promise<WeclappInvoice[]> {
  const baseUrl = getWeclappBaseUrl();
  const token = getWeclappToken();

  const url = `${baseUrl}/webapp/api/v1/salesInvoice?page=1&pageSize=1000`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      AuthenticationToken: token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weclapp Fehler ${res.status}: ${text}`);
  }

  const data = (await res.json()) as WeclappResponse;
  return data.result ?? [];
}
