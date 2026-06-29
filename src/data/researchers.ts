export interface Researcher {
  id: string;
  name: string;
  title: string;
  institution: string;
  domain: 'Immunology & Vaccines' | 'Epidemiology & Surveillance' | 'Genomics & Virology' | 'Clinical & Zoonotic' | 'One Health Policy';
  bio: string;
  email: string;
  website: string;
  papers: string[];
  networks: string[];
}

export interface ResearcherConnection {
  source: string;
  target: string;
  label: string;
}

export const RESEARCHERS: Researcher[] = [
  {
    id: "dr-shayan-sharif",
    name: "Dr. Shayan Sharif",
    title: "Professor & Associate Dean of Research",
    institution: "Ontario Veterinary College, University of Guelph",
    domain: "Immunology & Vaccines",
    bio: "Renowned avian immunologist leading Canada's research on highly pathogenic avian influenza (H5N1) poultry vaccination, host immune response modeling, and biosecurity protocols.",
    email: "shayan@uoguelph.ca",
    website: "https://ovc.uoguelph.ca",
    papers: [
      "Mapping of stakeholders in avian influenza surveillance in Canada (2025)",
      "Efficacy of Recombinant H5N1 Vaccines in Canadian Commercial Poultry (2025)",
      "Avian Influenza Control: A One Health Poultry Strategy for Canada (2026)"
    ],
    networks: ["OAHN", "CPRC", "CAHSS"]
  },
  {
    id: "dr-danuta-skowronski",
    name: "Dr. Danuta Skowronski",
    title: "Epidemiology Lead, Influenza & Emerging Pathogens",
    institution: "BC Centre for Disease Control (BCCDC)",
    domain: "Epidemiology & Surveillance",
    bio: "Leading public health physician and influenza epidemiologist specializing in zoonotic spillover risk, vaccine effectiveness, and respiratory pathogen surveillance modeling in Western Canada.",
    email: "danuta.skowronski@bccdc.ca",
    website: "http://www.bccdc.ca",
    papers: [
      "Zoonotic Surveillance of H5N1 Clade 2.3.4.4b in Western Canada (2025)",
      "Seroprevalence of Cross-Reactive Antibodies to HPAI H5N1 in Humans (2026)"
    ],
    networks: ["BCCDC", "PHAC", "GLaM"]
  },
  {
    id: "dr-david-goldfarb",
    name: "Dr. David Goldfarb",
    title: "Medical Microbiologist & Pediatric Infectious Disease Specialist",
    institution: "BC Children's Hospital / University of British Columbia",
    domain: "Clinical & Zoonotic",
    bio: "Clinical investigator specializing in emerging pediatric infectious diseases and laboratory diagnostics. Key investigator for the late-2024 severe pediatric H5N1 case in British Columbia.",
    email: "dgoldfarb@bcchr.ca",
    website: "https://bcchildrens.ca",
    papers: [
      "Clinical Progression and Intensive Care Management of Severe Pediatric H5N1 Infection (2025)",
      "Diagnostics of Zoonotic Influenza: Lessons from the Frontlines of a Pediatric ICU (2026)"
    ],
    networks: ["BCCDC", "PHAC"]
  },
  {
    id: "dr-charya-ranadheera",
    name: "Dr. Charya Ranadheera",
    title: "Chief, Viral Diseases Genomic Surveillance",
    institution: "National Microbiology Laboratory (NML), Public Health Agency of Canada",
    domain: "Genomics & Virology",
    bio: "Lead molecular virologist managing the genomic sequencing of emerging influenza viruses in Canada. Leading the team that isolated and characterized the oseltamivir-resistant H275Y H5N1 mutation in 2024.",
    email: "charya.ranadheera@phac-aspc.gc.ca",
    website: "https://www.canada.ca/en/public-health.html",
    papers: [
      "Genomic Characterization of Oseltamivir-Resistant H5N1 in British Columbia Poultry (2025)",
      "Wastewater-Based Genomic Surveillance of Influenza A (H5N1) across Canadian Municipalities (2026)"
    ],
    networks: ["PHAC", "GLaM"]
  },
  {
    id: "dr-jane-parmley",
    name: "Dr. Jane Parmley",
    title: "Associate Professor, Department of Population Medicine",
    institution: "Ontario Veterinary College, University of Guelph",
    domain: "One Health Policy",
    bio: "Epidemiologist and One Health advocate whose research integrates wildlife, domestic animal, and human pathogen surveillance datasets to guide collaborative national health decisions.",
    email: "jparmley@uoguelph.ca",
    website: "https://uoguelph.ca",
    papers: [
      "Mapping of stakeholders in avian influenza surveillance in Canada (2025)",
      "Integrating Wildlife and Agricultural Datasets for Avian Influenza Risk Forecasting (2025)",
      "Co-designing One Health Surveillance for Emerging Pathogens in Canada (2026)"
    ],
    networks: ["CWHC", "OAHN", "CAHSS"]
  },
  {
    id: "dr-michelle-coombe",
    name: "Dr. Michelle Coombe",
    title: "Lead Veterinary Epidemiologist",
    institution: "British Columbia Ministry of Agriculture, Food and Fisheries",
    domain: "Epidemiology & Surveillance",
    bio: "Veterinary epidemiologist specializing in mathematical modeling of disease transmission in agricultural systems, wild bird interactive mapping, and poultry biosecurity auditing.",
    email: "michelle.coombe@gov.bc.ca",
    website: "https://gov.bc.ca",
    papers: [
      "Spatiotemporal Analysis of H5N1 Spillover Risk on Fraser Valley Poultry Farms (2025)",
      "Evaluating Biosecurity Interventions on High-Risk Commercial Turkey Farms (2026)"
    ],
    networks: ["WeCAHN", "CAHSS"]
  },
  {
    id: "dr-chelsea-himsworth",
    name: "Dr. Chelsea Himsworth",
    title: "Diagnostic Pathologist & Professor of Veterinary Pathology",
    institution: "BC Ministry of Agriculture / University of British Columbia",
    domain: "Genomics & Virology",
    bio: "Pioneered 'genomic epidemiology' applications in urban and agricultural wildlife surveillance. Focuses on wastewater and environmental H5N1 viral shedding detection.",
    email: "chelsea.himsworth@ubc.ca",
    website: "https://pathology.ubc.ca",
    papers: [
      "Environmental and Wastewater DNA Sequencing for Avian Influenza Early Detection (2025)",
      "Genomic Surveillance of Pathogen Spillover at the Wild-Domestic Interface (2026)"
    ],
    networks: ["WeCAHN", "GLaM", "CWHC"]
  },
  {
    id: "dr-sandrine-lacoste",
    name: "Dr. Sandrine Lacoste",
    title: "Clinical Virologist & Researcher",
    institution: "Faculté de médecine vétérinaire, Université de Montréal",
    domain: "Genomics & Virology",
    bio: "Diagnostics specialist mapping viral clade movement and molecular variation of highly pathogenic avian influenza in Quebec's commercial poultry and waterfowl populations.",
    email: "sandrine.lacoste@umontreal.ca",
    website: "https://fmv.umontreal.ca",
    papers: [
      "Characterization of Clade 2.3.4.4b H5N1 Mutants in Quebec Poultry (2025)",
      "Wildlife Reservoirs of Avian Influenza in the St. Lawrence River Basin (2026)"
    ],
    networks: ["CWHC", "CAHSS"]
  },
  {
    id: "dr-guillaume-lhermie",
    name: "Dr. Guillaume Lhermie",
    title: "Director, Simpson Centre & Professor of Animal Health Economics",
    institution: "University of Calgary / Western College of Veterinary Medicine",
    domain: "One Health Policy",
    bio: "Veterinary epidemiologist and agricultural economist studying the economic impact of H5N1 trade bans, poultry herd compensation policies, and the return on investment of biosecurity.",
    email: "guillaume.lhermie@ucalgary.ca",
    website: "https://simpsoncentre.ca",
    papers: [
      "The Economics of Avian Influenza Vaccination and Export Restrictions in Canada (2025)",
      "Incentivizing Farm-Level Biosecurity: A Policy Optimization Study (2026)"
    ],
    networks: ["WeCAHN", "CAHSS"]
  },
  {
    id: "dr-samira-mubareka",
    name: "Dr. Samira Mubareka",
    title: "Infectious Diseases Physician & Scientist",
    institution: "Sunnybrook Health Sciences Centre / University of Toronto",
    domain: "Clinical & Zoonotic",
    bio: "Clinician-scientist examining viral transmission dynamics of respiratory pathogens at the animal-human interface, specifically tracking genomic markers of mammalian H5N1 adaptation in swine and seals.",
    email: "samira.mubareka@sunnybrook.ca",
    website: "https://sunnybrook.ca",
    papers: [
      "Mammalian Transmission Correlates of Reassortant H5N1 Influenza Viruses (2025)",
      "Bioaerosol Risks and Environmental Persistence of HPAI in Agricultural Workers (2026)"
    ],
    networks: ["PHAC", "GLaM", "CAHSS"]
  }
];

