require("dotenv").config();
const Groq = require("groq-sdk");
const Land = require("../models/Land");

/* ─────────────────────────────────────────────────────────────────
   ACTUAL DB VALUES (from LandForm.js / constants/index.js):
   mainCategory : "House" | "Land" | "Room" | "Commercial"
   subCategory  : "Apartment / Flat" | "House / Villa" | "Bungalow" | "Townhouse"
                  "Agricultural Land" | "Residential Land" | "Commercial Land"
                  "Room - Living" | "Room - Office" | "Room - Storage"
                  "Shop / Showroom" | "Office Space" | "Warehouse" | "Restaurant Space"
   category     : legacy field — "Residential" | "Commercial" | "Agricultural" | "House" | ""
   ───────────────────────────────────────────────────────────────── */

/* ── Intent detection — triggers a DB search ───────────────── */
const SEARCH_INTENT_REGEX =
  /\b(find|search|looking for|want|need|show|any|available|list|suggest|recommend|give me|is there|are there|rent|buy|sale|lease|purchase|flat|flats|apartment|apartments|room|rooms|house|houses|office|offices|shop|shops|land|lands|khet|pasal|ghar|kotha|bhada|property|properties|listing|listings|real estate|kathmandu|ktm|pokhara|chitwan|lalitpur|bhaktapur|butwal|biratnagar|birgunj|dharan|hetauda|nepalgunj|thamel|jhamsikhel|lazimpat|kirtipur|balkhu|lakeside|birauta|narayanghat|bharatpur|bhairahawa|damak|itahari|jhapa|rupandehi|nawalpur|sunsari|morang|banke|kavrepalanchok|sindhupalchok|dhading|nuwakot|makwanpur|baglung|parbat|gulmi|palpa|syangja|tanahun|gorkha|lamjung|bardiya|surkhet|dailekh|salyan|rukum|rolpa|pyuthan|naxal|kapan|mandikhatar|birtamode|nagarkot|patan|ekatabhasti|agricultural|residential|commercial|bungalow|villa|duplex|studio|pg|paying guest)\b/i;

/* ── Follow-up intent ───────────────────────────────────────── */
const FOLLOWUP_INTENT_REGEX =
  /\b(more|another|other|different|cheaper|expensive|bigger|smaller|show more|any more|anything else|other options|alternatives|similar|nearby|close to|around|within)\b/i;

