// BROKEN LORD KING – Global-Ready Offline Carrier Lookup API
// Vercel serverless function

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
  },
  US: {
    name: "United States",
    code: "+1",
    local_length: 10,
    prefixes: {}
  },
  GB: {
    name: "United Kingdom",
    code: "+44",
    local_length: 10,
    prefixes: {}
  },
  IN: {
    name: "India",
    code: "+91",
    local_length: 10,
    prefixes: {}
  }
  // You can keep extending this map for more countries & carriers
};

function detectCountry(digits) {
  for (const key in countries) {
    const c = countries[key];
    const cc = c.code.replace("+", "");
    if (digits.startsWith(cc)) {
      return c;
    }
  }
  return null;
}

function formatNumber(phone) {
  const digits = phone.replace(/\D/g, "");

  let country = detectCountry(digits);

  if (!country) {
    // Fallback: assume last 10 digits as local, generic world
    const local = digits.length > 10 ? digits.slice(-10) : digits;
    const international = "+" + digits;
    return {
      country: {
        name: "Unknown",
        code: "+" + digits.slice(0, digits.length - local.length)
      },
      local,
      international
    };
  }

  const cc = country.code.replace("+", "");
  let local;

  if (digits.startsWith(cc)) {
    local = digits.slice(cc.length);
    if (!local.startsWith("0")) local = "0" + local;
  } else if (digits.startsWith("0")) {
    local = digits;
  } else {
    local = "0" + digits.slice(-country.local_length + 1);
  }

  const international = country.code + local.slice(1);

  return { country, local, international };
}

function detectCarrierFromPrefixes(country, local) {
  if (!country.prefixes || Object.keys(country.prefixes).length === 0) {
    return { carrier: "unknown", prefix: local.slice(0, 3) };
  }

  // Try 4-digit then 3-digit prefix (for countries like Nigeria)
  const p4 = local.slice(0, 4);
  const p3 = local.slice(0, 3);

  for (const carrier in country.prefixes) {
    const list = country.prefixes[carrier];
    if (list.includes(p4) || list.includes(p3)) {
      return { carrier, prefix: list.includes(p4) ? p4 : p3 };
    }
  }

  return { carrier: "unknown", prefix: p4 };
}

export default function handler(req, res) {
  const { phone } = req.query;

  const apiName = "BROKEN LORD KING – Global-Ready Offline Carrier Lookup API";

  if (!phone) {
    return res.status(200).json({
      api: apiName,
      author: "Lord Broken",
      description:
        "Offline, no-key carrier lookup based on prefix mapping. Global-ready with detailed mapping for key countries.",
      usage: "Append ?phone=NUMBER to this URL",
      example: `https://${req.headers.host}/api/lookup?phone=+2557XXXXXXX`,
      note:
        "If country or carrier is not mapped, response will still include normalized formats but carrier may be 'unknown'."
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

  // Validate length if known
  if (country.name !== "Unknown" && local.length !== country.local_length) {
    return res.status(200).json({
      api: apiName,
      author: "Lord Broken",
      valid: false,
      reason: "Invalid local length for " + country.name,
      phone,
      country: country.name,
      country_code: country.code,
      local_format: local,
      international_format: international
    });
  }

  const { carrier, prefix } =
    country.name === "Unknown"
      ? { carrier: "unknown", prefix: local.slice(0, 3) }
      : detectCarrierFromPrefixes(country, local);

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
