// BROKEN LORD KING – Global Offline Carrier Lookup API

const countries = {
  TZ: {
    name: "Tanzania",
    code: "+255",
    local_length: 10,
    prefixes: {
      vodacom: ["075", "076"],
      airtel: ["068", "078"],
      tigo: ["065", "071", "067"],
      halotel: ["062"],
      zantel: ["077"]
    }
  },
  KE: {
    name: "Kenya",
    code: "+254",
    local_length: 10,
    prefixes: {
      safaricom: ["070", "071", "072", "074"],
      airtel: ["073", "075"],
      telkom: ["077"]
    }
  },
  UG: {
    name: "Uganda",
    code: "+256",
    local_length: 10,
    prefixes: {
      mtn: ["077", "078"],
      airtel: ["070", "075"],
      africell: ["079"]
    }
  },
  NG: {
    name: "Nigeria",
    code: "+234",
    local_length: 10,
    prefixes: {
      mtn: ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903"],
      glo: ["0805", "0807", "0705", "0815", "0811", "0905"],
      airtel: ["0802", "0808", "0708", "0812", "0701", "0902", "0907", "0901"],
      etisalat: ["0809", "0817", "0818", "0909", "0908"]
    }
  },
  ZA: {
    name: "South Africa",
    code: "+27",
    local_length: 9,
    prefixes: {
      vodacom: ["072", "076", "079", "082", "084"],
      mtn: ["073", "078", "083"],
      cellc: ["074", "084"],
      telkom: ["081"]
    }
  }
};

// Detect country by code
function detectCountry(digits) {
  for (const key in countries) {
    const c = countries[key];
    const cc = c.code.replace("+", "");
    if (digits.startsWith(cc)) return c;
  }
  return null;
}

// Format number
function formatNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  const country = detectCountry(digits);

  if (!country) {
    const local = digits.slice(-10);
    return {
      country: { name: "Unknown", code: "+" + digits.slice(0, digits.length - local.length) },
      local,
      international: "+" + digits
    };
  }

  const cc = country.code.replace("+", "");
  let local;

  if (digits.startsWith(cc)) {
    local = "0" + digits.slice(cc.length);
  } else if (digits.startsWith("0")) {
    local = digits;
  } else {
    local = "0" + digits.slice(-country.local_length + 1);
  }

  return {
    country,
    local,
    international: country.code + local.slice(1)
  };
}

// Detect carrier
function detectCarrier(country, local) {
  if (!country.prefixes) return { carrier: "unknown", prefix: local.slice(0, 3) };

  const p4 = local.slice(0, 4);
  const p3 = local.slice(0, 3);

  for (const carrier in country.prefixes) {
    const list = country.prefixes[carrier];
    if (list.includes(p4)) return { carrier, prefix: p4 };
    if (list.includes(p3)) return { carrier, prefix: p3 };
  }

  return { carrier: "unknown", prefix: p3 };
}

// Vercel handler
export default function handler(req, res) {
  const { phone } = req.query;

  const apiName = "BROKEN LORD KING – Global Offline Carrier Lookup API";

  if (!phone) {
    return res.status(200).json({
      api: apiName,
      author: "Lord Broken",
      description: "Global offline carrier lookup. No API key required.",
      usage: "Add ?phone=NUMBER",
      example: `https://${req.headers.host}/api/lookup?phone=+2557XXXXXXX`
    });
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) {
    return res.status(200).json({
      api: apiName,
      valid: false,
      reason: "Phone number too short",
      phone
    });
  }

  const { country, local, international } = formatNumber(phone);

  if (country.name !== "Unknown" && local.length !== country.local_length) {
    return res.status(200).json({
      api: apiName,
      valid: false,
      reason: "Invalid number length for " + country.name,
      phone,
      country: country.name,
      local_format: local,
      international_format: international
    });
  }

  const { carrier, prefix } = detectCarrier(country, local);

  return res.status(200).json({
    api: apiName,
    author: "Lord Broken",
    valid: true,
    phone,
    country: country.name,
    country_code: country.code,
    carrier,
    prefix,
    line_type: "mobile",
    local_format: local,
    international_format: international
  });
}
