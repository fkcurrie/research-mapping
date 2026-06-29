import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  CheckCircle, 
  SlidersHorizontal, 
  X, 
  BookOpen, 
  Network, 
  ExternalLink, 
  Mail, 
  EyeOff, 
  Compass, 
  HelpCircle,
  Cpu,
  RefreshCw,
  Sun,
  Moon,
  Database,
  Users,
  Award,
  FileText,
  Layers
} from 'lucide-react';
import { STAKEHOLDERS, type Stakeholder } from './data/stakeholders';
import { RESEARCHERS, type Researcher, type ResearcherConnection, RESEARCHER_CONNECTIONS } from './data/researchers';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';

// --- GRACEFUL SERVERLESS FIREBASE SETUP ---
let db: Firestore | null = null;
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sfle-hpai-surveillance",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

try {
  // Only attempt initialization if API key is provided, preventing console errors in clean builds
  if (firebaseConfig.apiKey) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Firebase initialization skipped or failed, falling back to static database:", error);
}

export default function App() {
  // --- STATE ---
  const [stakeholdersList, setStakeholdersList] = useState<Stakeholder[]>(STAKEHOLDERS);
  const [connectionsList, setConnectionsList] = useState<{source: string, target: string, label: string}[]>([]);
  const [dbSource, setDbSource] = useState<'static' | 'firestore'>('static');
  const [loadingDb, setLoadingDb] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStakeholder, setSelectedSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [activeTab, setActiveTab] = useState<'bullseye' | 'cycle' | 'network' | 'table'>('network');
  const [lightMode, setLightMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePreset, setActivePreset] = useState<string>('all');
  
  const [networkHoverNode, setNetworkHoverNode] = useState<string | null>(null);
  const [cycleHoverSegment, setCycleHoverSegment] = useState<string | null>(null);
  
  // --- RESEARCHERS STATES ---
  const [researchersList, setResearchersList] = useState<Researcher[]>(RESEARCHERS);
  const [researcherConnectionsList, setResearcherConnectionsList] = useState<ResearcherConnection[]>(RESEARCHER_CONNECTIONS);
  const [networkViewMode, setNetworkViewMode] = useState<'organizations' | 'researchers'>('organizations');
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [networkHoverResearcher, setNetworkHoverResearcher] = useState<string | null>(null);

  // --- PHYSICS ENGINE STATES & REFS ---
  const [physicsPositions, setPhysicsPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [gravity, setGravity] = useState<number>(0.04);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [ticksCount, setTicksCount] = useState<number>(0);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  const isDraggingCanvasRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const draggedNodeIdRef = useRef<string | null>(null);
  const velocitiesRef = useRef<Record<string, { vx: number; vy: number }>>({});
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Toggle center gravity
  const handleToggleGravity = () => {
    setGravity(prev => {
      if (prev <= 0.02) return 0.05;
      if (prev <= 0.05) return 0.10;
      return 0.02;
    });
  };

  const getGravityLabel = () => {
    if (gravity <= 0.02) return "Low";
    if (gravity <= 0.05) return "Medium";
    return "High";
  };

  const handleRecenter = () => {
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
  };


  // --- DATABASE SYNC EFFECT ---
  useEffect(() => {
    async function syncFirestoreData() {
      if (!db) return;
      setLoadingDb(true);
      try {
        // Sync stakeholders
        const querySnapshot = await getDocs(collection(db, "stakeholders"));
        if (!querySnapshot.empty) {
          const list: Stakeholder[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ 
              id: doc.id, 
              name: data.name,
              shortName: data.shortName,
              level: data.level,
              province: data.province,
              domain: data.domain,
              authority: data.authority,
              roles: data.roles || [],
              mandate: data.mandate,
              contact: data.contact,
              website: data.website
            } as Stakeholder);
          });
          setStakeholdersList(list);
          setDbSource('firestore');
          console.log(`Successfully synced ${list.length} stakeholders from Cloud Firestore.`);
        }

        // Sync connections if present
        const connSnapshot = await getDocs(collection(db, "connections"));
        if (!connSnapshot.empty) {
          const conns: {source: string, target: string, label: string}[] = [];
          connSnapshot.forEach((doc) => {
            const data = doc.data();
            conns.push({
              source: data.source,
              target: data.target,
              label: data.label
            });
          });
          setConnectionsList(conns);
          console.log(`Successfully synced ${conns.length} custom connections from Cloud Firestore.`);
        }

        // Sync researchers if present in Cloud Firestore
        const researchersSnapshot = await getDocs(collection(db, "researchers"));
        if (!researchersSnapshot.empty) {
          const resList: Researcher[] = [];
          researchersSnapshot.forEach((doc) => {
            const data = doc.data();
            resList.push({
              id: doc.id,
              name: data.name,
              title: data.title,
              institution: data.institution,
              domain: data.domain,
              bio: data.bio,
              email: data.email,
              website: data.website,
              papers: data.papers || [],
              networks: data.networks || []
            } as Researcher);
          });
          setResearchersList(resList);
          console.log(`Successfully synced ${resList.length} researchers from Cloud Firestore.`);
        }

        // Sync researcher connections if present in Cloud Firestore
        const resConnSnapshot = await getDocs(collection(db, "researcher_connections"));
        if (!resConnSnapshot.empty) {
          const resConns: ResearcherConnection[] = [];
          resConnSnapshot.forEach((doc) => {
            const data = doc.data();
            resConns.push({
              source: data.source,
              target: data.target,
              label: data.label
            });
          });
          setResearcherConnectionsList(resConns);
          console.log(`Successfully synced ${resConns.length} researcher connections from Cloud Firestore.`);
        }
      } catch (error) {
        console.error("Firestore loading failed. Continuing with high-fidelity static fallback.", error);
      } finally {
        setLoadingDb(false);
      }
    }
    syncFirestoreData();
  }, []);

  // --- DARK/LIGHT MODE ---
  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [lightMode]);

  // --- FILTER PRESETS ---
  const handleApplyPreset = (preset: string) => {
    setActivePreset(preset);
    // Reset filters first
    setSearch('');
    setSelectedLevel('All');
    setSelectedProvince('All');
    setSelectedDomains([]);
    setSelectedAuthorities([]);
    setSelectedRole('All');
    setSelectedSelectedStakeholder(null);

    switch (preset) {
      case 'federal':
        setSelectedLevel('National');
        break;
      case 'poultry':
        setSelectedDomains(['Animal Health']);
        setSelectedAuthorities(['Field Operations', 'Regulatory/Policy']);
        break;
      case 'wildlife':
        setSelectedDomains(['Wildlife/Environment']);
        break;
      case 'labs':
        setSelectedAuthorities(['Diagnostic/Lab']);
        break;
      case 'vets':
        setSelectedAuthorities(['Research/Advisory', 'Field Operations']);
        setSearch('University');
        break;
      case 'all-steps':
        setSelectedRole('All Steps');
        break;
      default:
        break;
    }
  };

  // --- DOMAIN / ROLE CONSTANTS ---
  const domains = ['Animal Health', 'Public Health', 'Wildlife/Environment', 'Zoonotic/Liaison'];
  const authorities = ['Regulatory/Policy', 'Diagnostic/Lab', 'Field Operations', 'Research/Advisory'];
  
  const surveillanceRoles = [
    "Set Objectives",
    "Data Collection",
    "Data Consolidation",
    "Data Analysis",
    "Data Integration",
    "Action & Dissemination",
    "Feedback",
    "Evaluation",
    "All Steps"
  ];

  const provinces = [
    "Ontario",
    "British Columbia",
    "Quebec",
    "Alberta",
    "Saskatchewan",
    "Prince Edward Island",
    "Nova Scotia",
    "New Brunswick"
  ];

  // --- FILTER LOGIC ---
  const filteredStakeholders = useMemo(() => {
    return stakeholdersList.filter(s => {
      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesShort = s.shortName.toLowerCase().includes(query);
        const matchesMandate = s.mandate.toLowerCase().includes(query);
        const matchesProvince = s.province?.toLowerCase().includes(query);
        
        // Match associated researchers by name
        const matchedResearchers = researchersList.filter(r => 
          r.name.toLowerCase().includes(query) || 
          r.id.toLowerCase().includes(query)
        );
        const matchesResearcher = matchedResearchers.some(r => {
          const inNetworks = r.networks.some(n => 
            n.toLowerCase() === s.id.toLowerCase() || 
            n.toLowerCase() === s.shortName.toLowerCase()
          );
          const inConnections = researcherConnectionsList.some(conn => 
            conn.source.toLowerCase() === r.id.toLowerCase() && 
            conn.target.toLowerCase() === s.id.toLowerCase()
          );
          return inNetworks || inConnections;
        });

        if (!matchesName && !matchesShort && !matchesMandate && !matchesProvince && !matchesResearcher) {
          return false;
        }
      }

      // 2. Level
      if (selectedLevel !== 'All' && s.level !== selectedLevel) {
        return false;
      }

      // 3. Province
      if (selectedLevel === 'Provincial/Territorial' && selectedProvince !== 'All' && s.province !== selectedProvince) {
        return false;
      }
      if (selectedLevel === 'All' && selectedProvince !== 'All' && s.province !== selectedProvince && s.level === 'Provincial/Territorial') {
        return false;
      }

      // 4. One Health Domain
      if (selectedDomains.length > 0 && !selectedDomains.includes(s.domain)) {
        return false;
      }

      // 5. Functional Authority
      if (selectedAuthorities.length > 0 && !selectedAuthorities.includes(s.authority)) {
        return false;
      }

      // 6. Surveillance Role
      if (selectedRole !== 'All') {
        if (selectedRole === 'All Steps') {
          return s.roles.includes('All Steps');
        } else {
          const doesSpecific = s.roles.includes(selectedRole);
          const doesAll = s.roles.includes('All Steps');
          return doesSpecific || doesAll;
        }
      }

      return true;
    });
  }, [stakeholdersList, researchersList, researcherConnectionsList, search, selectedLevel, selectedProvince, selectedDomains, selectedAuthorities, selectedRole]);

  // Keep selected node synced if still present in filters
  useEffect(() => {
    if (selectedStakeholder && !filteredStakeholders.some(s => s.id === selectedStakeholder.id)) {
      setSelectedSelectedStakeholder(null);
    }
  }, [filteredStakeholders, selectedStakeholder]);

  // Colors utility mapping helper
  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'Animal Health': return 'var(--color-animal)';
      case 'Public Health': return 'var(--color-public)';
      case 'Wildlife/Environment': return 'var(--color-wildlife)';
      case 'Zoonotic/Liaison': return 'var(--color-liaison)';
      default: return 'var(--accent-primary)';
    }
  };

  const getAuthorityColor = (authority: string) => {
    switch (authority) {
      case 'Regulatory/Policy': return 'var(--color-policy)';
      case 'Diagnostic/Lab': return 'var(--color-lab)';
      case 'Field Operations': return 'var(--color-field)';
      case 'Research/Advisory': return 'var(--color-advisory)';
      default: return 'var(--text-secondary)';
    }
  };

  const getResearcherDomainColor = (domain: string) => {
    switch (domain) {
      case 'Immunology & Vaccines': return 'var(--color-liaison)';
      case 'Epidemiology & Surveillance': return 'var(--color-animal)';
      case 'Genomics & Virology': return 'var(--color-lab)';
      case 'Clinical & Zoonotic': return 'var(--color-public)';
      case 'One Health Policy': return 'var(--color-wildlife)';
      default: return 'var(--accent-primary)';
    }
  };

  // --- SVG BULLSEYE COORDINATES GENERATION ---
  const bullseyeNodes = useMemo(() => {
    const nodes: { s: Stakeholder; x: number; y: number; angle: number; r: number }[] = [];
    
    // Group stakeholders from current list
    const international = stakeholdersList.filter(s => s.level === 'International');
    const national = stakeholdersList.filter(s => s.level === 'National');
    const provincial = stakeholdersList.filter(s => s.level === 'Provincial/Territorial');

    const rInt = 55;
    const rNat = 135;
    const rProv = 215;

    const cx = 250;
    const cy = 250;

    const distributeNodes = (items: Stakeholder[], radius: number) => {
      items.forEach((item, index) => {
        const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        nodes.push({ s: item, x, y, angle, r: radius });
      });
    };

    distributeNodes(international, rInt);
    distributeNodes(national, rNat);
    distributeNodes(provincial, rProv);

    return nodes;
  }, [stakeholdersList]);

  // --- FORCE DIRECTED INFO-FLOW MODEL ---
  const flowLinks = useMemo(() => {
    const staticConns = [
      { source: "cwhc-nat-wcvm", target: "cwhc", label: "National Admin Hub" },
      { source: "cwhc-on", target: "cwhc", label: "ON Regional Feed" },
      { source: "cwhc-bc", target: "cwhc", label: "BC Regional Feed" },
      { source: "cwhc-qc", target: "cwhc", label: "QC Regional Feed" },
      { source: "cwhc-ab", target: "cwhc", label: "AB Regional Feed" },
      { source: "cwhc-atl", target: "cwhc", label: "Atlantic Regional Feed" },

      { source: "cwhc", target: "cfia", label: "Wildlife Alerts" },
      { source: "cwhc", target: "phac", label: "Zoonotic Spillovers" },
      { source: "cwhc", target: "eccc", label: "Migratory Syntheses" },

      { source: "ahl-guelph", target: "omafra", label: "Presumptive Reports" },
      { source: "ahl-guelph", target: "ncfad", label: "Confirmatory Shipping" },

      { source: "ahc-abbotsford", target: "bc-agri", label: "Presumptive Reports" },
      { source: "ahc-abbotsford", target: "ncfad", label: "Confirmatory Shipping" },

      { source: "inspq-lab", target: "msss-qc", label: "Human Diagnostic Feed" },
      { source: "inspq-lab", target: "nml", label: "Genetic Sequencing Data" },

      { source: "cfia", target: "ncfad", label: "Lab Directives" },
      { source: "cfia", target: "cahss", label: "Outbreak Geospatial Data" },
      { source: "phac", target: "nml", label: "Diagnostic Directives" },

      { source: "cezd", target: "cahss", label: "Threat Intelligence Integration" },
      { source: "cahss", target: "omafra", label: "Outbreak Dashboards" },
      { source: "cahss", target: "bc-agri", label: "Outbreak Dashboards" },
      { source: "cahss", target: "mapaq", label: "Outbreak Dashboards" },

      { source: "cfc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "efc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "tfc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "efc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "cfc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "tfc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "oahn", target: "omafra", label: "Joint Veterinary Advisories" },
      { source: "oahn", target: "cfia", label: "Epidemiological Summaries" },
      { source: "oahn", target: "cahss", label: "Provincial Surveillance Rollups" },

      // --- EXPANDED HIGH-FIDELITY CONNECTIONS (LAST 12 MONTHS) ---
      { source: "cfia", target: "usda-aphis", label: "Transboundary Swine/Cattle H5N1 Genome Sharing" },
      { source: "phac", target: "who", label: "Pandemic Treaty & Spillover Reporting" },
      { source: "cfia", target: "woah", label: "WAHIS H5N1 Bovine Outbreak Alerts" },
      { source: "cwhc", target: "eccc", label: "Wild Bird GPS & Flyway Cross-referencing" },
      { source: "nml", target: "glam", label: "Wastewater Genomics Dashboards" },
      { source: "oahn", target: "cahss", label: "Ontario Poultry/Bovine Surveillance Integration" },
      { source: "wecahn", target: "cahss", label: "Western Poultry/Bovine Surveillance Integration" },
      { source: "cfc", target: "cahss", label: "Poultry Outbreak Live Dashboards" },
      { source: "efc", target: "cahss", label: "Egg Producer Biosecurity Data Sharing" },
      { source: "tfc", target: "cahss", label: "Turkey Industry H5N1 Case Aggregation" },
      { source: "phac", target: "cahss", label: "One Health Swine-Avian Coordination" },
      { source: "ncfad", target: "nml", label: "BSL-4 Joint Avian-Swine Reassortant Genotyping" },
    ];

    const combined = [...staticConns];

    connectionsList.forEach(c => {
      const exists = combined.some(item => 
        item.source === c.source && item.target === c.target
      );
      if (!exists) {
        combined.push(c);
      }
    });

    return combined;
  }, [connectionsList]);

  const flowNodes = useMemo(() => {
    const nodeIds = Array.from(new Set(flowLinks.flatMap(l => [l.source, l.target])));
    return nodeIds.map(id => stakeholdersList.find(s => s.id === id)).filter(Boolean) as Stakeholder[];
  }, [flowLinks, stakeholdersList]);

  const flowNodesWithCoords = useMemo(() => {
    const cx = 250;
    const cy = 250;
    const radius = 195;
    return flowNodes.map((n, index) => {
      const pos = physicsPositions[n.id];
      if (pos) {
        return { s: n, x: pos.x, y: pos.y };
      }
      let x = cx;
      let y = cy;
      if (n.id === "cfia") { x = cx - 60; y = cy - 35; }
      else if (n.id === "phac") { x = cx + 60; y = cy - 35; }
      else if (n.id === "cwhc") { x = cx; y = cy + 60; }
      else {
        const angle = (index / (flowNodes.length - 3)) * 2 * Math.PI;
        x = cx + radius * Math.cos(angle);
        y = cy + radius * Math.sin(angle);
      }
      return { s: n, x, y };
    });
  }, [flowNodes, physicsPositions]);

  const activeNodeId = networkHoverNode || selectedStakeholder?.id;
  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const set = new Set<string>([activeNodeId]);
    flowLinks.forEach(link => {
      if (link.source === activeNodeId) set.add(link.target);
      if (link.target === activeNodeId) set.add(link.source);
    });
    return set;
  }, [activeNodeId, flowLinks]);

  // --- COORDINATES & HIGHLIGHT ENGINE FOR RESEARCHERS MAP ---
  // --- COORDINATES & HIGHLIGHT ENGINE FOR RESEARCHERS MAP ---
  const researcherNodesWithCoords = useMemo(() => {
    const cx = 250;
    const cy = 250;
    const innerRadius = 85;
    const outerRadius = 195;

    // Use lowercase IDs for robust lookup match
    const networkIds = ["oahn", "cprc", "cahss", "bccdc", "phac", "glam", "cwhc", "wecahn"];
    const networks = networkIds.map(id => stakeholdersList.find(s => s.id === id)).filter(Boolean) as Stakeholder[];

    const nodes: { type: 'researcher' | 'network'; id: string; name: string; shortName: string; domain: string; x: number; y: number; original: Stakeholder | Researcher }[] = [];

    // Lay out networks on the inner ring
    networks.forEach((net, idx) => {
      const angle = (idx / networks.length) * 2 * Math.PI - Math.PI / 2;
      const pos = physicsPositions[net.id];
      nodes.push({
        type: 'network',
        id: net.id,
        name: net.name,
        shortName: net.shortName,
        domain: net.domain,
        x: pos ? pos.x : cx + innerRadius * Math.cos(angle),
        y: pos ? pos.y : cy + innerRadius * Math.sin(angle),
        original: net
      });
    });

    // Lay out researchers on the outer ring
    researchersList.forEach((res, idx) => {
      const angle = (idx / researchersList.length) * 2 * Math.PI - Math.PI / 2;
      const pos = physicsPositions[res.id];
      nodes.push({
        type: 'researcher',
        id: res.id,
        name: res.name,
        shortName: res.name.replace("Dr. ", ""),
        domain: res.domain,
        x: pos ? pos.x : cx + outerRadius * Math.cos(angle),
        y: pos ? pos.y : cy + outerRadius * Math.sin(angle),
        original: res
      });
    });

    return nodes;
  }, [researchersList, stakeholdersList, physicsPositions]);

  // --- PHYSICS ENGINE INITIAL LAYOUT GENERATOR ---
  const getStaticPositions = useCallback((viewMode: 'organizations' | 'researchers') => {
    const positions: Record<string, { x: number; y: number }> = {};
    const cx = 250;
    const cy = 250;

    if (viewMode === 'organizations') {
      const radius = 195;
      flowNodes.forEach((n, index) => {
        let x = cx;
        let y = cy;
        if (n.id === "cfia") { x = cx - 60; y = cy - 35; }
        else if (n.id === "phac") { x = cx + 60; y = cy - 35; }
        else if (n.id === "cwhc") { x = cx; y = cy + 60; }
        else {
          const angle = (index / (flowNodes.length - 3)) * 2 * Math.PI;
          x = cx + radius * Math.cos(angle);
          y = cy + radius * Math.sin(angle);
        }
        positions[n.id] = { x, y };
      });
    } else {
      const innerRadius = 85;
      const outerRadius = 195;
      const networkIds = ["oahn", "cprc", "cahss", "bccdc", "phac", "glam", "cwhc", "wecahn"];
      const networks = networkIds.map(id => stakeholdersList.find(s => s.id === id)).filter(Boolean) as Stakeholder[];

      networks.forEach((net, idx) => {
        const angle = (idx / networks.length) * 2 * Math.PI - Math.PI / 2;
        positions[net.id] = {
          x: cx + innerRadius * Math.cos(angle),
          y: cy + innerRadius * Math.sin(angle)
        };
      });

      researchersList.forEach((res, idx) => {
        const angle = (idx / researchersList.length) * 2 * Math.PI - Math.PI / 2;
        positions[res.id] = {
          x: cx + outerRadius * Math.cos(angle),
          y: cy + outerRadius * Math.sin(angle)
        };
      });
    }
    return positions;
  }, [flowNodes, stakeholdersList, researchersList]);

  // Trigger high-velocity kinetic shake energy explosion
  const handleShake = () => {
    if (!isSimulating) setIsSimulating(true);
    const activeNodes = networkViewMode === 'organizations' 
      ? flowNodes.map(n => n.id)
      : researcherNodesWithCoords.map(n => n.id);

    activeNodes.forEach(id => {
      velocitiesRef.current[id] = {
        vx: (Math.random() - 0.5) * 35,
        vy: (Math.random() - 0.5) * 35
      };
    });
  };

  // Full reset back to static coordinate settings
  const handleResetLayout = () => {
    const staticPositions = getStaticPositions(networkViewMode);
    positionsRef.current = { ...staticPositions };
    setPhysicsPositions({ ...staticPositions });
    const activeNodes = networkViewMode === 'organizations' 
      ? flowNodes.map(n => n.id)
      : researcherNodesWithCoords.map(n => n.id);
    activeNodes.forEach(id => {
      velocitiesRef.current[id] = { vx: 0, vy: 0 };
    });
    handleRecenter();
  };

  // --- PHYSICS ITERATION ENGINE LOOP ---
  useEffect(() => {
    if (activeTab !== 'network') return;

    // Define nodes/links based on active view mode
    const activeNetworkNodes = ["oahn", "cprc", "cahss", "bccdc", "phac", "glam", "cwhc", "wecahn"]
      .map(id => stakeholdersList.find(s => s.id === id))
      .filter(Boolean)
      .map(s => s!.id);

    const activeNodes = networkViewMode === 'organizations' 
      ? flowNodes.map(n => n.id)
      : [...activeNetworkNodes, ...researchersList.map(r => r.id)];

    const activeLinks = networkViewMode === 'organizations'
      ? flowLinks.map(l => ({ source: l.source, target: l.target }))
      : researcherConnectionsList.map(l => ({ source: l.source, target: l.target }));

    const staticPositions = getStaticPositions(networkViewMode);

    // Re-seed ref states for current active nodes
    const nextPositions = { ...positionsRef.current };
    const nextVelocities = { ...velocitiesRef.current };

    activeNodes.forEach(id => {
      if (!nextPositions[id]) {
        const base = staticPositions[id] || { x: 250, y: 250 };
        nextPositions[id] = {
          x: base.x + (Math.random() - 0.5) * 10,
          y: base.y + (Math.random() - 0.5) * 10
        };
      }
      if (!nextVelocities[id]) {
        nextVelocities[id] = { vx: 0, vy: 0 };
      }
    });

    positionsRef.current = nextPositions;
    velocitiesRef.current = nextVelocities;
    setPhysicsPositions({ ...nextPositions });

    let animationId: number;
    let localTicks = 0;

    const tick = () => {
      const draggedNodeId = draggedNodeIdRef.current;

      // 1. Repulsion (Coulomb)
      const forceX: Record<string, number> = {};
      const forceY: Record<string, number> = {};

      activeNodes.forEach(id => {
        forceX[id] = 0;
        forceY[id] = 0;
      });

      const repelStrength = 1800; // Force factor
      
      for (let i = 0; i < activeNodes.length; i++) {
        const u = activeNodes[i];
        const posU = positionsRef.current[u] || { x: 250, y: 250 };

        for (let j = i + 1; j < activeNodes.length; j++) {
          const v = activeNodes[j];
          const posV = positionsRef.current[v] || { x: 250, y: 250 };

          const dx = posU.x - posV.x;
          const dy = posU.y - posV.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1.0;

          // Prevent divisions by zero and excessive spikes
          const force = repelStrength / (distSq + 120);

          const fx = force * (dx / dist);
          const fy = force * (dy / dist);

          forceX[u] += fx;
          forceY[u] += fy;
          forceX[v] -= fx;
          forceY[v] -= fy;
        }
      }

      // 2. Spring Link Pull (Hooke's Law)
      const springK = 0.04;
      const restLen = 95;

      activeLinks.forEach(link => {
        const u = link.source;
        const v = link.target;

        if (forceX[u] !== undefined && forceX[v] !== undefined) {
          const posU = positionsRef.current[u] || { x: 250, y: 250 };
          const posV = positionsRef.current[v] || { x: 250, y: 250 };

          const dx = posV.x - posU.x;
          const dy = posV.y - posU.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;

          const force = springK * (dist - restLen);

          const fx = force * (dx / dist);
          const fy = force * (dy / dist);

          forceX[u] += fx;
          forceY[u] += fy;
          forceX[v] -= fx;
          forceY[v] -= fy;
        }
      });

      // 3. Central Gravitational Pull
      const cx = 250;
      const cy = 250;
      activeNodes.forEach(id => {
        const pos = positionsRef.current[id] || { x: 250, y: 250 };
        const dx = cx - pos.x;
        const dy = cy - pos.y;
        
        forceX[id] += dx * gravity;
        forceY[id] += dy * gravity;
      });

      // 4. Position & Damping Integrator
      const damp = 0.85;
      const limit = 12; // cap maximum speed to prevent explosions

      const updatedPositions = { ...positionsRef.current };

      activeNodes.forEach(id => {
        if (id === draggedNodeId) {
          velocitiesRef.current[id] = { vx: 0, vy: 0 };
          return;
        }

        const vel = velocitiesRef.current[id] || { vx: 0, vy: 0 };
        let vx = (vel.vx + forceX[id]) * damp;
        let vy = (vel.vy + forceY[id]) * damp;

        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > limit) {
          vx = (vx / speed) * limit;
          vy = (vy / speed) * limit;
        }

        velocitiesRef.current[id] = { vx, vy };

        const pos = positionsRef.current[id] || { x: 250, y: 250 };
        let nx = pos.x + vx;
        let ny = pos.y + vy;

        // Contain strictly within viewport bounds with padding
        const padding = 15;
        if (nx < padding) { nx = padding; velocitiesRef.current[id].vx = 0; }
        if (nx > 500 - padding) { nx = 500 - padding; velocitiesRef.current[id].vx = 0; }
        if (ny < padding) { ny = padding; velocitiesRef.current[id].vy = 0; }
        if (ny > 500 - padding) { ny = 500 - padding; velocitiesRef.current[id].vy = 0; }

        updatedPositions[id] = { x: nx, y: ny };
      });

      positionsRef.current = updatedPositions;
      setPhysicsPositions(updatedPositions);

      localTicks++;
      setTicksCount(localTicks);

      animationId = requestAnimationFrame(tick);
    };

    if (isSimulating) {
      animationId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeTab, networkViewMode, flowNodes, flowLinks, stakeholdersList, researchersList, researcherConnectionsList, isSimulating, gravity, getStaticPositions]);

  // --- SVG INTERACTION EVENT HANDLERS ---
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const zoomFactor = 1.08;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const cappedZoom = Math.max(0.3, Math.min(4.0, nextZoom));

    // Zoom towards the mouse pointer
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const nextPanX = mouseX - (mouseX - panX) * (cappedZoom / zoom);
    const nextPanY = mouseY - (mouseY - panY) * (cappedZoom / zoom);

    setZoom(cappedZoom);
    setPanX(nextPanX);
    setPanY(nextPanY);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeIdRef.current) return;

    isDraggingCanvasRef.current = true;
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panX,
      panY: panY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanX(dragStartRef.current.panX + dx);
      setPanY(dragStartRef.current.panY + dy);
    } else if (draggedNodeIdRef.current && svgRef.current) {
      const nodeId = draggedNodeIdRef.current;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleX = 500 / rect.width;
      const scaleY = 500 / rect.height;

      const svgMouseX = mouseX * scaleX;
      const svgMouseY = mouseY * scaleY;

      // Back-calculate raw position coordinates taking matrix scale into account
      const tx = (svgMouseX - panX) / zoom;
      const ty = (svgMouseY - panY) / zoom;

      positionsRef.current[nodeId] = {
        x: Math.max(10, Math.min(490, tx)),
        y: Math.max(10, Math.min(490, ty))
      };
      setPhysicsPositions({ ...positionsRef.current });
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    setIsDraggingCanvas(false);
    draggedNodeIdRef.current = null;
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation(); // Avoid triggering pan-mode
    draggedNodeIdRef.current = nodeId;
  };

  const activeResearcherId = networkHoverResearcher || selectedResearcher?.id;
  const connectedResearcherIds = useMemo(() => {
    if (!activeResearcherId) return new Set<string>();
    const set = new Set<string>([activeResearcherId.toLowerCase()]);
    researcherConnectionsList.forEach(link => {
      const sourceLower = link.source.toLowerCase();
      const targetLower = link.target.toLowerCase();
      const activeLower = activeResearcherId.toLowerCase();

      if (sourceLower === activeLower) set.add(targetLower);
      if (targetLower === activeLower) set.add(sourceLower);
    });
    return set;
  }, [activeResearcherId, researcherConnectionsList]);

  // --- DIRECT CONNECTIONS MEMOS FOR PROFILE TRAVERSAL ---
  const directStakeholderConnections = useMemo(() => {
    if (!selectedStakeholder) return [];
    return flowLinks.filter(link => 
      link.source === selectedStakeholder.id || link.target === selectedStakeholder.id
    ).map(link => {
      const otherId = link.source === selectedStakeholder.id ? link.target : link.source;
      const otherS = stakeholdersList.find(s => s.id === otherId);
      return {
        id: otherId,
        label: link.label,
        name: otherS ? otherS.shortName : otherId,
        stakeholder: otherS
      };
    }).filter(item => item.stakeholder !== undefined) as { id: string; label: string; name: string; stakeholder: Stakeholder }[];
  }, [selectedStakeholder, flowLinks, stakeholdersList]);

  const directResearcherConnections = useMemo(() => {
    if (!selectedResearcher) return [];
    return researcherConnectionsList.filter(link => 
      link.source.toLowerCase() === selectedResearcher.id.toLowerCase() ||
      link.target.toLowerCase() === selectedResearcher.id.toLowerCase()
    ).map(link => {
      const otherId = link.source.toLowerCase() === selectedResearcher.id.toLowerCase() ? link.target : link.source;
      const otherRes = researchersList.find(r => r.id.toLowerCase() === otherId.toLowerCase());
      return {
        id: otherId,
        label: link.label,
        name: otherRes ? otherRes.name : otherId,
        researcher: otherRes
      };
    });
  }, [selectedResearcher, researcherConnectionsList, researchersList]);

  const researcherNetworks = useMemo(() => {
    if (!selectedResearcher) return [];
    return selectedResearcher.networks.map(netId => {
      const netStakeholder = stakeholdersList.find(s => s.id.toLowerCase() === netId.toLowerCase());
      return {
        id: netId,
        name: netStakeholder ? netStakeholder.shortName : netId,
        stakeholder: netStakeholder
      };
    }).filter(item => item.stakeholder !== undefined) as { id: string; name: string; stakeholder: Stakeholder }[];
  }, [selectedResearcher, stakeholdersList]);

  const stakeholderAffiliatedResearchers = useMemo(() => {
    if (!selectedStakeholder) return [];
    return researcherConnectionsList.filter(link => 
      link.target.toLowerCase() === selectedStakeholder.id.toLowerCase()
    ).map(link => {
      const res = researchersList.find(r => r.id.toLowerCase() === link.source.toLowerCase());
      return {
        id: link.source,
        label: link.label,
        name: res ? res.name : link.source,
        researcher: res
      };
    }).filter(item => item.researcher !== undefined) as { id: string; label: string; name: string; researcher: Researcher }[];
  }, [selectedStakeholder, researcherConnectionsList, researchersList]);


  return (
    <div className="flex-1 flex flex-col min-h-screen text-[var(--text-primary)] background-canvas">
      
      {/* --- PREMIUM PORTAL HEADER --- */}
      <header className="glass-panel mx-4 mt-4 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--border-light)] rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--accent-primary)] bg-opacity-10 text-[var(--accent-primary)] rounded-xl glow-accent-indigo">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-heading m-0 flex items-center gap-2 flex-wrap">
              Avian Influenza Stakeholder Map
              <span className="text-[10px] bg-[var(--accent-primary)] bg-opacity-15 text-[var(--accent-primary)] px-2.5 py-0.5 rounded-full font-sans font-semibold border border-[var(--accent-primary)] border-opacity-35">
                Canada One Health
              </span>
              <span className="text-[10px] bg-emerald-500 bg-opacity-15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-sans font-semibold border border-emerald-500 border-opacity-35 flex items-center gap-1">
                <Database className="w-3 h-3" />
                {dbSource === 'firestore' ? 'Firestore Connected' : 'Local Fallback'}
              </span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
              Interactive Decision-Support & Mapping Suite • Based on <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11956242/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline font-semibold">PMC11956242</a>
            </p>
          </div>
        </div>

        {/* --- CONTROLS & SECURITY BADGES --- */}
        <div className="flex items-center gap-4 flex-wrap justify-end">
          {loadingDb && (
            <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching latest connections...
            </span>
          )}

          {/* Privacy Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 bg-opacity-10 text-rose-500 border border-rose-500 border-opacity-20 rounded-lg text-xs font-medium">
            <EyeOff className="w-3.5 h-3.5" />
            <span>Private Link (Unsearchable)</span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setLightMode(!lightMode)}
            className="p-2 hover:bg-[var(--bg-card-hover)] rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            title="Toggle Theme"
          >
            {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* --- FILTER PRESETS HORIZONTAL BAR --- */}
      <div className="mx-4 mt-4 flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        <span className="text-xs text-[var(--text-secondary)] uppercase font-extrabold tracking-wider whitespace-nowrap mr-3 font-heading flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          Quick Presets:
        </span>
        <button 
          onClick={() => handleApplyPreset('all')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'all' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🌐 All Agencies
        </button>
        <button 
          onClick={() => handleApplyPreset('federal')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'federal' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🏛️ Federal Core
        </button>
        <button 
          onClick={() => handleApplyPreset('poultry')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'poultry' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🐔 Poultry Industry
        </button>
        <button 
          onClick={() => handleApplyPreset('wildlife')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'wildlife' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🦆 Wildlife & Flyways
        </button>
        <button 
          onClick={() => handleApplyPreset('labs')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'labs' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🔬 Diagnostic Labs
        </button>
        <button 
          onClick={() => handleApplyPreset('vets')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'vets' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
          title="Filter to Vet schools, Universities & Regional wildlife hubs"
        >
          🏫 Universities & Vet Schools
        </button>
        <button 
          onClick={() => handleApplyPreset('all-steps')} 
          className={`px-4 py-2 text-xs font-semibold border rounded-full cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            activePreset === 'all-steps' 
              ? 'preset-active' 
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-light)] text-[var(--text-primary)]'
          }`}
        >
          🔄 8-Step Core (66 Agencies)
        </button>
      </div>

      {/* --- MAIN PORTAL SPACIOUS INTERFACE --- */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 m-4 overflow-hidden relative min-h-[580px]">
        
        {/* --- LEFT SIDEBAR: FILTERS PANEL (COLLAPSIBLE) --- */}
        <div 
          className={`sidebar-container shrink-0 flex flex-col gap-4 ${
            sidebarOpen ? 'w-full md:w-[290px] opacity-100' : 'w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
          }`}
        >
          <section className="flex-1 glass-panel p-5 flex flex-col gap-4 border border-[var(--border-light)] rounded-2xl h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-heading m-0 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters Engine
              </h2>
              <button 
                onClick={() => handleApplyPreset('all')}
                className="text-[11px] text-[var(--accent-primary)] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                Reset All
              </button>
            </div>

            <hr className="border-[var(--border-light)] m-0" />

            {/* 1. Search Query */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Agency, mandate, researcher..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActivePreset('custom'); }}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl py-2 pl-9 pr-8 text-xs focus:outline-none focus:border-[var(--border-focus)] text-[var(--text-primary)]"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setActivePreset('custom'); }} className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Level of Organization */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Jurisdictional Level</label>
              <select 
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  if (e.target.value !== 'Provincial/Territorial') setSelectedProvince('All');
                  setActivePreset('custom');
                }}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[var(--border-focus)] text-[var(--text-primary)] cursor-pointer"
              >
                <option value="All">All Levels (International + Canadian)</option>
                <option value="International">International</option>
                <option value="National">National (Canada-wide)</option>
                <option value="Provincial/Territorial">Provincial / Territorial</option>
              </select>
            </div>

            {/* 3. Province Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Province/Territory</label>
              <select 
                value={selectedProvince}
                onChange={(e) => { setSelectedProvince(e.target.value); setActivePreset('custom'); }}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[var(--border-focus)] text-[var(--text-primary)] cursor-pointer"
              >
                <option value="All">All Provinces & Territories</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 4. One Health Domain Multi-Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">One Health Domain</label>
              <div className="flex flex-col gap-1">
                {domains.map(d => {
                  const isSelected = selectedDomains.includes(d);
                  const color = getDomainColor(d);
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDomains(selectedDomains.filter(item => item !== d));
                        } else {
                          setSelectedDomains([...selectedDomains, d]);
                        }
                        setActivePreset('custom');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-[11px] font-semibold cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[var(--bg-main)] border-opacity-100' 
                          : 'bg-transparent border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                      style={{ borderColor: isSelected ? color : 'var(--border-light)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{d}</span>
                      </div>
                      {isSelected && <span className="text-[9px] uppercase font-extrabold" style={{ color }}>Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Functional Authority */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Functional Authority</label>
              <div className="flex flex-col gap-1">
                {authorities.map(a => {
                  const isSelected = selectedAuthorities.includes(a);
                  const color = getAuthorityColor(a);
                  return (
                    <button
                      key={a}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAuthorities(selectedAuthorities.filter(item => item !== a));
                        } else {
                          setSelectedAuthorities([...selectedAuthorities, a]);
                        }
                        setActivePreset('custom');
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left text-[11px] font-semibold cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[var(--bg-main)] border-opacity-100 shadow-sm' 
                          : 'bg-transparent border-[var(--border-light)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                      style={{ borderColor: isSelected ? color : 'var(--border-light)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span>{a}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Surveillance Cycle Role */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Surveillance Cycle Step</label>
              <select 
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setActivePreset('custom'); }}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[var(--border-focus)] text-[var(--text-primary)] cursor-pointer"
              >
                <option value="All">All Surveillance Cycle Steps</option>
                {surveillanceRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {/* --- CENTER MASSIVE AREA: TABS + FIGURES --- */}
        <section className="flex-1 flex flex-col gap-4 min-w-0 h-full relative">
          
          {/* Header row containing collapser control, metrics summary, and tab buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-light)] p-2 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-[var(--bg-card-hover)] border border-[var(--border-light)] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title={sidebarOpen ? "Minimize Filter Engine" : "Open Filter Engine"}
              >
                <SlidersHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="hide-on-mobile text-[11px] text-[var(--text-secondary)]">{sidebarOpen ? "Hide Filters" : "Show Filters"}</span>
              </button>
              
              <div className="hide-on-mobile h-5 w-[1px] bg-[var(--border-light)] mx-1" />

              {/* Live metrics */}
              <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  🌐 Active: <strong className="text-[var(--accent-primary)] font-mono">{filteredStakeholders.length}/{stakeholdersList.length}</strong>
                </span>
                <span className="flex items-center gap-1 hide-on-mobile">
                  🔄 Unified 8-Step Core: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{filteredStakeholders.filter(s => s.roles.includes('All Steps')).length}</strong>
                </span>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex items-center bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-light)] flex-1 md:flex-none">
              <button 
                onClick={() => { setActiveTab('bullseye'); setSelectedSelectedStakeholder(null); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'bullseye' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Fig A: Radar</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('cycle'); setSelectedSelectedStakeholder(null); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'cycle' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Fig B: Steps</span>
              </button>

              <button 
                onClick={() => { setActiveTab('network'); setSelectedSelectedStakeholder(null); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'network' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Fig C: Connections</span>
              </button>

              <button 
                onClick={() => { setActiveTab('table'); setSelectedSelectedStakeholder(null); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'table' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Table 1: Matrix</span>
              </button>
            </div>
          </div>

          {/* --- INTERACTIVE CANVAS BLOCK --- */}
          <div className={`flex-1 glass-panel diagram-canvas flex flex-col relative overflow-hidden min-h-[520px] ${selectedStakeholder || selectedResearcher ? 'drawer-open' : ''}`}>
            
            {/* FIG A: CONCENTRIC BULLSEYE RADAR (UPGRADED SELF-DOCUMENTING BADGES) */}
            {activeTab === 'bullseye' && (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4 z-10 text-[10px] md:text-xs bg-[var(--bg-card)] border border-[var(--border-light)] px-3 py-1.5 rounded-lg max-w-[90%] font-semibold shadow-sm flex items-center gap-1">
                  <span className="font-bold text-[var(--accent-primary)] uppercase">Concentric Jurisdictions:</span>
                  <span>Outer: Provincial • Middle: National • Inner Core: International</span>
                </div>
                
                <svg viewBox="0 0 500 500" width="500" height="500" className="w-full max-w-[480px] aspect-square">
                  {/* --- Grid rings --- */}
                  <circle cx="250" cy="250" r="215" fill="none" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="250" cy="250" r="135" fill="none" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="250" cy="250" r="55" fill="none" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Ring text labels */}
                  <text x="250" y="202" fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontWeight="bold" letterSpacing="1">INTERNATIONAL</text>
                  <text x="250" y="122" fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontWeight="bold" letterSpacing="1">NATIONAL CORE</text>
                  <text x="250" y="42" fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontWeight="bold" letterSpacing="1">PROVINCIAL / TERRITORIAL</text>

                  {/* Draw circular quadrant division lines */}
                  <line x1="250" y1="35" x2="250" y2="465" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="35" y1="250" x2="465" y2="250" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="2,2" />

                  {/* Nodes (Rendered as beautiful self-documenting capsule badges) */}
                  {bullseyeNodes.map(node => {
                    const isFilteredIn = filteredStakeholders.some(s => s.id === node.s.id);
                    const isSelected = selectedStakeholder?.id === node.s.id;
                    const color = getDomainColor(node.s.domain);

                    // Dynamic dimensions
                    const labelText = node.s.shortName;
                    const paddingX = 10;
                    const capsuleW = Math.max(34, labelText.length * 5.4 + paddingX);
                    const capsuleH = 18;

                    return (
                      <g 
                        key={node.s.id}
                        className="cursor-pointer select-none"
                        onClick={() => setSelectedSelectedStakeholder(node.s)}
                      >
                        {/* Glow outline for selected node */}
                        {isSelected && (
                          <rect 
                            x={node.x - capsuleW / 2 - 2} 
                            y={node.y - capsuleH / 2 - 2} 
                            width={capsuleW + 4} 
                            height={capsuleH + 4} 
                            rx="10" 
                            ry="10" 
                            fill="none" 
                            stroke={color} 
                            strokeWidth="1.5" 
                            className="status-pulse"
                          />
                        )}

                        {/* Capsule body background */}
                        <rect 
                          x={node.x - capsuleW / 2} 
                          y={node.y - capsuleH / 2} 
                          width={capsuleW} 
                          height={capsuleH} 
                          rx="9" 
                          ry="9" 
                          fill={isFilteredIn ? (isSelected ? color : 'var(--bg-card)') : 'var(--bg-main)'} 
                          stroke={isFilteredIn ? color : 'var(--border-light)'} 
                          strokeWidth={isSelected ? '1.5' : '1'} 
                          opacity={isFilteredIn ? (isSelected ? "1" : "0.95") : "0.12"}
                          className="interactive-node"
                          style={{ color }}
                        />

                        {/* Centered Acronym text label inside capsule */}
                        <text 
                          x={node.x} 
                          y={node.y + 4.2} 
                          fill={isFilteredIn ? (isSelected ? '#ffffff' : 'var(--text-primary)') : 'var(--text-muted)'} 
                          fontSize="8" 
                          fontWeight="bold"
                          fontFamily="var(--mono)"
                          textAnchor="middle"
                          opacity={isFilteredIn ? "1" : "0.15"}
                          className="pointer-events-none"
                        >
                          {labelText}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* FIG B: SURVEILLANCE CYCLE WHEEL (SPLIT LAYOUT WITH UPRIGHT VERTICAL TIMELINE) */}
            {activeTab === 'cycle' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden h-full items-center">
                
                {/* Left Side: Elegant circular spoke visual index indicator */}
                <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                  <div className="absolute -top-4 text-[10px] bg-[var(--bg-card)] border border-[var(--border-light)] px-2.5 py-1 rounded-md font-bold text-[var(--text-secondary)] shadow-sm">
                    Surveillance Wheel
                  </div>

                  <svg viewBox="0 0 500 500" width="500" height="500" className="w-full max-w-[280px] aspect-square">
                    <g transform="translate(250, 250)">
                      {surveillanceRoles.map((role, index) => {
                        if (role === 'All Steps') return null;

                        const startAngle = (index / 8) * 2 * Math.PI - Math.PI / 2;
                        const endAngle = ((index + 1) / 8) * 2 * Math.PI - Math.PI / 2;
                        
                        const rIn = 75;
                        const rOut = 195;

                        // Coordinates
                        const x1_in = rIn * Math.cos(startAngle);
                        const y1_in = rIn * Math.sin(startAngle);
                        const x2_in = rIn * Math.cos(endAngle);
                        const y2_in = rIn * Math.sin(endAngle);
                        const x1_out = rOut * Math.cos(startAngle);
                        const y1_out = rOut * Math.sin(startAngle);
                        const x2_out = rOut * Math.cos(endAngle);
                        const y2_out = rOut * Math.sin(endAngle);

                        const midAngle = (startAngle + endAngle) / 2;
                        const tx = (rIn + rOut) / 2 * Math.cos(midAngle);
                        const ty = (rIn + rOut) / 2 * Math.sin(midAngle);

                        const isSelected = selectedRole === role;
                        const isHovered = cycleHoverSegment === role;

                        return (
                          <g 
                            key={role}
                            className="cursor-pointer select-none"
                            onClick={() => { setSelectedRole(selectedRole === role ? 'All' : role); setActivePreset('custom'); }}
                            onMouseEnter={() => setCycleHoverSegment(role)}
                            onMouseLeave={() => setCycleHoverSegment(null)}
                          >
                            {/* Arc segment path */}
                            <path 
                              d={`M ${x1_in} ${y1_in} L ${x1_out} ${y1_out} A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${rIn} ${rIn} 0 0 0 ${x1_in} ${y1_in} Z`}
                              fill={isSelected ? 'rgba(79, 70, 229, 0.15)' : (isHovered ? 'rgba(120, 113, 108, 0.15)' : 'rgba(120, 113, 108, 0.03)')}
                              stroke={isSelected ? 'var(--accent-primary)' : 'var(--border-light)'}
                              strokeWidth={isSelected ? '2.5' : '1'}
                            />

                            {/* Upright Horizontal Step Badge (Eliminates head tilting) */}
                            <circle 
                              cx={tx} 
                              cy={ty} 
                              r="11" 
                              fill={isSelected ? 'var(--accent-primary)' : (isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)')} 
                              stroke={isSelected ? 'var(--accent-primary)' : 'var(--border-light)'}
                              strokeWidth="1.2"
                              className="shadow-sm transition-colors"
                            />
                            <text 
                              x={tx} 
                              y={ty + 3.2} 
                              fill={isSelected ? '#ffffff' : 'var(--text-primary)'} 
                              fontSize="9.5" 
                              fontWeight="bold" 
                              textAnchor="middle"
                              className="font-sans"
                            >
                              {index + 1}
                            </text>
                          </g>
                        );
                      })}

                      {/* Central Core Dial (Representing 66 unified All Steps organizations) */}
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="66" 
                        fill="var(--bg-card)" 
                        stroke="var(--border-light)" 
                        strokeWidth="2" 
                        onClick={() => { setSelectedRole(selectedRole === 'All Steps' ? 'All' : 'All Steps'); setActivePreset('custom'); }}
                        className="cursor-pointer shadow-md hover:scale-[1.02] transition-transform"
                      />
                      <text 
                        x="0" 
                        y="-12" 
                        fill="var(--text-primary)" 
                        fontSize="9.5" 
                        fontWeight="800" 
                        textAnchor="middle"
                        onClick={() => { setSelectedRole(selectedRole === 'All Steps' ? 'All' : 'All Steps'); setActivePreset('custom'); }}
                        className="cursor-pointer font-heading tracking-tight"
                      >
                        🔄 8-STEPS CORE
                      </text>
                      <text 
                        x="0" 
                        y="4" 
                        fill="var(--text-secondary)" 
                        fontSize="8" 
                        textAnchor="middle"
                        onClick={() => { setSelectedRole(selectedRole === 'All Steps' ? 'All' : 'All Steps'); setActivePreset('custom'); }}
                        className="cursor-pointer"
                      >
                        Unified Actors
                      </text>
                      <text 
                        x="0" 
                        y="19" 
                        fill="var(--accent-primary)" 
                        fontSize="11" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        onClick={() => { setSelectedRole(selectedRole === 'All Steps' ? 'All' : 'All Steps'); setActivePreset('custom'); }}
                        className="cursor-pointer font-mono"
                      >
                        {filteredStakeholders.filter(s => s.roles.includes('All Steps')).length} / 66
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Right Side: Upright, self-documenting vertical timeline index list */}
                <div className="md:col-span-7 flex flex-col gap-2.5 h-full overflow-hidden max-h-[465px] md:border-l border-[var(--border-light)] md:pl-5">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Surveillance Timeline Checklist</span>
                    {selectedRole !== 'All' && (
                      <button onClick={() => { setSelectedRole('All'); setActivePreset('custom'); }} className="text-[10px] text-[var(--accent-primary)] font-bold hover:underline">Clear Filter</button>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin">
                    {surveillanceRoles.map((role, index) => {
                      if (role === 'All Steps') return null;
                      
                      const stepNum = index + 1;
                      const totalAllSteps = stakeholdersList.filter(s => s.roles.includes('All Steps')).length;
                      const totalDoingThisRole = stakeholdersList.filter(s => s.roles.includes(role)).length + totalAllSteps;
                      const filteredInThisRole = filteredStakeholders.filter(s => s.roles.includes(role) || s.roles.includes('All Steps')).length;
                      const isSelected = selectedRole === role;
                      
                      const stepDescriptions = [
                        "Establish collaborative scope, priorities, disease metrics, and targets.",
                        "Gather field animal swabs, sentinel poultry data, and wild dead-bird alerts.",
                        "Consolidate and format raw diagnostic inputs from lab nodes into digital databases.",
                        "Run epidemiological models, phylogenetic sequencing, and spatial heatmaps.",
                        "Synthesize wildlife, poultry, and human datasets for a combined One Health view.",
                        "Publish official alerts, impose animal quarantines, and direct response actions.",
                        "Distribute bulletins and reports to veterinarians, farmers, and research partners.",
                        "Audit framework coverage, lab throughput, and operational response efficacy."
                      ];

                      return (
                        <div 
                          key={role}
                          onClick={() => { setSelectedRole(selectedRole === role ? 'All' : role); setActivePreset('custom'); }}
                          onMouseEnter={() => setCycleHoverSegment(role)}
                          onMouseLeave={() => setCycleHoverSegment(null)}
                          className={`timeline-card ${isSelected ? 'active' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-light)]'
                              }`}>
                                {stepNum}
                              </span>
                              <div>
                                <h3 className="text-xs font-bold font-heading m-0 text-[var(--text-primary)]">
                                  {role}
                                </h3>
                                <p className="text-[11px] leading-tight text-[var(--text-secondary)] m-0 mt-0.5">
                                  {stepDescriptions[index]}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)] bg-opacity-10 px-2 py-0.5 rounded">
                                {filteredInThisRole} / {totalDoingThisRole}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar inside card to show sector match ratio */}
                          <div className="timeline-progress">
                            <div 
                              className="timeline-progress-fill" 
                              style={{ width: `${totalDoingThisRole > 0 ? (filteredInThisRole / totalDoingThisRole) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* FIG C: COLLABORATIVE CONNECTION INFORMATION FLOW (UPGRADED DUAL-VIEW INTERACTIVE MAP) */}
            {activeTab === 'network' && (
              <div className="flex-1 flex flex-col relative h-full min-h-[480px]">
                
                {/* View Toggler (Top-Right Segmented Controller) */}
                <div className="absolute top-4 right-4 z-30 flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-light)] shadow-sm">
                  <button
                    onClick={() => { setNetworkViewMode('organizations'); setSelectedSelectedStakeholder(null); setSelectedResearcher(null); }}
                    className={`px-3 py-1.5 text-[10px] md:text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                      networkViewMode === 'organizations'
                        ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Organizations Web</span>
                  </button>
                  <button
                    onClick={() => { setNetworkViewMode('researchers'); setSelectedSelectedStakeholder(null); setSelectedResearcher(null); }}
                    className={`px-3 py-1.5 text-[10px] md:text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                      networkViewMode === 'researchers'
                        ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] border border-[var(--border-light)] shadow-sm font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Researchers Map</span>
                  </button>
                </div>

                {/* Left Floating Info Badge */}
                <div className="absolute top-4 left-4 z-10 text-[10px] md:text-xs bg-[var(--bg-card)] border border-[var(--border-light)] px-3 py-1.5 rounded-lg max-w-[50%] md:max-w-[42%] font-semibold shadow-sm flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                    <span className="font-bold text-[var(--accent-primary)] uppercase">
                      {networkViewMode === 'organizations' ? 'Organizations Web' : 'Researchers & Networks'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {networkViewMode === 'organizations' 
                      ? 'Select nodes to trace transboundary & reporting vectors. Neighboring nodes automatically bypass active filters.' 
                      : 'Interactive map of 10 lead Canadian H5N1 investigators, co-authorships, and network advisory flows.'}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center p-4">
                  {networkViewMode === 'organizations' ? (
                    <svg 
                      ref={svgRef}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      viewBox="0 0 500 500" 
                      width="500"
                      height="500"
                      className={`w-full max-w-[480px] aspect-square select-none ${isDraggingCanvas ? 'canvas-grabbing' : 'canvas-grab'}`}
                    >
                      {/* Grid background dots pattern & glow filters */}
                      <defs>
                        <pattern id="dot-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="1.5" cy="1.5" r="0.7" fill="var(--text-muted)" opacity="0.22" />
                        </pattern>
                        
                        {/* High-tech GPU Accelerated Neon Glow Filter */}
                        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <rect width="500" height="500" fill="url(#dot-pattern)" pointerEvents="none" opacity="0.7" />

                      {/* Concentric high-tech radar guides */}
                      <circle cx="250" cy="250" r="230" fill="none" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="1,6" opacity="0.25" />
                      <circle cx="250" cy="250" r="195" fill="none" stroke="var(--border-light)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.35" />
                      <circle cx="250" cy="250" r="110" fill="none" stroke="var(--border-light)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.25" />
                      <circle cx="250" cy="250" r="50" fill="none" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="1,4" opacity="0.15" />

                      {/* Interactive Radar Sweeper Sweep */}
                      <line x1="250" y1="250" x2="250" y2="20" stroke="var(--accent-primary)" strokeWidth="0.75" strokeDasharray="3,4" opacity="0.14" className="radar-sweep" />
                      <circle cx="250" cy="250" r="5" fill="var(--accent-primary)" opacity="0.25" />

                      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                        {/* Flow connection vector lines */}
                        {flowLinks.map((link, idx) => {
                          const sourceNode = flowNodesWithCoords.find(n => n.s.id === link.source);
                          const targetNode = flowNodesWithCoords.find(n => n.s.id === link.target);
                          if (!sourceNode || !targetNode) return null;

                          const isHighlighted = activeNodeId === link.source || activeNodeId === link.target;
                          const isSourceFilteredIn = filteredStakeholders.some(s => s.id === link.source);
                          const isTargetFilteredIn = filteredStakeholders.some(s => s.id === link.target);

                          // BYPASS FILTER LOGIC: selection/hovering forces direct connections & links to full opacity
                          const isLinkEffectivelyFilteredIn = (isSourceFilteredIn && isTargetFilteredIn) || (activeNodeId && isHighlighted);

                          const opacityVal = isLinkEffectivelyFilteredIn
                            ? (isHighlighted 
                                ? 0.95 
                                : (activeNodeId ? 0.04 : 0.45))
                            : 0.02;

                          return (
                            <g key={idx}>
                              <path 
                                id={`flow-path-${link.source}-${link.target}-${idx}`}
                                d={`M ${sourceNode.x} ${sourceNode.y} Q ${(sourceNode.x + targetNode.x)/2 + 12} ${(sourceNode.y + targetNode.y)/2 - 12} ${targetNode.x} ${targetNode.y}`}
                                fill="none"
                                stroke={isHighlighted ? 'var(--accent-primary)' : 'var(--border-light)'}
                                strokeWidth={isHighlighted ? '2.5' : '0.8'}
                                strokeDasharray={isHighlighted ? "5,3" : "4,4"}
                                opacity={opacityVal}
                                className={`interactive-link ${isHighlighted ? 'link-flow-active' : ''}`}
                              />
                              {isLinkEffectivelyFilteredIn && (
                                <circle 
                                  r={isHighlighted ? 3.5 : 1.8} 
                                  fill={isHighlighted ? 'var(--accent-primary)' : 'var(--border-light)'} 
                                  opacity={opacityVal}
                                  filter={isHighlighted ? 'url(#neon-glow)' : 'none'}
                                >
                                  <animateMotion dur={isHighlighted ? "1.0s" : "3.5s"} repeatCount="indefinite">
                                    <mpath href={`#flow-path-${link.source}-${link.target}-${idx}`} />
                                  </animateMotion>
                                </circle>
                              )}
                            </g>
                          );
                        })}

                        {/* Flow node elements (Self-Documenting Capsule Badges) */}
                        {flowNodesWithCoords.map((node) => {
                          const isFilteredIn = filteredStakeholders.some(s => s.id === node.s.id);
                          const isSelected = selectedStakeholder?.id === node.s.id;
                          const isNodeHighlighted = !activeNodeId || connectedNodeIds.has(node.s.id);
                          const color = getDomainColor(node.s.domain);

                          // BYPASS FILTER LOGIC: force visible if connected to the selected/hovered node
                          const isNodeEffectivelyFilteredIn = isFilteredIn || (activeNodeId && connectedNodeIds.has(node.s.id));

                          const labelText = node.s.shortName;
                          const paddingX = 10;
                          const capsuleW = Math.max(30, labelText.length * 5.4 + paddingX);
                          const capsuleH = 16;

                          const nodeOpacity = isNodeEffectivelyFilteredIn
                            ? (isNodeHighlighted ? (isSelected ? "1" : "0.95") : "0.15")
                            : "0.08";

                          return (
                            <g 
                              key={node.s.id}
                              transform={`translate(${node.x}, ${node.y})`}
                              className="cursor-pointer select-none"
                              onMouseEnter={() => setNetworkHoverNode(node.s.id)}
                              onMouseLeave={() => setNetworkHoverNode(null)}
                              onMouseDown={(e) => handleNodeMouseDown(e, node.s.id)}
                              onClick={() => { setSelectedSelectedStakeholder(node.s); setSelectedResearcher(null); }}
                            >
                              {/* Pulsing halo behind hovered or selected nodes */}
                              {(isSelected || networkHoverNode === node.s.id) && (
                                <rect 
                                  x={-capsuleW / 2 - 3} 
                                  y={-capsuleH / 2 - 3} 
                                  width={capsuleW + 6} 
                                  height={capsuleH + 6} 
                                  rx="10" 
                                  ry="10" 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth="2" 
                                  className="pulse-halo"
                                  opacity={nodeOpacity}
                                />
                              )}

                              {/* Glow indicator boundary for selected node */}
                              {isSelected && (
                                <rect 
                                  x={-capsuleW / 2 - 2} 
                                  y={-capsuleH / 2 - 2} 
                                  width={capsuleW + 4} 
                                  height={capsuleH + 4} 
                                  rx="9" 
                                  ry="9" 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth="1.5" 
                                  className="status-pulse"
                                  opacity={nodeOpacity}
                                />
                              )}

                              {/* Capsule boundary rect */}
                              <rect 
                                x={-capsuleW / 2} 
                                y={-capsuleH / 2} 
                                width={capsuleW} 
                                height={capsuleH} 
                                rx="8" 
                                ry="8" 
                                fill={isFilteredIn ? (isSelected ? color : 'var(--bg-card)') : 'var(--bg-main)'} 
                                stroke={isFilteredIn ? color : 'var(--border-light)'} 
                                strokeWidth={isSelected ? '1.5' : '1'} 
                                opacity={nodeOpacity}
                                className="interactive-node"
                                style={{ color }}
                              />

                              {/* Centered label inside capsule */}
                              <text 
                                y="3.5" 
                                fill={isFilteredIn ? (isSelected ? '#ffffff' : 'var(--text-primary)') : 'var(--text-muted)'} 
                                fontSize="7" 
                                fontWeight="bold" 
                                fontFamily="var(--mono)"
                                textAnchor="middle"
                                opacity={nodeOpacity}
                                className="pointer-events-none"
                              >
                                {labelText}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    </svg>
                  ) : (
                    <svg 
                      ref={svgRef}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      viewBox="0 0 500 500" 
                      width="500"
                      height="500"
                      className={`w-full max-w-[480px] aspect-square select-none ${isDraggingCanvas ? 'canvas-grabbing' : 'canvas-grab'}`}
                    >
                      {/* Grid background dots pattern & glow filters */}
                      <defs>
                        <pattern id="dot-pattern-res" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="1.5" cy="1.5" r="0.7" fill="var(--text-muted)" opacity="0.22" />
                        </pattern>
                        
                        {/* High-tech GPU Accelerated Neon Glow Filter */}
                        <filter id="neon-glow-res" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <rect width="500" height="500" fill="url(#dot-pattern-res)" pointerEvents="none" opacity="0.7" />

                      {/* Concentric high-tech radar guides */}
                      <circle cx="250" cy="250" r="230" fill="none" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="1,6" opacity="0.25" />
                      <circle cx="250" cy="250" r="195" fill="none" stroke="var(--border-light)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.35" />
                      <circle cx="250" cy="250" r="110" fill="none" stroke="var(--border-light)" strokeWidth="0.5" opacity="0.15" />
                      <circle cx="250" cy="250" r="85" fill="none" stroke="var(--border-light)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.35" />
                      <circle cx="250" cy="250" r="50" fill="none" stroke="var(--border-light)" strokeWidth="0.5" strokeDasharray="1,4" opacity="0.15" />

                      {/* Interactive Radar Sweeper Sweep */}
                      <line x1="250" y1="250" x2="250" y2="20" stroke="var(--accent-secondary)" strokeWidth="0.75" strokeDasharray="3,4" opacity="0.14" className="radar-sweep" />
                      <circle cx="250" cy="250" r="5" fill="var(--accent-secondary)" opacity="0.25" />

                      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                        {/* Draw researcher connection links (curved Bézier) */}
                        {researcherConnectionsList.map((link, idx) => {
                          const sourceNode = researcherNodesWithCoords.find(n => n.id.toLowerCase() === link.source.toLowerCase());
                          const targetNode = researcherNodesWithCoords.find(n => n.id.toLowerCase() === link.target.toLowerCase());
                          if (!sourceNode || !targetNode) return null;

                          let isHighlighted = !!activeResearcherId && (activeResearcherId.toLowerCase() === link.source.toLowerCase() || activeResearcherId.toLowerCase() === link.target.toLowerCase());
                          let opacityVal = isHighlighted ? 0.95 : (activeResearcherId ? 0.04 : 0.45);

                          if (search.trim() && !activeResearcherId) {
                            const query = search.toLowerCase();
                            const sourceRes = researchersList.find(r => r.id.toLowerCase() === link.source.toLowerCase());
                            const targetRes = researchersList.find(r => r.id.toLowerCase() === link.target.toLowerCase());
                            const sourceMatches = sourceRes && sourceRes.name.toLowerCase().includes(query);
                            const targetMatches = targetRes && targetRes.name.toLowerCase().includes(query);
                            const sourceNetMatches = !sourceRes && (link.source.toLowerCase().includes(query) || (sourceNode && sourceNode.name.toLowerCase().includes(query)));
                            const targetNetMatches = !targetRes && (link.target.toLowerCase().includes(query) || (targetNode && targetNode.name.toLowerCase().includes(query)));

                            if (sourceMatches || targetMatches || sourceNetMatches || targetNetMatches) {
                              isHighlighted = true;
                              opacityVal = 0.95;
                            } else {
                              opacityVal = 0.08;
                            }
                          }

                          return (
                            <g key={idx}>
                              <path 
                                id={`res-path-${link.source}-${link.target}-${idx}`}
                                d={`M ${sourceNode.x} ${sourceNode.y} Q ${(sourceNode.x + targetNode.x)/2 + 10} ${(sourceNode.y + targetNode.y)/2 - 10} ${targetNode.x} ${targetNode.y}`}
                                fill="none"
                                stroke={isHighlighted ? 'var(--accent-primary)' : 'var(--border-light)'}
                                strokeWidth={isHighlighted ? '2.2' : '0.8'}
                                strokeDasharray={isHighlighted ? "4,2" : "5,5"}
                                opacity={opacityVal}
                                className={`interactive-link ${isHighlighted ? 'link-flow-active' : ''}`}
                              />
                              {(!activeResearcherId || isHighlighted) && (
                                <circle 
                                  r={isHighlighted ? 3.5 : 1.5} 
                                  fill={isHighlighted ? 'var(--accent-primary)' : 'var(--border-light)'} 
                                  opacity={opacityVal}
                                  filter={isHighlighted ? 'url(#neon-glow-res)' : 'none'}
                                >
                                  <animateMotion dur={isHighlighted ? "1.0s" : "4.0s"} repeatCount="indefinite">
                                    <mpath href={`#res-path-${link.source}-${link.target}-${idx}`} />
                                  </animateMotion>
                                </circle>
                              )}
                            </g>
                          );
                        })}

                        {/* Render researcher & network node badges */}
                        {researcherNodesWithCoords.map((node) => {
                          const isSelected = node.type === 'researcher' 
                            ? selectedResearcher?.id === node.id
                            : selectedStakeholder?.id === node.id;

                          let isNodeHighlighted = !activeResearcherId || connectedResearcherIds.has(node.id.toLowerCase());

                          if (search.trim() && !activeResearcherId) {
                            const query = search.toLowerCase();
                            if (node.type === 'researcher') {
                              const matchesResSearch = node.name.toLowerCase().includes(query) || 
                                                       node.domain.toLowerCase().includes(query) ||
                                                       (node.original && (
                                                         (node.original as Researcher).title.toLowerCase().includes(query) ||
                                                         (node.original as Researcher).institution.toLowerCase().includes(query) ||
                                                         (node.original as Researcher).bio.toLowerCase().includes(query)
                                                       ));
                              isNodeHighlighted = !!matchesResSearch;
                            } else if (node.type === 'network') {
                              const matchesNetSearch = node.name.toLowerCase().includes(query) || 
                                                       node.shortName.toLowerCase().includes(query) ||
                                                       node.domain.toLowerCase().includes(query);
                              
                              const hasConnectedMatchingResearcher = researchersList.some(r => {
                                const matchesRes = r.name.toLowerCase().includes(query);
                                if (!matchesRes) return false;
                                return r.networks.some(n => 
                                  n.toLowerCase() === node.id.toLowerCase() || 
                                  n.toLowerCase() === node.shortName.toLowerCase()
                                ) || researcherConnectionsList.some(conn => 
                                  conn.source.toLowerCase() === r.id.toLowerCase() && 
                                  conn.target.toLowerCase() === node.id.toLowerCase()
                                );
                              });
                              
                              isNodeHighlighted = matchesNetSearch || hasConnectedMatchingResearcher;
                            }
                          }
                          
                          const color = node.type === 'researcher'
                            ? getResearcherDomainColor(node.domain)
                            : getDomainColor(node.domain);

                          const labelText = node.shortName;
                          const nodeOpacity = isNodeHighlighted ? (isSelected ? "1" : "0.95") : "0.15";

                          if (node.type === 'network') {
                            // Render network as a beautiful capsule badge in the inner ring
                            const paddingX = 8;
                            const capsuleW = Math.max(26, labelText.length * 5.2 + paddingX);
                            const capsuleH = 14;

                            return (
                              <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="cursor-pointer select-none"
                                onMouseEnter={() => setNetworkHoverResearcher(node.id)}
                                onMouseLeave={() => setNetworkHoverResearcher(null)}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onClick={() => { setSelectedSelectedStakeholder(node.original as Stakeholder); setSelectedResearcher(null); }}
                              >
                                {/* Pulsing halo behind hovered or selected networks */}
                                {(isSelected || networkHoverResearcher === node.id) && (
                                  <rect 
                                    x={-capsuleW / 2 - 3} 
                                    y={-capsuleH / 2 - 3} 
                                    width={capsuleW + 6} 
                                    height={capsuleH + 6} 
                                    rx="9" 
                                    ry="9" 
                                    fill="none" 
                                    stroke={color} 
                                    strokeWidth="2" 
                                    className="pulse-halo"
                                    opacity={nodeOpacity}
                                  />
                                )}

                                {isSelected && (
                                  <rect 
                                    x={-capsuleW / 2 - 2} 
                                    y={-capsuleH / 2 - 2} 
                                    width={capsuleW + 4} 
                                    height={capsuleH + 4} 
                                    rx="8" 
                                    ry="8" 
                                    fill="none" 
                                    stroke={color} 
                                    strokeWidth="1.5" 
                                    className="status-pulse"
                                    opacity={nodeOpacity}
                                  />
                                )}
                                <rect 
                                  x={-capsuleW / 2} 
                                  y={-capsuleH / 2} 
                                  width={capsuleW} 
                                  height={capsuleH} 
                                  rx="7" 
                                  ry="7" 
                                  fill={isSelected ? color : 'var(--bg-card)'} 
                                  stroke={color} 
                                  strokeWidth={isSelected ? '1.5' : '1'} 
                                  opacity={nodeOpacity}
                                  className="interactive-node"
                                  style={{ color }}
                                />
                                <text 
                                  y="3" 
                                  fill={isSelected ? '#ffffff' : 'var(--text-primary)'} 
                                  fontSize="6.5" 
                                  fontWeight="bold" 
                                  fontFamily="var(--mono)"
                                  textAnchor="middle"
                                  opacity={nodeOpacity}
                                  className="pointer-events-none"
                                >
                                  {labelText}
                                </text>
                              </g>
                            );
                          } else {
                            // Render researcher as a beautiful circular profile node in the outer ring
                            const radius = 10;
                            return (
                              <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="cursor-pointer select-none"
                                onMouseEnter={() => setNetworkHoverResearcher(node.id)}
                                onMouseLeave={() => setNetworkHoverResearcher(null)}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onClick={() => { setSelectedResearcher(node.original as Researcher); setSelectedSelectedStakeholder(null); }}
                              >
                                {/* Pulsing halo behind hovered or selected researchers */}
                                {(isSelected || networkHoverResearcher === node.id) && (
                                  <circle 
                                    r={radius + 4} 
                                    fill="none" 
                                    stroke={color} 
                                    strokeWidth="2" 
                                    className="pulse-halo"
                                    opacity={nodeOpacity}
                                  />
                                )}

                                {isSelected && (
                                  <circle 
                                    r={radius + 3} 
                                    fill="none" 
                                    stroke={color} 
                                    strokeWidth="1.5" 
                                    className="status-pulse"
                                    opacity={nodeOpacity}
                                  />
                                )}
                                <circle 
                                  r={radius} 
                                  fill={isSelected ? color : 'var(--bg-card)'} 
                                  stroke={color} 
                                  strokeWidth={isSelected ? '1.5' : '1.2'} 
                                  opacity={nodeOpacity}
                                  className="interactive-node"
                                  style={{ color }}
                                />
                                {/* Draw small user initials inside circle */}
                                <text 
                                  y="2.5" 
                                  fill={isSelected ? '#ffffff' : color} 
                                  fontSize="6.5" 
                                  fontWeight="bold" 
                                  textAnchor="middle"
                                  opacity={nodeOpacity}
                                  className="pointer-events-none font-sans"
                                >
                                  {labelText.split(" ").pop()?.substring(0, 3).toUpperCase()}
                                </text>
                                {/* Curved text or tag labeling the researcher name outer */}
                                <text 
                                  y={radius + 9}
                                  fill="var(--text-primary)"
                                  fontSize="6"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  opacity={nodeOpacity}
                                  className="pointer-events-none"
                                >
                                  {node.name}
                                </text>
                              </g>
                            );
                          }
                        })}
                      </g>
                    </svg>
                  )}
                </div>

                {/* HUD Readout Panel (Bottom-left, stacked above toolbar) */}
                <div className="absolute bottom-[58px] left-4 z-20 hud-panel p-2 text-[9px] flex flex-col gap-0.5 w-44 pointer-events-none select-none hide-on-mobile">
                  <div className="flex justify-between items-center border-b border-[var(--border-light)] pb-1 mb-1 opacity-80">
                    <span className="font-bold uppercase tracking-wider text-[8px] text-[var(--text-muted)]">System Telemetry</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Simulation:</span>
                    <span className="font-bold text-[var(--accent-primary)]">{isSimulating ? 'RUNNING' : 'PAUSED'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Engine Gravity:</span>
                    <span className="font-bold">{getGravityLabel()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Canvas Zoom:</span>
                    <span className="font-bold">{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Canvas Pan:</span>
                    <span className="font-bold font-mono">[{panX.toFixed(0)}, {panY.toFixed(0)}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Active Nodes:</span>
                    <span className="font-bold">{networkViewMode === 'organizations' ? flowNodes.length : researcherNodesWithCoords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Cycle Ticks:</span>
                    <span className="font-bold font-mono">{ticksCount}</span>
                  </div>
                </div>

                {/* HUD Controls Toolbar (Bottom-left dock) */}
                <div className="absolute bottom-4 left-4 z-20 hud-panel p-1.5 flex items-center gap-1.5 pointer-events-auto max-w-[calc(100%-32px)] flex-wrap">
                  <button 
                    onClick={handleShake} 
                    className="hud-button"
                    title="High-velocity kinetic shake energy explosion"
                  >
                    <span>💥 <span className="hide-on-mobile">Shake</span></span>
                  </button>
                  
                  <button 
                    onClick={handleToggleGravity} 
                    className="hud-button"
                    title="Toggle simulation center gravity strength"
                  >
                    <span>🧲 <span className="hide-on-mobile">Grav: {getGravityLabel()}</span></span>
                  </button>
                  
                  <button 
                    onClick={() => setIsSimulating(!isSimulating)} 
                    className="hud-button"
                    title={isSimulating ? "Pause Physics Simulation" : "Resume Physics Simulation"}
                  >
                    <span>{isSimulating ? '⏸️' : '▶️'} <span className="hide-on-mobile">{isSimulating ? 'Pause' : 'Play'}</span></span>
                  </button>
                  
                  <button 
                    onClick={handleRecenter} 
                    className="hud-button"
                    title="Recenter camera position and zoom scale"
                  >
                    <span>🎯 <span className="hide-on-mobile">Recenter</span></span>
                  </button>
                  
                  <button 
                    onClick={handleResetLayout} 
                    className="hud-button"
                    title="Reset simulation layout back to static coordinates"
                  >
                    <span>🔄 <span className="hide-on-mobile">Reset</span></span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB D: TABLE LEDGER */}
            {activeTab === 'table' && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5 font-bold">Stakeholder Agency</th>
                      <th className="pb-2.5 font-bold">Jurisdiction</th>
                      <th className="pb-2.5 font-bold">One Health Domain</th>
                      <th className="pb-2.5 font-bold">Authority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStakeholders.map(s => (
                      <tr 
                        key={s.id}
                        onClick={() => setSelectedSelectedStakeholder(s)}
                        className={`border-b border-[var(--border-light)] border-opacity-40 hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors ${
                          selectedStakeholder?.id === s.id ? 'bg-[var(--accent-primary)] bg-opacity-10' : ''
                        }`}
                      >
                        <td className="py-2.5 font-semibold flex items-center gap-1.5 text-[var(--text-primary)]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDomainColor(s.domain) }} />
                          {s.name} ({s.shortName})
                        </td>
                        <td className="py-2.5 text-[var(--text-secondary)]">{s.level === 'Provincial/Territorial' ? `${s.province} (P)` : s.level}</td>
                        <td className="py-2.5 font-semibold" style={{ color: getDomainColor(s.domain) }}>{s.domain}</td>
                        <td className="py-2.5 text-[var(--text-secondary)]">{s.authority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- SLIDE-OUT GLASSMORPHIC DETAIL DRAWER (DOCKED INSIDE CANVAS) --- */}
            <div className={`detail-drawer ${selectedStakeholder || selectedResearcher ? 'open' : ''}`}>
              {selectedStakeholder ? (
                <div className="flex-1 flex flex-col p-5 overflow-y-auto h-full scrollbar-thin">
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border-light)] pb-3 mb-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Stakeholder Profile</span>
                    </div>
                    <button 
                      onClick={() => setSelectedSelectedStakeholder(null)}
                      className="p-1 hover:bg-[var(--bg-main)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer border border-transparent hover:border-[var(--border-light)] transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body details */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: getDomainColor(selectedStakeholder.domain) }}>
                          {selectedStakeholder.domain}
                        </span>
                        <span className="text-[9px] bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-light)] px-2 py-0.5 rounded font-bold uppercase">
                          {selectedStakeholder.level}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-bold font-heading leading-tight m-0 text-[var(--text-primary)]">
                        {selectedStakeholder.name}
                      </h3>
                      <div className="text-xs text-[var(--text-secondary)] font-mono font-bold mt-1 bg-[var(--bg-main)] border border-[var(--border-light)] px-2 py-1 rounded inline-block">
                        Acronym: {selectedStakeholder.shortName}
                      </div>
                      
                      {selectedStakeholder.province && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Jurisdiction Province: <strong>{selectedStakeholder.province}</strong></span>
                        </div>
                      )}
                    </div>

                    <hr className="border-[var(--border-light)] m-0" />

                    {/* Mandate */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                        Surveillance Mandate
                      </span>
                      <p className="text-xs leading-relaxed m-0 text-[var(--text-secondary)] font-medium font-sans">
                        {selectedStakeholder.mandate}
                      </p>
                    </div>

                    <hr className="border-[var(--border-light)] m-0" />

                    {/* Direct Connections */}
                    {directStakeholderConnections.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                          Direct Connections (Click to traverse)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {directStakeholderConnections.map(conn => (
                            <button
                              key={conn.id}
                              onClick={() => {
                                setSelectedSelectedStakeholder(conn.stakeholder);
                                setSelectedResearcher(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] transition-all"
                              title={conn.label}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDomainColor(conn.stakeholder.domain) }} />
                              {conn.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Affiliated H5N1 Investigators */}
                    {stakeholderAffiliatedResearchers.length > 0 && (
                      <div>
                        <hr className="border-[var(--border-light)] mb-3 mt-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                          Affiliated Lead Researchers (Click to view)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {stakeholderAffiliatedResearchers.map(conn => (
                            <button
                              key={conn.id}
                              onClick={() => {
                                setSelectedResearcher(conn.researcher);
                                setSelectedSelectedStakeholder(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] transition-all"
                              title={conn.label}
                            >
                              <Users className="w-3 h-3 text-[var(--accent-primary)]" />
                              {conn.name.replace("Dr. ", "")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <hr className="border-[var(--border-light)] m-0" />

                    {/* Authority tags */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                        Functional Authority Group
                      </span>
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg"
                        style={{ 
                          backgroundColor: `${getAuthorityColor(selectedStakeholder.authority)}15`, 
                          color: getAuthorityColor(selectedStakeholder.authority),
                          border: `1px solid ${getAuthorityColor(selectedStakeholder.authority)}30`
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: getAuthorityColor(selectedStakeholder.authority) }} />
                        {selectedStakeholder.authority}
                      </span>
                    </div>

                    <hr className="border-[var(--border-light)] m-0" />

                    {/* Involved Steps */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                        Involvement in Cycle Steps
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStakeholder.roles.map(role => (
                          <span 
                            key={role} 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                          >
                            <CheckCircle className="w-3 h-3 text-[var(--accent-success)]" />
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="pt-3 border-t border-[var(--border-light)] mt-6 shrink-0 flex items-center justify-between text-xs font-semibold">
                    <a 
                      href={`mailto:${selectedStakeholder.contact}`}
                      className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Inquire Direct</span>
                    </a>
                    <a 
                      href={selectedStakeholder.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      <span>Official Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              ) : selectedResearcher ? (
                <div className="flex-1 flex flex-col p-5 overflow-y-auto h-full scrollbar-thin">
                  
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border-light)] pb-3 mb-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
                      <Award className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Researcher Profile</span>
                    </div>
                    <button 
                      onClick={() => setSelectedResearcher(null)}
                      className="p-1 hover:bg-[var(--bg-main)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer border border-transparent hover:border-[var(--border-light)] transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body details */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: getResearcherDomainColor(selectedResearcher.domain) }}>
                          {selectedResearcher.domain}
                        </span>
                        <span className="text-[9px] bg-indigo-500 bg-opacity-10 text-[var(--accent-primary)] border border-[var(--accent-primary)] border-opacity-20 px-2 py-0.5 rounded font-bold uppercase">
                          Academic Core
                        </span>
                      </div>
                      
                      <h3 className="text-base font-bold font-heading leading-tight m-0 text-[var(--text-primary)]">
                        {selectedResearcher.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] font-medium m-0 mt-1">
                        {selectedResearcher.title}
                      </p>
                      <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1 bg-[var(--bg-main)] border border-[var(--border-light)] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{selectedResearcher.institution}</span>
                      </div>
                    </div>

                    <hr className="border-[var(--border-light)] m-0" />

                    {/* Bio */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                        Scientific Bio & Focus
                      </span>
                      <p className="text-xs leading-relaxed m-0 text-[var(--text-secondary)] font-medium font-sans">
                        {selectedResearcher.bio}
                      </p>
                    </div>

                    {/* Academic Publications */}
                    {selectedResearcher.papers.length > 0 && (
                      <>
                        <hr className="border-[var(--border-light)] m-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                            Recent H5N1 Publications (Last 12-24 Mos)
                          </span>
                          <div className="flex flex-col gap-2">
                            {selectedResearcher.papers.map((paper, idx) => (
                              <div 
                                key={idx} 
                                className="flex gap-2 p-2 bg-[var(--bg-main)] border border-[var(--border-light)] rounded-lg"
                              >
                                <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight font-medium text-[var(--text-secondary)]">
                                  {paper}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Affiliated Networks */}
                    {researcherNetworks.length > 0 && (
                      <>
                        <hr className="border-[var(--border-light)] m-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                            Affiliated Networks (Click to view)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {researcherNetworks.map(net => (
                              <button
                                key={net.id}
                                onClick={() => {
                                  setSelectedSelectedStakeholder(net.stakeholder);
                                  setSelectedResearcher(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] transition-all"
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDomainColor(net.stakeholder.domain) }} />
                                {net.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Collaborating Investigators */}
                    {directResearcherConnections.length > 0 && (
                      <>
                        <hr className="border-[var(--border-light)] m-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                            Collaborators (Click to view)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {directResearcherConnections.map(conn => (
                              <button
                                key={conn.id}
                                onClick={() => {
                                  if (conn.researcher) {
                                    setSelectedResearcher(conn.researcher);
                                    setSelectedSelectedStakeholder(null);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] transition-all"
                                title={conn.label}
                                disabled={!conn.researcher}
                              >
                                <Users className="w-3 h-3 text-[var(--accent-primary)]" />
                                {conn.name.replace("Dr. ", "")}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="pt-3 border-t border-[var(--border-light)] mt-6 shrink-0 flex items-center justify-between text-xs font-semibold">
                    <a 
                      href={`mailto:${selectedResearcher.email}`}
                      className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Contact Email</span>
                    </a>
                    <a 
                      href={selectedResearcher.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      <span>Lab Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <HelpCircle className="w-10 h-10 text-[var(--text-muted)] mb-2" />
                  <span className="text-xs text-[var(--text-muted)]">No entity selected.</span>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>

      {/* --- FOOTER & SYSTEM BADGES --- */}
      <footer className="glass-panel mx-4 mb-4 mt-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-muted)] border border-[var(--border-light)] rounded-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Surveillance Mapping Suite • Canadian One Health Project</span>
          <span className="hide-on-mobile">•</span>
          <span className="hide-on-mobile">Licensed under Creative Commons BY-NC-ND 4.0</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 md:mt-0 font-medium">
          <Cpu className="w-4 h-4 text-[var(--text-muted)]" />
          <span>React 19 + TypeScript + Google Cloud Firestore Integration</span>
        </div>
      </footer>

    </div>
  );
}
