export interface Stakeholder {
  id: string;
  name: string;
  shortName: string;
  level: 'International' | 'National' | 'Provincial/Territorial';
  province?: string;
  domain: 'Animal Health' | 'Public Health' | 'Wildlife/Environment' | 'Zoonotic/Liaison';
  authority: 'Regulatory/Policy' | 'Diagnostic/Lab' | 'Field Operations' | 'Research/Advisory';
  roles: string[];
  mandate: string;
  contact: string;
  website: string;
}

export const STAKEHOLDERS: Stakeholder[] = [
  // --- INTERNATIONAL ---
  {
    id: "woah",
    name: "World Organisation for Animal Health",
    shortName: "WOAH",
    level: "International",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Action & Dissemination", "Evaluation"],
    mandate: "Global coordinating body responsible for improving animal health worldwide, setting international standards for disease surveillance, and managing the World Animal Health Information System (WAHIS).",
    contact: "information@woah.org",
    website: "https://www.woah.org"
  },
  {
    id: "who",
    name: "World Health Organization",
    shortName: "WHO",
    level: "International",
    domain: "Public Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Action & Dissemination", "Evaluation"],
    mandate: "United Nations agency leading global public health, monitoring zoonotic disease spillovers, coordinating international pandemic preparedness, and managing the Global Influenza Surveillance and Response System (GISRS).",
    contact: "mediainquiries@who.int",
    website: "https://www.who.int"
  },
  {
    id: "fao",
    name: "Food and Agriculture Organization",
    shortName: "FAO",
    level: "International",
    domain: "Animal Health",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Action & Dissemination", "Feedback"],
    mandate: "Specialized agency of the UN that leads international efforts to defeat hunger, helps improve agricultural production biosecurity, and co-operates in the joint FAO-WOAH-WHO Global Early Warning System (GLEWS).",
    contact: "fao-hq@fao.org",
    website: "https://www.fao.org"
  },
  {
    id: "usda-aphis",
    name: "USDA Animal and Plant Health Inspection Service",
    shortName: "USDA-APHIS",
    level: "International",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Data Collection", "Data Consolidation", "Action & Dissemination"],
    mandate: "United States federal agency responsible for safeguarding animal health, monitoring bird flu spillovers in US agricultural sectors, and coordinating transboundary disease intelligence with Canada.",
    contact: "aphis.briefing@usda.gov",
    website: "https://www.aphis.usda.gov"
  },

  // --- NATIONAL / FEDERAL ---
  {
    id: "cfia",
    name: "Canadian Food Inspection Agency",
    shortName: "CFIA",
    level: "National",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Canada's lead federal agency for animal health. Manages the Canadian Notifiable Avian Influenza Surveillance System (CanNAISS), enforces farm quarantines and culling directives, and coordinates national outbreak reporting.",
    contact: "cfia.surveillance.acia@inspection.gc.ca",
    website: "https://inspection.canada.ca"
  },
  {
    id: "phac",
    name: "Public Health Agency of Canada",
    shortName: "PHAC",
    level: "National",
    domain: "Public Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Federal body responsible for human public health, pandemic influenza preparedness planning, occupational health guidelines for agricultural workers exposed to H5N1, and national human seasonal flu monitoring (FluWatch).",
    contact: "phac.zoonotic.aspc@canada.ca",
    website: "https://www.canada.ca/en/public-health.html"
  },
  {
    id: "eccc",
    name: "Environment and Climate Change Canada",
    shortName: "ECCC",
    level: "National",
    domain: "Wildlife/Environment",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Federal agency responsible for protecting and conserving migratory bird populations, regulating bird sanctuaries, and co-leading wild bird avian influenza surveillance alongside the CWHC.",
    contact: "enviroinfo@ec.gc.ca",
    website: "https://www.canada.ca/en/environment-climate-change.html"
  },
  {
    id: "cwhc",
    name: "Canadian Wildlife Health Cooperative",
    shortName: "CWHC",
    level: "National",
    domain: "Wildlife/Environment",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "A national cooperative of wildlife health professionals, centered inside Canada's veterinary colleges, that leads wild bird avian influenza diagnostics, public dead-bird reporting, and maps national wildlife disease trends.",
    contact: "info@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca"
  },
  {
    id: "nml",
    name: "National Microbiology Laboratory",
    shortName: "NML",
    level: "National",
    domain: "Public Health",
    authority: "Diagnostic/Lab",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination"],
    mandate: "Canada's premier human infectious disease laboratory (part of PHAC). Performs genetic sequencing of influenza virus samples, runs diagnostic testing for suspected human bird flu cases, and monitors viral mutations.",
    contact: "nml.director@phac-aspc.gc.ca",
    website: "https://www.canada.ca/en/public-health/services/laboratory-biosafety-biosecurity/national-microbiology-laboratory.html"
  },
  {
    id: "ncfad",
    name: "National Centre for Foreign Animal Disease",
    shortName: "NCFAD",
    level: "National",
    domain: "Animal Health",
    authority: "Diagnostic/Lab",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "High-containment (BSL-3/4) federal diagnostic laboratory in Winnipeg (operated by CFIA). Provides definitive confirmation testing of presumptive avian influenza positive samples submitted by provincial laboratories.",
    contact: "cfia.ncfad-winnipeg.acia@inspection.gc.ca",
    website: "https://inspection.canada.ca/about-the-cfia/science-and-laboratories/our-laboratories/winnipeg-laboratory/eng/1301548698188/1301548906977"
  },
  {
    id: "cezd",
    name: "Community for Emerging and Zoonotic Diseases",
    shortName: "CEZD",
    level: "National",
    domain: "Zoonotic/Liaison",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "An inter-agency, virtual community of animal, public, and environmental health specialists. Scans digital media and global epidemiological databases to provide rapid alerts and situational summaries regarding emerging H5N1 threats.",
    contact: "coordinator@cezd.ca",
    website: "https://www.cezd.ca"
  },
  {
    id: "cahss",
    name: "Canadian Animal Health Surveillance System",
    shortName: "CAHSS",
    level: "National",
    domain: "Zoonotic/Liaison",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "A division of the National Farm Animal Care Council (NFACC) that acts as a collaborative network to integrate animal health surveillance data, hosting interactive dashboards tracking avian influenza outbreaks across commercial poultry.",
    contact: "cahss@animalhealth.ca",
    website: "https://cahss.ca"
  },
  {
    id: "hc",
    name: "Health Canada",
    shortName: "HC",
    level: "National",
    domain: "Public Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Action & Dissemination", "Evaluation"],
    mandate: "Federal department that regulates therapeutic drugs, vaccines, and diagnostic reagents in Canada, ensuring vaccine stockpiles are prepared for potential avian-to-human pandemic transitions.",
    contact: "hc.info@canada.ca",
    website: "https://www.canada.ca/en/health-canada.html"
  },
  {
    id: "pc",
    name: "Parks Canada",
    shortName: "PC",
    level: "National",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Action & Dissemination"],
    mandate: "Federal agency administering Canada's national parks. Monitors wild bird and marine mammal populations for clinical signs of H5N1 within parks, collects diagnostic carcasses, and manages local visitor access restrictions.",
    contact: "pc.info@pc.gc.ca",
    website: "https://www.pc.gc.ca"
  },
  {
    id: "cfc",
    name: "Chicken Farmers of Canada",
    shortName: "CFC",
    level: "National",
    domain: "Animal Health",
    authority: "Field Operations",
    roles: ["Data Collection", "Action & Dissemination", "Feedback"],
    mandate: "National producer organization representing commercial chicken farmers. Coordinates the implementation of strict on-farm biosecurity programs (Raised by a Canadian Farmer) and relays biosecurity alerts during outbreaks.",
    contact: "cfc@chicken.ca",
    website: "https://www.chickenfarmers.ca"
  },
  {
    id: "efc",
    name: "Egg Farmers of Canada",
    shortName: "EFC",
    level: "National",
    domain: "Animal Health",
    authority: "Field Operations",
    roles: ["Data Collection", "Action & Dissemination", "Feedback"],
    mandate: "National organization representing egg producers. Enforces mandatory on-farm biosecurity protocols, tracks flock mortality thresholds, and partners with veterinarians for proactive disease detection.",
    contact: "info@eggs.ca",
    website: "https://www.eggfarmers.ca"
  },
  {
    id: "tfc",
    name: "Turkey Farmers of Canada",
    shortName: "TFC",
    level: "National",
    domain: "Animal Health",
    authority: "Field Operations",
    roles: ["Data Collection", "Action & Dissemination", "Feedback"],
    mandate: "National organization representing turkey producers. Enforces high on-farm biosecurity standards through its On-Farm Food Safety Program, tracks flock health, and collaborates with poultry and diagnostic networks for proactive avian influenza surveillance.",
    contact: "info@turkeyfarmersofcanada.ca",
    website: "https://www.turkeyfarmersofcanada.ca"
  },


  // --- PROVINCIAL / TERRITORIAL ---
  // ONTARIO
  {
    id: "omafra",
    name: "Ontario Ministry of Agriculture, Food and Agribusiness",
    shortName: "OMAFRA",
    level: "Provincial/Territorial",
    province: "Ontario",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Provincial ministry overseeing Ontario's agricultural sector. Enforces provincial livestock health regulations, monitors farm disease reports, coordinates biosecurity containment, and educates producers.",
    contact: "ag.info.omafra@ontario.ca",
    website: "https://www.ontario.ca/page/ministry-agriculture-food-and-rural-affairs"
  },
  {
    id: "omoh",
    name: "Ontario Ministry of Health",
    shortName: "OMOH",
    level: "Provincial/Territorial",
    province: "Ontario",
    domain: "Public Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Provincial ministry directing Ontario's public health system. Establishes provincial testing protocols for human influenza-like illness, manages personal protective equipment (PPE) stockpiles for poultry cullers, and guides local health units.",
    contact: "publichealthontario@oahpp.ca",
    website: "https://www.ontario.ca/page/ministry-health"
  },
  {
    id: "ahl-guelph",
    name: "Animal Health Laboratory (University of Guelph)",
    shortName: "AHL Guelph",
    level: "Provincial/Territorial",
    province: "Ontario",
    domain: "Animal Health",
    authority: "Diagnostic/Lab",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis", "Data Integration"],
    mandate: "Full-service animal diagnostic laboratory housed inside the Ontario Veterinary College. Operates as Ontario's primary agricultural screening hub, detecting presumptive H5N1 positive poultry and submitting them to NCFAD.",
    contact: "ahl.guelph@uoguelph.ca",
    website: "https://www.guelphlabservices.com/ahl/"
  },
  {
    id: "oahn",
    name: "Ontario Animal Health Network",
    shortName: "OAHN",
    level: "Provincial/Territorial",
    province: "Ontario",
    domain: "Zoonotic/Liaison",
    authority: "Research/Advisory",
    roles: ["Data Consolidation", "Data Integration", "Action & Dissemination", "Feedback"],
    mandate: "A collaborative program between OMAFRA and the University of Guelph. Forms veterinary networks (including the OAHN Poultry and Wildlife Networks) to share clinical observations, compile disease reports, and issue warnings.",
    contact: "oahn@uoguelph.ca",
    website: "https://www.oahn.ca"
  },
  {
    id: "cwhc-on",
    name: "CWHC Ontario Region (University of Guelph)",
    shortName: "CWHC Ontario",
    level: "Provincial/Territorial",
    province: "Ontario",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis"],
    mandate: "The Ontario regional diagnostic branch of CWHC, located at OVC. Performs necropsies and initial screening on wild bird carcasses submitted by Ontario's Ministry of Natural Resources and the public.",
    contact: "ontario@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/regional_centres.php#on"
  },

  // BRITISH COLUMBIA
  {
    id: "bc-agri",
    name: "BC Ministry of Agriculture and Food",
    shortName: "BC Agri",
    level: "Provincial/Territorial",
    province: "British Columbia",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "BC ministry directing provincial agricultural programs, supporting biosecurity on poultry farms in the high-density Fraser Valley, and issuing veterinary alerts for domestic animal respiratory diseases.",
    contact: "agri@gov.bc.ca",
    website: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organisations/ministries/agriculture-and-food"
  },
  {
    id: "bccdc",
    name: "BC Centre for Disease Control",
    shortName: "BCCDC",
    level: "Provincial/Territorial",
    province: "British Columbia",
    domain: "Public Health",
    authority: "Diagnostic/Lab",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Provincial agency providing public health surveillance and laboratory diagnostics in BC. Evaluates human seasonal and zoonotic flu infections, conducts human contact tracing for infected poultry operations, and guides worker health safety.",
    contact: "influenza@bccdc.ca",
    website: "http://www.bccdc.ca"
  },
  {
    id: "ahc-abbotsford",
    name: "Animal Health Centre (BC Ministry of Agriculture)",
    shortName: "AHC Abbotsford",
    level: "Provincial/Territorial",
    province: "British Columbia",
    domain: "Animal Health",
    authority: "Diagnostic/Lab",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis", "Data Integration"],
    mandate: "BC's primary veterinary diagnostic laboratory in Abbotsford. Evaluates flock mortality submissions, diagnoses avian respiratory pathogens, and provides rapid diagnostic services in major flyway zones.",
    contact: "ahc@gov.bc.ca",
    website: "https://www2.gov.bc.ca/gov/content/industry/agriculture-seafood/animals-crops/animal-health/animal-health-centre"
  },
  {
    id: "cwhc-bc",
    name: "CWHC Pacific Region (BC Ministry of Agriculture)",
    shortName: "CWHC Pacific",
    level: "Provincial/Territorial",
    province: "British Columbia",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis"],
    mandate: "The Pacific diagnostic node of CWHC, tracking bird flu spillovers into BC's wildlife, bald eagles, and marine mammals.",
    contact: "pacific@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/regional_centres.php#bc"
  },

  // QUEBEC
  {
    id: "mapaq",
    name: "Ministère de l'Agriculture, des Pêcheries et de l'Alimentation du Québec",
    shortName: "MAPAQ",
    level: "Provincial/Territorial",
    province: "Quebec",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Québec provincial ministry directing agriculture and food safety. Enforces mandatory quarantine borders, coordinates local farm culling alongside the CFIA, and publishes French biosecurity resources.",
    contact: "info.mapaq@mapaq.gouv.qc.ca",
    website: "https://www.quebec.ca/gouvernement/ministere/mapaq"
  },
  {
    id: "msss-qc",
    name: "Ministère de la Santé et des Services sociaux du Québec",
    shortName: "MSSS",
    level: "Provincial/Territorial",
    province: "Quebec",
    domain: "Public Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Québec provincial department coordinating human medical surveillance. Directs regional public health clinics, issues medical warnings for human cases, and coordinates diagnostic coordination with NML.",
    contact: "msss@msss.gouv.qc.ca",
    website: "https://www.quebec.ca/gouvernement/ministere/sante-services-sociaux"
  },
  {
    id: "inspq-lab",
    name: "Laboratoire de santé publique du Québec (INSPQ)",
    shortName: "INSPQ LSPQ",
    level: "Provincial/Territorial",
    province: "Quebec",
    domain: "Public Health",
    authority: "Diagnostic/Lab",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis", "Action & Dissemination"],
    mandate: "Québec's public health laboratory. Performs clinical respiratory screening, identifies human influenza sub-types, and tracks potential zoonotic H5N1 transmission in human respiratory tracts.",
    contact: "lspq@inspq.qc.ca",
    website: "https://www.inspq.qc.ca/lspq"
  },
  {
    id: "cwhc-qc",
    name: "CWHC Québec Region (Université de Montréal)",
    shortName: "CWHC Québec",
    level: "Provincial/Territorial",
    province: "Quebec",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis"],
    mandate: "Québec CWHC node, housed within the Faculté de médecine vétérinaire at Saint-Hyacinthe. Screens dead wild birds, waterfowl, and mammals across Québec, and collaborates in the provincial wildlife surveillance framework.",
    contact: "quebec@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/regional_centres.php#qc"
  },

  // ALBERTA
  {
    id: "ab-agri",
    name: "Alberta Agriculture and Irrigation",
    shortName: "Alberta Agri",
    level: "Provincial/Territorial",
    province: "Alberta",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Alberta provincial department supporting livestock health. Establishes poultry disease regulations, maps outbreak premises, and works with agricultural partners to monitor flyway-associated risks.",
    contact: "agriculture.info@gov.ab.ca",
    website: "https://www.alberta.ca/agriculture-and-irrigation"
  },
  {
    id: "cwhc-ab",
    name: "CWHC Alberta Region (University of Calgary)",
    shortName: "CWHC Alberta",
    level: "Provincial/Territorial",
    province: "Alberta",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis"],
    mandate: "Alberta diagnostic node of CWHC, located at UCVM. Collects and analyzes wild bird carcasses, assesses localized mortality events, and reports wildlife diagnostics to Alberta Environment and Protected Areas.",
    contact: "alberta@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/regional_centres.php#ab"
  },

  // SASKATCHEWAN
  {
    id: "sk-agri",
    name: "Saskatchewan Ministry of Agriculture",
    shortName: "Sask Agri",
    level: "Provincial/Territorial",
    province: "Saskatchewan",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Saskatchewan ministry overseeing provincial crop and livestock operations. Establishes poultry biosecurity regulations, maintains surveillance networks, and coordinates with local veterinary practices.",
    contact: "agri.info@gov.sk.ca",
    website: "https://www.saskatchewan.ca/government/directory/agriculture"
  },
  {
    id: "cwhc-nat-wcvm",
    name: "CWHC National HQ & Western Region (University of Saskatchewan)",
    shortName: "CWHC National",
    level: "Provincial/Territorial",
    province: "Saskatchewan",
    domain: "Wildlife/Environment",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "The national administrative headquarters and western regional diagnostic node of CWHC, located inside WCVM in Saskatoon. Synthesizes provincial wildlife data into cohesive biweekly national testing reports.",
    contact: "info@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/about.php"
  },

  // ATLANTIC CANADA (PEI, NS, NB, NL)
  {
    id: "cwhc-atl",
    name: "CWHC Atlantic Region (University of Prince Edward Island)",
    shortName: "CWHC Atlantic",
    level: "Provincial/Territorial",
    province: "Prince Edward Island",
    domain: "Wildlife/Environment",
    authority: "Field Operations",
    roles: ["Data Collection", "Data Consolidation", "Data Analysis"],
    mandate: "CWHC Atlantic node, located at the Atlantic Veterinary College. Performs initial screening on wild bird and marine mammal carcasses across Prince Edward Island, Nova Scotia, New Brunswick, and Newfoundland.",
    contact: "atlantic@cwhc-rcsf.ca",
    website: "https://www.cwhc-rcsf.ca/regional_centres.php#atl"
  },
  {
    id: "ns-agri",
    name: "Nova Scotia Department of Agriculture",
    shortName: "NS Agri",
    level: "Provincial/Territorial",
    province: "Nova Scotia",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Provincial authority overseeing animal health, poultry farm bio-security, and agricultural disease reporting systems in Nova Scotia.",
    contact: "nsda@novascotia.ca",
    website: "https://novascotia.ca/agri/"
  },
  {
    id: "nb-agri",
    name: "New Brunswick Department of Agriculture, Aquaculture and Fisheries",
    shortName: "NB Agri",
    level: "Provincial/Territorial",
    province: "New Brunswick",
    domain: "Animal Health",
    authority: "Regulatory/Policy",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Provincial department overseeing livestock veterinary services, regulating poultry biosecurity, and tracking seasonal waterfowl flyway risks along the Atlantic coast.",
    contact: "aaf-aaf@gnb.ca",
    website: "https://www2.gnb.ca/content/gnb/en/departments/10.html"
  },
  {
    id: "glam",
    name: "Genomics Laboratory and Modelling Network",
    shortName: "GLaM",
    level: "National",
    domain: "Zoonotic/Liaison",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback"],
    mandate: "A federal-provincial virtual genomics network that integrates sequencing and phylogenetic modeling data for H5N1 avian influenza across human, wildlife, and domestic animal cases in Canada.",
    contact: "coordinator@glam-net.ca",
    website: "https://glam-net.ca"
  },
  {
    id: "wecahn",
    name: "Western Canadian Animal Health Surveillance Network",
    shortName: "WeCAHN",
    level: "Provincial/Territorial",
    province: "British Columbia",
    domain: "Animal Health",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
    mandate: "Regional animal health surveillance network for western Canada. Collates livestock and wildlife disease data across BC, Alberta, Saskatchewan, and Manitoba to detect emerging disease trends like avian influenza.",
    contact: "coordinator@wecahn.ca",
    website: "https://wecahn.ca"
  },
  {
    id: "cprc",
    name: "Canadian Poultry Research Council",
    shortName: "CPRC",
    level: "National",
    domain: "Animal Health",
    authority: "Research/Advisory",
    roles: ["Set Objectives", "Data Collection", "Data Consolidation", "Action & Dissemination", "Feedback"],
    mandate: "Supports research on poultry health, biosecurity, disease prevention, and vaccination efficacy. Partners with poultry industry groups, universities, and governments to coordinate avian influenza research.",
    contact: "info@cp-poultry.ca",
    website: "https://cp-poultry.ca"
  }
];