export const RESEARCHER_CONNECTIONS: ResearcherConnection[] = [
  // Co-authorships & Project Collaborations
  { source: "dr-shayan-sharif", target: "dr-jane-parmley", label: "National Vaccine-Surveillance Pilot (2025)" },
  { source: "dr-danuta-skowronski", target: "dr-david-goldfarb", label: "BC Human Case Clinical Study (2025)" },
  { source: "dr-david-goldfarb", target: "dr-charya-ranadheera", label: "Genetic Isolation & Diagnostic Design" },
  { source: "dr-michelle-coombe", target: "dr-chelsea-himsworth", label: "Fraser Valley Agricultural Risk Models (2025)" },
  { source: "dr-samira-mubareka", target: "dr-charya-ranadheera", label: "National Mammalian Spillover Genomics (2026)" },
  { source: "dr-guillaume-lhermie", target: "dr-jane-parmley", label: "One Health Biosecurity Economics" },
  { source: "dr-sandrine-lacoste", target: "dr-guillaume-lhermie", label: "Quebec Farm Policy Cost-Benefit Study" },

  // Affiliations & Advisory Flows to Networks
  { source: "dr-shayan-sharif", target: "cprc", label: "Scientific Advisory Board" },
  { source: "dr-shayan-sharif", target: "oahn", label: "Poultry Network Advisor" },
  { source: "dr-jane-parmley", target: "oahn", label: "Epidemiological Advisor" },
  { source: "dr-jane-parmley", target: "cwhc", label: "Wildlife Advisory Council" },
  { source: "dr-danuta-skowronski", target: "glam", label: "Public Health Liaison" },
  { source: "dr-charya-ranadheera", target: "glam", label: "Genomics Infrastructure Core" },
  { source: "dr-chelsea-himsworth", target: "glam", label: "Wastewater Epidemiology Pioneer" },
  { source: "dr-chelsea-himsworth", target: "wecahn", label: "Western Wildlife Pathology Lead" },
  { source: "dr-michelle-coombe", target: "wecahn", label: "BC Ministry Liaison" },
  { source: "dr-guillaume-lhermie", target: "wecahn", label: "Simpson Centre Policy Feed" },
  { source: "dr-samira-mubareka", target: "cahss", label: "Swine-Avian Interface Lead" },
  { source: "dr-sandrine-lacoste", target: "cahss", label: "Quebec Diagnostics Contributor" },
  { source: "dr-jane-parmley", target: "cahss", label: "One Health Integration Advisor" }
];