/* ── Parse budget ceiling from natural language ─────────────── */
function parseBudgetCeiling(message) {
  const patterns = [
    /(?:under|below|max|maximum|less than|upto|up to|within)\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?/i,
    /(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?\s*(?:budget|max|maximum|or less|and below)/i,
    /budget\s*(?:of|is|:)?\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(k|thousand|lakh)?/i,
  ];
  for (const pat of patterns) {
    const m = message.match(pat);
    if (m) {
      let val = parseInt(m[1].replace(/,/g, ""), 10);
      const unit = (m[2] || "").toLowerCase();
      if (unit === "k" || unit === "thousand") val *= 1000;
      if (unit === "lakh") val *= 100000;
      if (val > 0) return val;
    }
  }
  return null;
}

/* ── Map user intent → actual DB mainCategory + subCategory ─── */
function mapToDbCategories(lower) {
  const mainCats = new Set();
  const subCats  = new Set();

  // House / flat / apartment / villa / bungalow
  if (/\b(house|houses|ghar|villa|bungalow|townhouse|home|duplex|studio)\b/.test(lower)) {
    mainCats.add("House");
    if (/\b(villa)\b/.test(lower))     subCats.add("House / Villa");
    if (/\b(bungalow)\b/.test(lower))  subCats.add("Bungalow");
    if (/\b(townhouse)\b/.test(lower)) subCats.add("Townhouse");
    if (/\b(duplex)\b/.test(lower))    subCats.add("Duplex");
    if (/\b(studio)\b/.test(lower))    subCats.add("Studio Apartment");
    if (!subCats.size) subCats.add("House / Villa");
  }
  if (/\b(flat|flats|apartment|apartments|bhk|1bhk|2bhk|3bhk)\b/.test(lower)) {
    mainCats.add("House");
    subCats.add("Apartment / Flat");
  }

  // Room / kotha / pg
  if (/\b(room|rooms|kotha|single room|double room|pg|paying guest)\b/.test(lower)) {
    mainCats.add("Room");
    if (/\b(office)\b/.test(lower))           subCats.add("Room - Office");
    else if (/\b(storage|store)\b/.test(lower)) subCats.add("Room - Storage");
    else if (/\b(pg|paying guest)\b/.test(lower)) subCats.add("PG / Paying Guest");
    else subCats.add("Room - Living");
  }

  // Land / khet
  if (/\b(land|lands|khet|plot|agricultural|farming|farm|agri|residential land|commercial land)\b/.test(lower)) {
    mainCats.add("Land");
    if (/\b(agri|agricultural|farming|farm|khet|crop)\b/.test(lower)) subCats.add("Agricultural Land");
    else if (/\b(commercial)\b/.test(lower)) subCats.add("Commercial Land");
    else subCats.add("Residential Land");
  }

  // Commercial / office / shop
  if (/\b(commercial|office|offices|shop|shops|pasal|showroom|warehouse|restaurant|store)\b/.test(lower)) {
    mainCats.add("Commercial");
    if (/\b(office|offices)\b/.test(lower))          subCats.add("Office Space");
    if (/\b(shop|shops|showroom|pasal)\b/.test(lower)) subCats.add("Shop / Showroom");
    if (/\b(warehouse|storage)\b/.test(lower))        subCats.add("Warehouse");
    if (/\b(restaurant)\b/.test(lower))               subCats.add("Restaurant Space");
  }

  return { mainCats: [...mainCats], subCats: [...subCats] };
}

/* ── Extract locations from message ────────────────────────── */
function extractLocations(lower) {
  const locationList = [
    "aadarsha", "aalital", "aamchowk", "aathabis", "aathbiskot", "aathrai", "aathrai tribeni", "achham", "adanchuli", "adarsha kotwal", "agnisair krishna savaran", "aiselukharka", "ajayameru", "amargadhi", "annapurna", "apihimal", "arghakhanchi", "arjunchaupari", "arjundhara", "arughat", "aurahi", "babai", "badhaiyatal", "badikedar", "badimalika", "bagchaur", "baglung", "bagmati", "bagnaskali", "bahudarmai", "baijanath", "baitadi", "bajhang", "bajura", "bakaiya", "balaju", "balan-bihul", "balara", "balephi", "baluwatar", "balwa", "bandipur", "banepa", "baneshwor", "banfikot", "bangad kupinde", "banganga", "banglachuli", "banke", "bannigadhi jayagadh", "bansgadhi", "bara", "baragadhi", "barahakshetra", "barahapokhari", "barahathawa", "barbardiya", "bardaghat", "bardibas", "bardiya", "barekot", "bareng", "bariyarpatti", "barpak sulikot", "basbariya", "bateshwor", "baudhimai", "bedkot", "belaka", "belauri", "belbari", "belhi chapena", "belkotgadhi", "beni", "besisahar", "bhadrapur", "bhagawanpur", "bhagawatimai", "bhageshwor", "bhairahawa", "bhajani", "bhaktapur", "bhangaha", "bharatpur", "bharatpur-10", "bharatpur-11", "bheri", "bheriganga", "bhimad", "bhimdatta", "bhimeshwor", "bhimphedi", "bhimsen", "bhirkot", "bhojpur", "bhokraha narsingh", "bhotekoshi", "bhume", "bhumikasthan", "bideha", "bidur", "bigu", "bihadi", "binayi tribeni", "bindabasini", "biratnagar", "birauta", "birendranagar", "birgunj", "birtamode", "biruwa", "bishnu", "bishnupur", "bithmore", "bode", "bode barsain", "bogtan fudsil", "bouddha", "bramhapuri", "brindaban", "buddhabhumi", "buddhashanti", "budhanilkantha", "budhiganga", "budinanda", "bulingtar", "bungal", "bungamati", "butwal", "byans", "byas", "chabahil", "chainpur", "chakraghatta", "chakrapur", "chame", "chamje", "champadevi", "chamunda bindrasaini", "chandannath", "chandrakot", "chandranagar", "chandrapur", "changunarayan", "chankheli", "chapagaun", "chapakot", "charikot", "chaudandigadhi", "chaukune", "chaurjahari", "chaurpati", "chautara", "chharka tangsong", "chhathar", "chhathar jorpati", "chhatradev", "chhayanath rara", "chhedagad", "chhededaha", "chhinnamasta", "chhipaharmai", "chhireshwornath", "chipledhunga", "chisankhugadhi", "chitwan", "chum nubri", "chure", "dadeldhura", "dailekh", "dakneshwori", "dallu", "damak", "damauli", "dang", "dangisharan", "darchula", "darma", "dasharathchand", "deumai", "devahi gonahi", "devchuli", "devdaha", "devghat", "devtal", "dewanganj", "dhakari", "dhanauji", "dhangadhi", "dhangadhimai", "dhankaul", "dhankuta", "dhanpalthan", "dhanusha", "dharan", "dharche", "dharmadevi", "dhaulagiri", "dhobini", "dhorpatan", "dhulikhel", "dhunche", "dibyanagar", "diktel rupakot majhuwagadhi", "dilasaini", "dipayal silgadhi", "diprung chuichumma", "dogdakedar", "dolakha", "dolpa", "dolpo buddha", "doramba", "dordi", "doti", "dudhauli", "dudhkunda", "dudhpokhari", "duduwa", "duhabi", "duhun", "dullu", "dungeshwor", "dupcheshwar", "durga bhagwati", "durgathali", "ekantakuna", "ekdara", "falgunanda", "fedap", "gadhawa", "gadhi", "gadhimai", "gaidahawa", "gaindakot", "galkot", "galyang", "gandaki", "ganeshman charnath", "ganyapdhura", "garuda", "gaumukhi", "gaumul", "gaur", "gauradaha", "gauriganga", "gaurishankar", "gaushala", "geruwa", "gharapjhong", "ghiring", "ghodaghodi", "ghorahi", "godaita", "godawari", "gokulganga", "golanjor", "golbazar", "gongabu", "gorkha", "gosaikunda", "gramthan", "gujara", "gulariya", "gulmi", "gulmi darbar", "gurans", "gurbhakot", "guthichaur", "haldibari", "halesi tuwachung", "hans pur", "hansapur", "hanumannagar kankalini", "hariharpurgadhi", "harinagar", "harinas", "haripur", "haripurwa", "harisiddhi", "hatuwagadhi", "helambu", "hemja", "hetauda", "hilihang", "hima", "himali", "humla", "hupsekot", "ichchhakamana", "ilam", "imadol", "inaruwa", "indrasarowar", "indrawati", "ishanath", "ishworpur", "isma", "itahari", "jagannath", "jagarnathpur", "jagdulla", "jahada", "jaimini", "jajarkot", "jaleshwor", "jaljala", "janaki", "janaknandini", "janakpur", "janki", "jantedhunga", "jawalakhel", "jayaprithivi", "jhamsikhel", "jhapa", "jhimruk", "jirabhawani", "jiri", "jitpur simara", "jomsom", "jorayal", "jorpati", "joshipur", "jugal", "jumla", "junichande", "k.i.singh", "kabilasi", "kaike", "kailali", "kailari", "kailash", "kakani", "kalaiya", "kalanki", "kaligandaki", "kalika", "kalikamai", "kalikot", "kalimati", "kalinchok", "kamal", "kamala", "kamalamai", "kanakasundari", "kanchanpur", "kanchanrup", "kanepokhari", "kankai", "kanthekhola", "kapan", "kapilvastu", "kapurkot", "karaiyamai", "karjanha", "karnali", "kaski", "katahariya", "katari", "kathmandu", "katunje", "kavrepalanchok", "kawasoti", "kechana kavrelung", "kepilasgadhi", "kerabari", "khadak", "khajura", "khandachakra", "khandadevi", "khandbari", "khaptad chhanna", "kharpunath", "khatyad", "khijidemba", "khokana", "khopasi", "khotang", "khotehang", "khumbu pasanglhamu", "kirtipur", "kispang", "kohalpur", "kolhabi", "koshi", "kotahimai", "koteshwor", "krishnanagar", "krishnapur", "ktm", "kumakh", "kummayak", "kupondole", "kuse", "kushma", "kwholasothar", "lagankhel", "lahan", "lakeside", "lakshminiya", "lalbandi", "laligurans", "lalitpur", "laljhadi", "lamahi", "lamatar", "lamidanda", "lamjung", "lamkichuha", "lazimpat", "lekam", "lekbeshi", "lekhnath", "letang", "likhu", "likhu tamakoshi", "lisankhu pakhar", "lo-ghekar damodarkunda", "loharpatti", "lokanthali", "lomanthang", "lubhu", "lumbini", "lumbini sanskritik", "lungri", "machhapuchchhre", "madhav narayan", "madhesh", "madhuwan", "madhyabindu", "madhyapur thimi", "madi", "mahabu", "mahadeva", "mahagadhimai", "mahakali", "mahakulung", "mahalaxmi", "maharajgunj", "mahashila", "mahawai", "mahendranagar", "mahendrapul", "mahottari", "maijogmai", "maiwakhola", "makalu", "makwanpur", "malangwa", "malarani", "malika", "mallarani", "manahari", "manang", "manara shiswa", "mandan deupur", "mandikhatar", "manebhanjyang", "mangala", "mangalbazar", "mangalsen", "mangsebung", "manthali", "marchawari", "marma", "marsyangdi", "masta", "mathagadhi", "matihani", "maulapur", "mayadevi", "mechinagar", "meghauli", "melamchi", "melauli", "mellekh", "melung", "menchhayayem", "miklajung", "mikwakhola", "mirchaiya", "mithila", "mithila bihari", "modi", "mohanyal", "molung", "morang", "mudkechula", "mugu", "mugum karmarong", "mukhiyapatti musarmiya", "mulpani", "musikot", "mustang", "myagde", "myagdi", "myanglung", "nagarain", "nagarkot", "nala", "nalgad", "namkha", "namobuddha", "naraharinath", "narainapur", "narayan", "narayanghat", "narayanthan", "narpa bhumi", "narphu", "nasong", "naubahini", "naugad", "naukunda", "naumule", "nawadurga", "nawalparasi west", "nawalpur", "nawarajpur", "naxal", "necha salyan", "nepalgunj", "nijgadh", "nisdi", "nisikhola", "nuwakot", "okhaldhunga", "omsatiya", "pachaljharana", "pacharauta", "painyu", "pakaha mainpur", "pakhribas", "palata", "palhinandan", "palpa", "palungtar", "panauti", "panchadeval binayak", "panchapuri", "pancheshwor", "panchkhal", "panchkhapan", "panchthar", "pandav gufa", "panini", "parashuram", "parbat", "pariwartan", "paroha", "parsa", "parsagadhi", "pashupati", "patan", "patarasi", "paterwa sugauli", "paterwasugauli", "pathari shanischare", "pathivara yangwarak", "pauwadungma", "phalelung", "phalewas", "phatepur", "phatuwa bijayapur", "phedap", "phedikhola", "pheta", "phidim", "phungling", "pipra", "pokhara", "pokhara-1", "pokhara-2", "pokhara-3", "pokhariya", "prasauni", "pratappur", "prithvichowk", "pulchowk", "punarbas", "purbichauki", "purchaudi", "putalibazar", "putha uttarganga", "pyuthan", "raghuganga", "rainadevi chhahara", "rainas", "rajapur", "rajbiraj", "rajdevi", "rajgadh", "rajpur", "raksirang", "ramaroshan", "rambha", "ramche", "ramdhuni", "ramechhap", "ramgopalpur", "ramgram", "ramnagar", "ramprasad rai", "rampur", "rangeli", "rapti", "raptisonari", "raskot", "rasuwa", "ratnanagar", "ratuwamai", "rautahat", "rautamai", "rawabesi", "resunga", "rhishing", "ribdikot", "rohini", "rolpa", "rong", "roshi", "rukum east", "rukum west", "runtigadhi", "rupa", "rupandehi", "rupani", "ruru", "sabaila", "sabhapokhari", "sahidnagar", "sailung", "sainamaina", "sakhuwanankarkatti", "sallaghari", "salpasilichho", "salyan", "samsi", "sandakpur", "sandhikharka", "sanepa", "sangurigadhi", "sanibheri", "sankhuwasabha", "sanni triveni", "sanphebagar", "saptari", "sarankot", "sarkegad", "sarlahi", "sarumarani", "satdobato", "satyawati", "sauraha", "sayal", "shadananda", "shahidbhumi", "shahidnagar", "shailyashikhar", "shambhunath", "shantinagar", "sharada", "shikhar", "shivanath", "shivapur", "shivapuri", "shivaraj", "shivasataxi", "shiwalaya", "shubha kalika", "shuklagandaki", "shuklaphanta", "siddha kumakh", "siddharthanagar", "siddhicharan", "sigas", "silichong", "simalchaur", "simkot", "simraungadh", "simta", "sindhuli", "sindhupalchok", "sinja", "sipadol", "siraha", "sirijangha", "sitapaila", "sitganga", "siyari", "solu dudhkunda", "solukhumbu", "sonama", "soru", "sotang", "suddhodhan", "sudhdhodhan", "sudurpashchim", "sukedhara", "sukhipur", "sunakothi", "sunapati", "sunchhahari", "sundar haraicha", "sundarbazar", "sundarpur", "sunkoshi", "sunsari", "sunwal", "surkhet", "surma", "surnaya", "surunga", "suryabinayak", "suryagadhi", "suryapatuwa", "suryodaya", "susta", "suwarna", "swami kartik khapar", "swargadwari", "swayambhu", "syangja", "tadi", "talkot", "tamakoshi", "taman", "tamghas", "tanahu", "tanjakot", "tansen", "taplejung", "tara hill", "tarakeshwor", "tatopani", "taulihawa", "temal", "terhathum", "thabang", "thaha", "thakurbaba", "thalara", "thamel", "thankot", "thantikandh", "thasang", "thori", "thuli bheri", "thulung dudhkunda", "tikapur", "tikathali", "tila", "tilagufa", "tilathi koiladi", "tilottama", "tinau", "tinpatan", "tokha", "tribeni", "tripurasundari", "triveni", "triyuga", "tsum nubri", "tulsipur", "tumbewa", "turmakhand", "tyamke yuwa", "udayapur", "udayapurgadhi", "udhyogpur", "umakunda", "urlabari", "vedpu", "waling", "yamunamai", "yangwarak", "yashodhara"
  ];
  const found = locationList.filter(loc => {
    // match as whole word to avoid false positives
    const re = new RegExp(`\\b${loc}\\b`, "i");
    return re.test(lower);
  });
  // Normalise ktm → kathmandu
  const normalised = found.map(l => l === "ktm" ? "kathmandu" : l);
  return [...new Set(normalised)];
}

/* ── Smart DB search — returns exact + suggestions separately ─── */
async function searchDatabase(message, conversationContext = "") {
  try {
    const fullContext = (conversationContext + " " + message).trim();
    const lower = fullContext.toLowerCase();

    const locations = extractLocations(lower);
    const { mainCats, subCats } = mapToDbCategories(lower);
    const budget = parseBudgetCeiling(fullContext);

    // ── Build category OR clauses ──────────────────────────────
    const catOrClauses = [];
    if (mainCats.length > 0) {
      mainCats.forEach(mc => {
        catOrClauses.push({ mainCategory: new RegExp(`^${mc}$`, "i") }, { category: new RegExp(`^${mc}$`, "i") });
      });
    }
    if (subCats.length > 0) {
      subCats.forEach(sc => {
        catOrClauses.push({ subCategory: new RegExp(sc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") });
      });
    }
    // Legacy category mappings
    if (/\b(land|lands|khet|plot|farm|agri)\b/.test(lower)) {
      catOrClauses.push({ category: /residential/i }, { category: /agricultural/i }, { title: /\bland\b/i }, { title: /\bfarm\b/i });
    }
    if (/\b(house|houses|flat|flats|apartment|apartments|ghar|bhk)\b/.test(lower)) {
      catOrClauses.push({ category: /residential/i }, { category: /house/i });
    }
    if (/\b(shop|shops|office|offices|commercial|pasal)\b/.test(lower)) {
      catOrClauses.push({ category: /commercial/i });
    }
    if (/\b(room|rooms|kotha|pg)\b/.test(lower)) {
      catOrClauses.push({ mainCategory: /^Room$/i }, { subCategory: /room/i });
    }

    // ── Build location OR clauses ──────────────────────────────
    const locOrClauses = [];
    if (locations.length > 0) {
      locations.forEach(loc => {
        const pattern = loc === "kathmandu" ? "kathmandu|ktm" : loc;
        const r = new RegExp(pattern, "i");
        locOrClauses.push({ location: r }, { city: r }, { district: r }, { province: r }, { title: r });
      });
    }

    const baseFilter = { status: "approved", available: true };
    if (budget) baseFilter.price = { $lte: budget };

    // ── EXACT: location + category match ──────────────────────
    let exactResults = [];
    if (locOrClauses.length > 0 && catOrClauses.length > 0) {
      exactResults = await Land.find({ ...baseFilter, $and: [{ $or: locOrClauses }, { $or: catOrClauses }] })
        .sort({ featured: -1, createdAt: -1 }).limit(6)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    // If no budget match, retry without budget
    if (exactResults.length === 0 && budget && locOrClauses.length > 0 && catOrClauses.length > 0) {
      exactResults = await Land.find({ status: "approved", available: true, $and: [{ $or: locOrClauses }, { $or: catOrClauses }] })
        .sort({ featured: -1, createdAt: -1 }).limit(6)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    // Location only (no category specified)
    if (exactResults.length === 0 && locOrClauses.length > 0 && catOrClauses.length === 0) {
      exactResults = await Land.find({ ...baseFilter, $or: locOrClauses })
        .sort({ featured: -1, createdAt: -1 }).limit(6)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    // Category only (no location specified)
    if (exactResults.length === 0 && catOrClauses.length > 0 && locOrClauses.length === 0) {
      exactResults = await Land.find({ ...baseFilter, $or: catOrClauses })
        .sort({ featured: -1, createdAt: -1 }).limit(6)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    // ── SUGGESTIONS: same category, DIFFERENT location ─────────
    let suggestions = [];
    if (catOrClauses.length > 0) {
      const exactIds = exactResults.map(r => r._id);
      const suggQuery = { status: "approved", available: true, $or: catOrClauses };
      if (exactIds.length > 0) suggQuery._id = { $nin: exactIds };
      // Exclude the exact location from suggestions
      if (locOrClauses.length > 0) {
        // Build negative location filter — exclude docs that match the searched location
        const locExclude = locations.map(loc => {
          const pattern = loc === "kathmandu" ? "kathmandu|ktm" : loc;
          return new RegExp(pattern, "i");
        });
        suggQuery.$and = [
          { $or: catOrClauses },
          { city: { $not: locExclude[0] } },
          { district: { $not: locExclude[0] } },
          { location: { $not: locExclude[0] } },
        ];
        delete suggQuery.$or;
      }
      suggestions = await Land.find(suggQuery)
        .sort({ featured: -1, createdAt: -1 }).limit(4)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    // If nothing at all, show latest as suggestions
    if (exactResults.length === 0 && suggestions.length === 0) {
      suggestions = await Land.find({ status: "approved", available: true })
        .sort({ featured: -1, createdAt: -1 }).limit(4)
        .select("title location city district province price category mainCategory subCategory image areaSize featured _id");
    }

    return {
      exactFound: exactResults.length > 0,
      exactResults,
      suggestions,
      searchedLocation: locations[0] || null,
      searchedCategory: mainCats[0] || subCats[0] || null,
    };
  } catch (err) {
    console.error("DB search error:", err.message);
    return { exactFound: false, exactResults: [], suggestions: [], searchedLocation: null, searchedCategory: null };
  }
}

/* ── Build rich context string for the AI ───────────────────── */
function buildDbContext(exactFound, exactResults, suggestions, searchedLocation, searchedCategory) {
  const locLabel = searchedLocation ? searchedLocation.charAt(0).toUpperCase() + searchedLocation.slice(1) : "requested location";
  const catLabel = searchedCategory || "property";

  if (!exactFound && suggestions.length === 0) {
    return `\n\nDB_SEARCH_RESULTS: NOTHING FOUND anywhere. Say "We don't have any ${catLabel} listings right now." Never suggest external websites.`;
  }

  let ctx = "";

  if (!exactFound) {
    ctx += `\n\nDB_EXACT_RESULTS: NONE FOUND in ${locLabel} for ${catLabel}. Tell the user we don't have exact matches in ${locLabel} right now.`;
  } else {
    ctx += `\n\nDB_EXACT_RESULTS (${exactResults.length} matches in ${locLabel} — DO NOT list as bullets, just say count and "check the cards below"):\n`;
    ctx += exactResults.map((p, i) => {
      const loc = [p.city, p.district].filter(Boolean).join(", ") || p.location || "Nepal";
      return `${i+1}. "${p.title}" — ${loc} | Rs.${parseInt(p.price||0).toLocaleString()} | ${p.subCategory||p.mainCategory||p.category} | ${p.areaSize||"N/A"} | ID:${p._id}`;
    }).join("\n");
  }

  if (suggestions.length > 0) {
    ctx += `\n\nDB_SUGGESTIONS (similar ${catLabel} in other cities — show as "Explore more options" section):\n`;
    ctx += suggestions.map((p, i) => {
      const loc = [p.city, p.district].filter(Boolean).join(", ") || p.location || "Nepal";
      return `${i+1}. "${p.title}" — ${loc} | Rs.${parseInt(p.price||0).toLocaleString()} | ${p.subCategory||p.mainCategory||p.category} | ID:${p._id}`;
    }).join("\n");
  }

  ctx += `\n\nINSTRUCTION: Never list property details as bullet points. Just reference the card sections. Keep reply under 100 words.`;
  return ctx;
}

/* ── System prompt ──────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are ProperAgent, a smart and friendly AI assistant for ProperEstate — Nepal's broker-free real estate platform.

PERSONALITY: Warm, helpful, conversational. Talk like a knowledgeable friend, not a robot.

PROPERTY CATEGORIES ON THIS PLATFORM:
- House → sub-types: "Apartment / Flat", "House / Villa", "Bungalow", "Townhouse"
- Land → sub-types: "Agricultural Land", "Residential Land", "Commercial Land"
- Room → sub-types: "Room - Living", "Room - Office", "Room - Storage"
- Commercial → sub-types: "Shop / Showroom", "Office Space", "Warehouse", "Restaurant Space"

NEPAL RENTAL PRICES (2025 reference):
- Kathmandu: Room Rs.6k-18k/mo, Apartment/Flat Rs.15k-50k/mo, House Rs.25k-80k/mo, Office Rs.40-150/sqft/mo
- Pokhara: Room Rs.5k-12k/mo, Flat Rs.12k-35k/mo
- Chitwan: Room Rs.4k-9k/mo, Flat Rs.10k-22k/mo
- Butwal/Bhairahawa: Room Rs.3.5k-8k/mo, Flat Rs.8k-18k/mo
- Biratnagar: Room Rs.4k-10k/mo, Flat Rs.10k-22k/mo

PLATFORM INFO: ProperEstate is 100% broker-free. Buyers pay Rs.5000 eSewa deposit. Sellers need ID + admin approval.

NEPALI TERMS: kotha=room, ghar=house, khet=agri land, pasal=shop, bhada=rent.

STRICT RULES — FOLLOW EXACTLY:
1. When DB_SEARCH_RESULTS has listings → DO NOT list them as bullet points in your text. Instead say something like "I found X properties for you — check the clickable cards below!" Then add a brief helpful note. The cards are shown automatically.
2. When DB_SEARCH_RESULTS says "closest available" → be honest: say exact match wasn't found, these are the closest we have shown as cards below, ask if they want to refine.
3. When DB_SEARCH_RESULTS says "NOTHING FOUND" → say exactly "We don't have that in our database right now." Then ask if they want to try different criteria. NEVER EVER suggest Hamrobazar, Gharbazar, realestate.com.np, Saugat Homes, or ANY other website. This is a hard rule with no exceptions.
4. NEVER mention any external website under any circumstances. Only ProperEstate.
5. NEVER repeat property details (title, price, location) in your text reply — the cards already show all that. Just reference them as "the cards below".
6. For casual chat → answer naturally without forcing real estate.
7. Always end with a helpful follow-up question or next step.
8. Keep replies under 150 words.`;

/* ── Controller ─────────────────────────────────────────────── */
const aiAdvisor = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, reply: "No messages provided." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, reply: "AI service is not configured." });
    }

    const lastMessage = messages[messages.length - 1].content || "";

    // Collect recent user messages for follow-up context
    const recentUserMessages = messages
      .filter(m => m.role === "user")
      .slice(-5)
      .map(m => m.content)
      .join(" ");

    const isFollowUp = FOLLOWUP_INTENT_REGEX.test(lastMessage) && recentUserMessages.length > 15;
    const shouldSearch = SEARCH_INTENT_REGEX.test(lastMessage) || isFollowUp;

    let dbContext = "";
    let dbResults = [];

    if (shouldSearch) {
      const searchText = isFollowUp && !SEARCH_INTENT_REGEX.test(lastMessage)
        ? recentUserMessages
        : lastMessage;

      const { exactFound, exactResults, suggestions, searchedLocation, searchedCategory } = await searchDatabase(
        searchText,
        isFollowUp ? recentUserMessages : ""
      );
      console.log(`[AI Search] query="${searchText.slice(0,60)}" exact=${exactResults.length} sugg=${suggestions.length} loc=${searchedLocation} cat=${searchedCategory}`);
      dbResults = { exact: exactResults, suggestions };
      dbContext = buildDbContext(exactFound, exactResults, suggestions, searchedLocation, searchedCategory);
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + dbContext },
        ...messages.slice(-14),
      ],
      max_tokens: 650,
      temperature: 0.65,
    });

    const rawReply = completion.choices[0]?.message?.content
      || "I couldn't generate a response. Please try again.";

    // Hard filter — strip any external site suggestions the LLM might still include
    const BANNED_SITES = [
      /hamrobazar\.com/gi, /gharbazar\.com/gi, /realestate\.com\.np/gi,
      /saugathomes\.com/gi, /saugat homes/gi,
      // Remove bullet lines that mention these sites
      /[•\-\*]\s*.*?(hamrobazar|gharbazar|realestate\.com\.np|saugat homes).*?\n?/gi,
    ];
    let reply = rawReply;
    BANNED_SITES.forEach(pat => { reply = reply.replace(pat, ""); });
    // Clean up any "external websites" / "other websites" sentences left behind
    reply = reply
      .replace(/I can suggest some external websites[^.]*\./gi, "")
      .replace(/You can (also )?try (searching on )?these (external |other )?websites?[^.]*\./gi, "")
      .replace(/Here are some (external |other )?websites?[^:]*:[^]*?(?=\n\n|\n[A-Z]|$)/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    res.json({
      success: true,
      reply,
      properties: dbResults.exact || [],
      suggestions: dbResults.suggestions || [],
    });

  } catch (err) {
    console.error("❌ Groq API error:", err.message);
    res.status(500).json({
      success: false,
      reply: "Something went wrong. Please try again in a moment.",
    });
  }
};

module.exports = { aiAdvisor };
