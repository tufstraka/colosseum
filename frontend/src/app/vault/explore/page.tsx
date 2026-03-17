"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { ConnectButton } from "@/components/wallet/connect-button";
import { GENOME_VAULT_ABI, GENOME_VAULT_ADDRESS, MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from "@/lib/contracts/genome-vault";
import {
  Dna, Search, Brain, Shield, DollarSign, Clock, Eye, Lock,
  Loader2, CheckCircle, ArrowRight, Droplets, Coins, AlertTriangle,
  SlidersHorizontal, X, ChevronDown, Users, Activity, FileText,
  MapPin, Calendar, Microscope, Heart, Beaker, Pill
} from "lucide-react";

// ============================================================
// REALISTIC DEMO DATASETS
// ============================================================

interface GenomicDataset {
  id: number;
  category: number;
  categoryLabel: string;
  categoryIcon: string;
  owner: string;
  price: string;
  accessWindow: string;
  accessHours: number;
  totalQueries: number;
  totalEarnings: string;
  verified: boolean;

  // Demographics
  ethnicity: string;
  sex: string;
  ageRange: string;
  bmi: string;

  // Clinical
  primaryCondition: string;
  icdCodes: string[];
  comorbidities: string[];
  medications: string[];
  familyHistory: string[];

  // Genetic
  sequencingPlatform: string;
  coverage: string;
  variantsOfInterest: string[];
  genePanel: string[];

  // Study Metadata
  consentType: string;
  collectionDate: string;
  institution: string;
  biobank: string;
  sampleType: string;
  qualityScore: number; // 0-100

  // Tags for search
  tags: string[];
  description: string;
}

const DATASETS: GenomicDataset[] = [
  {
    id: 1,
    category: 0,
    categoryLabel: "Whole Genome",
    categoryIcon: "🧬",
    owner: "0x742d...f44e",
    price: "45.00",
    accessWindow: "48h",
    accessHours: 48,
    totalQueries: 23,
    totalEarnings: "1,035.00",
    verified: true,
    ethnicity: "European (Northern)",
    sex: "Male",
    ageRange: "35-44",
    bmi: "24.1 (Normal)",
    primaryCondition: "Type 2 Diabetes Mellitus",
    icdCodes: ["E11.9", "E11.65"],
    comorbidities: ["Hypertension (I10)", "Hyperlipidemia (E78.5)"],
    medications: ["Metformin 1000mg", "Lisinopril 10mg", "Atorvastatin 20mg"],
    familyHistory: ["Father: T2DM, MI at 58", "Mother: Breast cancer at 62"],
    sequencingPlatform: "Illumina NovaSeq 6000",
    coverage: "30x",
    variantsOfInterest: ["TCF7L2 rs7903146", "KCNJ11 E23K", "PPARG Pro12Ala"],
    genePanel: ["TCF7L2", "KCNJ11", "PPARG", "SLC30A8", "CDKN2A/B", "IGF2BP2"],
    consentType: "Broad research consent",
    collectionDate: "2025-08",
    institution: "Nordic Biobank Consortium",
    biobank: "UK Biobank equivalent",
    sampleType: "Whole blood",
    qualityScore: 94,
    tags: ["diabetes", "t2dm", "european", "male", "cardiovascular", "metabolic", "whole-genome", "30x"],
    description: "Complete WGS from T2DM patient with well-characterized metabolic phenotype. Includes longitudinal HbA1c data (5 years). Notable TCF7L2 risk variant carrier."
  },
  {
    id: 2,
    category: 3,
    categoryLabel: "Microbiome",
    categoryIcon: "🦠",
    owner: "0x8ba1...BA72",
    price: "18.00",
    accessWindow: "24h",
    accessHours: 24,
    totalQueries: 41,
    totalEarnings: "738.00",
    verified: true,
    ethnicity: "East Asian (Japanese)",
    sex: "Female",
    ageRange: "28-34",
    bmi: "21.3 (Normal)",
    primaryCondition: "Irritable Bowel Syndrome (IBS-D)",
    icdCodes: ["K58.0"],
    comorbidities: ["Generalized Anxiety Disorder (F41.1)"],
    medications: ["Rifaximin 550mg (completed)", "Probiotics (VSL#3)"],
    familyHistory: ["Mother: Celiac disease", "Sister: IBS"],
    sequencingPlatform: "Illumina MiSeq (16S V3-V4)",
    coverage: "50,000 reads/sample",
    variantsOfInterest: [],
    genePanel: [],
    consentType: "Disease-specific research",
    collectionDate: "2025-11",
    institution: "Tokyo Gut Microbiome Project",
    biobank: "JMDB (Japan Microbiome Database)",
    sampleType: "Stool (3 timepoints over 6 months)",
    qualityScore: 89,
    tags: ["ibs", "microbiome", "gut-health", "asian", "female", "anxiety", "longitudinal", "16S"],
    description: "Longitudinal 16S rRNA gut microbiome profiling across 3 timepoints. Pre/post rifaximin treatment. Includes FODMAP diet adherence logs and Bristol stool chart data."
  },
  {
    id: 3,
    category: 7,
    categoryLabel: "Clinical Trial",
    categoryIcon: "💊",
    owner: "0x1CBd...c9Ec",
    price: "85.00",
    accessWindow: "72h",
    accessHours: 72,
    totalQueries: 7,
    totalEarnings: "595.00",
    verified: true,
    ethnicity: "African American",
    sex: "Female",
    ageRange: "45-54",
    bmi: "28.7 (Overweight)",
    primaryCondition: "Triple-Negative Breast Cancer (Stage IIA)",
    icdCodes: ["C50.911", "Z17.0"],
    comorbidities: ["Obesity (E66.01)", "Vitamin D deficiency (E55.9)"],
    medications: ["Pembrolizumab 200mg q3w", "Carboplatin AUC 5", "Paclitaxel 80mg/m²"],
    familyHistory: ["Mother: Ovarian cancer at 51 (BRCA1+)", "Aunt: Breast cancer at 48"],
    sequencingPlatform: "Foundation Medicine FoundationOne CDx",
    coverage: "500x (targeted)",
    variantsOfInterest: ["BRCA1 c.68_69delAG", "TP53 R248W", "PIK3CA E545K"],
    genePanel: ["BRCA1", "BRCA2", "TP53", "PIK3CA", "PTEN", "CDH1", "PALB2", "ATM", "CHEK2"],
    consentType: "Clinical trial consent (NCT04191135 equivalent)",
    collectionDate: "2025-06",
    institution: "Howard University Cancer Center",
    biobank: "NCI Genomic Data Commons",
    sampleType: "Tumor biopsy + matched normal blood",
    qualityScore: 97,
    tags: ["breast-cancer", "tnbc", "oncology", "brca1", "immunotherapy", "clinical-trial", "african-american", "female"],
    description: "Comprehensive genomic profiling from TNBC clinical trial. Paired tumor/normal. BRCA1 pathogenic variant carrier. Includes treatment response data (pCR achieved after neoadjuvant immunotherapy)."
  },
  {
    id: 4,
    category: 2,
    categoryLabel: "SNP Array",
    categoryIcon: "📊",
    owner: "0xde0B...bEEF",
    price: "8.00",
    accessWindow: "12h",
    accessHours: 12,
    totalQueries: 156,
    totalEarnings: "1,248.00",
    verified: false,
    ethnicity: "South Asian (Indian)",
    sex: "Male",
    ageRange: "50-59",
    bmi: "26.8 (Overweight)",
    primaryCondition: "Coronary Artery Disease",
    icdCodes: ["I25.10", "I25.110"],
    comorbidities: ["Type 2 Diabetes (E11.9)", "Chronic Kidney Disease Stage 3a (N18.3)"],
    medications: ["Aspirin 81mg", "Clopidogrel 75mg", "Metoprolol 50mg", "Insulin Glargine 24u"],
    familyHistory: ["Father: MI at 45 (fatal)", "Brother: CABG at 52"],
    sequencingPlatform: "Illumina Global Screening Array v3",
    coverage: "650,000 SNPs",
    variantsOfInterest: ["9p21.3 rs1333049", "LPA rs10455872", "PCSK9 rs11591147"],
    genePanel: ["LDLR", "APOB", "PCSK9", "LPA", "SORT1"],
    consentType: "Broad research consent",
    collectionDate: "2024-12",
    institution: "AIIMS New Delhi Cardiology",
    biobank: "IndiGen Programme",
    sampleType: "Whole blood",
    qualityScore: 82,
    tags: ["cardiovascular", "cad", "heart-disease", "south-asian", "male", "diabetes", "ckd", "snp-array", "pharmacogenomics"],
    description: "SNP genotyping array from premature CAD patient with strong family history. High polygenic risk score for CAD. South Asian ancestry — important for underrepresented population studies."
  },
  {
    id: 5,
    category: 4,
    categoryLabel: "Epigenetic",
    categoryIcon: "🧪",
    owner: "0xAb5...D123",
    price: "35.00",
    accessWindow: "24h",
    accessHours: 24,
    totalQueries: 12,
    totalEarnings: "420.00",
    verified: true,
    ethnicity: "Hispanic/Latino",
    sex: "Female",
    ageRange: "60-69",
    bmi: "23.5 (Normal)",
    primaryCondition: "Alzheimer's Disease (Early Onset)",
    icdCodes: ["G30.0", "F02.80"],
    comorbidities: ["Depression (F32.1)", "Insomnia (G47.00)"],
    medications: ["Donepezil 10mg", "Memantine 20mg", "Sertraline 100mg"],
    familyHistory: ["Mother: Alzheimer's at 65", "Father: Parkinson's at 72"],
    sequencingPlatform: "Illumina EPIC v2 Methylation Array",
    coverage: "935,000 CpG sites",
    variantsOfInterest: ["APOE ε4/ε4 homozygous", "TREM2 R47H"],
    genePanel: ["APOE", "TREM2", "APP", "PSEN1", "PSEN2", "MAPT", "GRN"],
    consentType: "Neurodegenerative disease research",
    collectionDate: "2025-03",
    institution: "Mayo Clinic Arizona",
    biobank: "ADNI (Alzheimer's Disease Neuroimaging Initiative)",
    sampleType: "Whole blood + CSF",
    qualityScore: 91,
    tags: ["alzheimers", "neurodegeneration", "epigenetics", "methylation", "apoe4", "hispanic", "female", "aging", "dementia"],
    description: "EPIC methylation array from early-onset AD patient. APOE ε4/ε4 homozygous (high risk). Includes matched CSF biomarkers (Aβ42, p-tau, NfL). Part of longitudinal aging study with 3 years of cognitive assessments."
  },
  {
    id: 6,
    category: 0,
    categoryLabel: "Whole Genome",
    categoryIcon: "🧬",
    owner: "0x9f3C...A891",
    price: "55.00",
    accessWindow: "48h",
    accessHours: 48,
    totalQueries: 5,
    totalEarnings: "275.00",
    verified: true,
    ethnicity: "Ashkenazi Jewish",
    sex: "Female",
    ageRange: "30-39",
    bmi: "22.0 (Normal)",
    primaryCondition: "Hereditary Breast/Ovarian Cancer Syndrome",
    icdCodes: ["Z15.01", "Z80.3"],
    comorbidities: [],
    medications: ["Oral contraceptives (risk reduction)"],
    familyHistory: ["Mother: Breast cancer at 42 (BRCA2+)", "Grandmother: Ovarian cancer at 55"],
    sequencingPlatform: "Illumina NovaSeq X Plus",
    coverage: "60x",
    variantsOfInterest: ["BRCA2 c.5946delT (pathogenic)", "CHEK2 I157T (VUS)"],
    genePanel: ["BRCA1", "BRCA2", "PALB2", "RAD51C", "RAD51D", "ATM", "CHEK2", "TP53"],
    consentType: "Cancer genetics research",
    collectionDate: "2025-09",
    institution: "Memorial Sloan Kettering",
    biobank: "MSK-IMPACT Registry",
    sampleType: "Whole blood",
    qualityScore: 98,
    tags: ["brca2", "hereditary-cancer", "breast-cancer", "ovarian-cancer", "ashkenazi", "female", "preventive", "genetics", "60x"],
    description: "High-depth WGS from unaffected BRCA2 carrier undergoing enhanced screening. Ashkenazi Jewish ancestry (important for founder mutation studies). Clean sample with no treatment confounders."
  },
  {
    id: 7,
    category: 5,
    categoryLabel: "Proteomic",
    categoryIcon: "🧫",
    owner: "0x4521...E7F2",
    price: "40.00",
    accessWindow: "24h",
    accessHours: 24,
    totalQueries: 9,
    totalEarnings: "360.00",
    verified: true,
    ethnicity: "European (Mediterranean)",
    sex: "Male",
    ageRange: "55-64",
    bmi: "31.2 (Obese Class I)",
    primaryCondition: "Non-Alcoholic Steatohepatitis (NASH)",
    icdCodes: ["K75.81", "K76.0"],
    comorbidities: ["Metabolic Syndrome (E88.81)", "Obstructive Sleep Apnea (G47.33)", "Gout (M10.9)"],
    medications: ["Pioglitazone 30mg", "Vitamin E 800IU", "Allopurinol 300mg"],
    familyHistory: ["Father: Cirrhosis at 68", "Mother: T2DM"],
    sequencingPlatform: "SomaScan 7K Proteomic Assay",
    coverage: "7,000 proteins",
    variantsOfInterest: ["PNPLA3 I148M (rs738409)", "TM6SF2 E167K"],
    genePanel: ["PNPLA3", "TM6SF2", "MBOAT7", "HSD17B13", "MARC1"],
    consentType: "Liver disease research",
    collectionDate: "2025-07",
    institution: "Barcelona Liver Research Centre",
    biobank: "European NAFLD Registry",
    sampleType: "Serum + liver biopsy (Fibroscan: F3)",
    qualityScore: 93,
    tags: ["nash", "liver", "proteomic", "metabolic-syndrome", "obesity", "european", "male", "biomarkers"],
    description: "Comprehensive proteomic profiling (7,000 proteins) from biopsy-confirmed NASH patient (F3 fibrosis). Matched liver biopsy histology available. Key for biomarker discovery in NASH drug development."
  },
  {
    id: 8,
    category: 9,
    categoryLabel: "Medical Imaging",
    categoryIcon: "📷",
    owner: "0xBB12...9D44",
    price: "25.00",
    accessWindow: "12h",
    accessHours: 12,
    totalQueries: 34,
    totalEarnings: "850.00",
    verified: true,
    ethnicity: "African (Nigerian)",
    sex: "Male",
    ageRange: "40-49",
    bmi: "27.4 (Overweight)",
    primaryCondition: "Glioblastoma Multiforme (GBM)",
    icdCodes: ["C71.1", "D49.6"],
    comorbidities: ["Seizure disorder (G40.909)"],
    medications: ["Temozolomide", "Levetiracetam 1000mg", "Dexamethasone 4mg"],
    familyHistory: ["No significant family history of cancer"],
    sequencingPlatform: "3T MRI (Siemens Magnetom Prisma)",
    coverage: "T1, T2, FLAIR, DWI, perfusion, spectroscopy",
    variantsOfInterest: ["IDH1 wildtype", "MGMT unmethylated", "EGFR amplified"],
    genePanel: ["IDH1", "IDH2", "MGMT", "EGFR", "TERT", "ATRX", "TP53"],
    consentType: "Neuro-oncology research",
    collectionDate: "2025-10",
    institution: "Lagos University Teaching Hospital",
    biobank: "African Brain Tumor Registry",
    sampleType: "MRI sequences + matched tumor genomics",
    qualityScore: 88,
    tags: ["glioblastoma", "brain-tumor", "neuro-oncology", "imaging", "mri", "african", "male", "egfr", "ai-training"],
    description: "Multimodal MRI dataset with matched genomic profiling from GBM patient. African ancestry — critically underrepresented in neuro-oncology datasets. Ideal for training AI diagnostic models."
  },
  {
    id: 9,
    category: 8,
    categoryLabel: "EHR",
    categoryIcon: "🏥",
    owner: "0xCC98...1A23",
    price: "12.00",
    accessWindow: "6h",
    accessHours: 6,
    totalQueries: 89,
    totalEarnings: "1,068.00",
    verified: true,
    ethnicity: "Mixed/Multiracial",
    sex: "Non-binary",
    ageRange: "25-34",
    bmi: "19.8 (Normal)",
    primaryCondition: "Systemic Lupus Erythematosus (SLE)",
    icdCodes: ["M32.10", "M32.14", "M32.15"],
    comorbidities: ["Lupus nephritis (N08)", "Raynaud's (I73.0)", "Antiphospholipid syndrome (D68.61)"],
    medications: ["Hydroxychloroquine 400mg", "Mycophenolate 2g", "Prednisone 10mg", "Belimumab 200mg SC"],
    familyHistory: ["Sister: Rheumatoid arthritis", "Mother: Hypothyroidism"],
    sequencingPlatform: "Epic EHR (FHIR R4 export)",
    coverage: "8 years of records",
    variantsOfInterest: ["HLA-DR2", "HLA-DR3", "IRF5 rs2004640"],
    genePanel: ["HLA-DRB1", "IRF5", "STAT4", "ITGAM", "BLK"],
    consentType: "Autoimmune disease research",
    collectionDate: "2025-05",
    institution: "Johns Hopkins Lupus Center",
    biobank: "Lupus Family Registry",
    sampleType: "Structured EHR data (FHIR)",
    qualityScore: 85,
    tags: ["lupus", "sle", "autoimmune", "ehr", "longitudinal", "nephritis", "rare-disease", "immunology"],
    description: "8-year longitudinal EHR from SLE patient with lupus nephritis. Includes flare timelines, lab trends (complement, anti-dsDNA, proteinuria), medication changes, and hospitalization records. FHIR-formatted."
  },
  {
    id: 10,
    category: 1,
    categoryLabel: "Exome",
    categoryIcon: "🔬",
    owner: "0xEE67...5B90",
    price: "30.00",
    accessWindow: "24h",
    accessHours: 24,
    totalQueries: 18,
    totalEarnings: "540.00",
    verified: true,
    ethnicity: "Middle Eastern (Iranian)",
    sex: "Male",
    ageRange: "3-11",
    bmi: "15.2 (Normal for age)",
    primaryCondition: "Primary Ciliary Dyskinesia",
    icdCodes: ["Q33.0", "J47.9"],
    comorbidities: ["Situs inversus totalis (Q89.3)", "Chronic sinusitis (J32.9)", "Bronchiectasis (J47.9)"],
    medications: ["Azithromycin 250mg 3x/week", "Hypertonic saline nebulization", "Chest physiotherapy"],
    familyHistory: ["Parents: Consanguineous (first cousins)", "Sibling: Similar symptoms (untested)"],
    sequencingPlatform: "Illumina NextSeq 2000",
    coverage: "100x (clinical exome)",
    variantsOfInterest: ["DNAH5 c.4348C>T (p.Arg1450*) homozygous"],
    genePanel: ["DNAH5", "DNAI1", "DNAH11", "CCDC39", "CCDC40", "RSPH4A", "RSPH9"],
    consentType: "Rare disease research (parental consent)",
    collectionDate: "2025-01",
    institution: "Tehran Children's Hospital",
    biobank: "Iranian Rare Disease Registry",
    sampleType: "Whole blood (trio: proband + parents)",
    qualityScore: 96,
    tags: ["rare-disease", "pediatric", "ciliary-dyskinesia", "consanguinity", "middle-eastern", "male", "exome", "trio", "situs-inversus"],
    description: "Clinical exome sequencing (trio) from consanguineous family. Homozygous DNAH5 nonsense variant confirmed pathogenic. Situs inversus totalis. Important for rare disease variant databases and consanguinity studies."
  },
];

// ============================================================
// FILTER OPTIONS
// ============================================================

const CONDITION_CATEGORIES = [
  { label: "All Conditions", value: "all" },
  { label: "🫀 Cardiovascular", value: "cardiovascular", conditions: ["cad", "heart-disease", "cardiovascular"] },
  { label: "🧠 Neurological", value: "neurological", conditions: ["alzheimers", "neurodegeneration", "glioblastoma", "brain-tumor", "dementia"] },
  { label: "🎗️ Oncology", value: "oncology", conditions: ["breast-cancer", "tnbc", "brca1", "brca2", "hereditary-cancer", "glioblastoma", "ovarian-cancer"] },
  { label: "🩸 Metabolic", value: "metabolic", conditions: ["diabetes", "t2dm", "nash", "metabolic-syndrome", "obesity"] },
  { label: "🦴 Autoimmune", value: "autoimmune", conditions: ["lupus", "sle", "autoimmune", "immunology"] },
  { label: "🧬 Rare Disease", value: "rare", conditions: ["rare-disease", "ciliary-dyskinesia", "situs-inversus"] },
  { label: "🦠 GI/Microbiome", value: "gi", conditions: ["ibs", "microbiome", "gut-health", "liver"] },
];

const ETHNICITY_OPTIONS = [
  "All", "European", "East Asian", "South Asian", "African", "African American",
  "Hispanic/Latino", "Middle Eastern", "Ashkenazi Jewish", "Mixed/Multiracial"
];

const SEX_OPTIONS = ["All", "Male", "Female", "Non-binary"];
const AGE_OPTIONS = ["All", "0-17", "18-29", "30-44", "45-59", "60+"];
const DATA_TYPE_OPTIONS = [
  { label: "All Types", value: -1 },
  { label: "🧬 Whole Genome", value: 0 },
  { label: "🔬 Exome", value: 1 },
  { label: "📊 SNP Array", value: 2 },
  { label: "🦠 Microbiome", value: 3 },
  { label: "🧪 Epigenetic", value: 4 },
  { label: "🧫 Proteomic", value: 5 },
  { label: "💊 Clinical Trial", value: 7 },
  { label: "🏥 EHR", value: 8 },
  { label: "📷 Imaging", value: 9 },
];

const QUALITY_OPTIONS = ["All", "90+", "80+", "70+"];
const CONSENT_OPTIONS = ["All", "Broad research", "Disease-specific", "Clinical trial"];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ExplorePage() {
  const { address, isConnected } = useAccount();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [dataType, setDataType] = useState(-1);
  const [conditionCategory, setConditionCategory] = useState("all");
  const [ethnicity, setEthnicity] = useState("All");
  const [sex, setSex] = useState("All");
  const [ageRange, setAgeRange] = useState("All");
  const [minQuality, setMinQuality] = useState("All");
  const [consentType, setConsentType] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc" | "quality" | "queries">("relevance");

  // UI State
  const [selectedDataset, setSelectedDataset] = useState<GenomicDataset | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState<string | null>(null);

  // USDC Balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: usdcAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address ? [address, GENOME_VAULT_ADDRESS] : undefined,
  });

  // Filter logic
  const filteredDatasets = useMemo(() => {
    let results = [...DATASETS];

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(d =>
        d.tags.some(t => t.includes(q)) ||
        d.description.toLowerCase().includes(q) ||
        d.primaryCondition.toLowerCase().includes(q) ||
        d.icdCodes.some(c => c.toLowerCase().includes(q)) ||
        d.variantsOfInterest.some(v => v.toLowerCase().includes(q)) ||
        d.genePanel.some(g => g.toLowerCase().includes(q)) ||
        d.medications.some(m => m.toLowerCase().includes(q)) ||
        d.institution.toLowerCase().includes(q)
      );
    }

    // Data type
    if (dataType !== -1) {
      results = results.filter(d => d.category === dataType);
    }

    // Condition category
    if (conditionCategory !== "all") {
      const cat = CONDITION_CATEGORIES.find(c => c.value === conditionCategory);
      if (cat?.conditions) {
        results = results.filter(d => d.tags.some(t => cat.conditions!.includes(t)));
      }
    }

    // Demographics
    if (ethnicity !== "All") {
      results = results.filter(d => d.ethnicity.toLowerCase().includes(ethnicity.toLowerCase()));
    }
    if (sex !== "All") {
      results = results.filter(d => d.sex === sex);
    }
    if (ageRange !== "All") {
      results = results.filter(d => {
        if (ageRange === "0-17") return d.ageRange.startsWith("0-") || d.ageRange.startsWith("3-") || d.ageRange.startsWith("1");
        if (ageRange === "18-29") return d.ageRange.startsWith("18-") || d.ageRange.startsWith("2");
        if (ageRange === "30-44") return d.ageRange.startsWith("3") || d.ageRange.startsWith("4");
        if (ageRange === "45-59") return d.ageRange.startsWith("45-") || d.ageRange.startsWith("5");
        if (ageRange === "60+") return d.ageRange.startsWith("6") || d.ageRange.startsWith("7") || d.ageRange.startsWith("8");
        return true;
      });
    }

    // Quality
    if (minQuality !== "All") {
      const minQ = parseInt(minQuality);
      results = results.filter(d => d.qualityScore >= minQ);
    }

    // Consent
    if (consentType !== "All") {
      results = results.filter(d => d.consentType.toLowerCase().includes(consentType.toLowerCase().replace("research", "").trim()));
    }

    // Verified
    if (verifiedOnly) {
      results = results.filter(d => d.verified);
    }

    // Max price
    if (maxPrice) {
      results = results.filter(d => parseFloat(d.price) <= parseFloat(maxPrice));
    }

    // Sort
    if (sortBy === "price-asc") results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === "price-desc") results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === "quality") results.sort((a, b) => b.qualityScore - a.qualityScore);
    if (sortBy === "queries") results.sort((a, b) => b.totalQueries - a.totalQueries);

    return results;
  }, [searchQuery, dataType, conditionCategory, ethnicity, sex, ageRange, minQuality, consentType, verifiedOnly, maxPrice, sortBy]);

  const activeFilterCount = [
    dataType !== -1, conditionCategory !== "all", ethnicity !== "All",
    sex !== "All", ageRange !== "All", minQuality !== "All",
    consentType !== "All", verifiedOnly, maxPrice !== ""
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDataType(-1); setConditionCategory("all"); setEthnicity("All");
    setSex("All"); setAgeRange("All"); setMinQuality("All");
    setConsentType("All"); setVerifiedOnly(false); setMaxPrice(""); setSearchQuery("");
  };

  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    setFaucetResult(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.success) {
        setFaucetResult(`✅ ${data.minted} minted! Balance: ${data.newBalance}`);
        refetchBalance();
      } else {
        setFaucetResult(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setFaucetResult(`❌ ${e.message}`);
    }
    setFaucetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Genome Vault</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/vault" className="text-sm text-zinc-400 hover:text-white transition-colors">My Vault</Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Genomic Data Marketplace</h1>
              <p className="text-zinc-400">
                {DATASETS.length} datasets from {new Set(DATASETS.map(d => d.institution)).size} institutions · {DATASETS.reduce((s, d) => s + d.totalQueries, 0)} queries completed
              </p>
            </div>
            {isConnected && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">USDC Balance</p>
                    <p className="text-sm font-semibold text-white">{usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0.00"} USDC</p>
                  </div>
                  <button onClick={handleFaucet} disabled={faucetLoading}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 disabled:opacity-50 flex items-center gap-1.5 border border-blue-500/30">
                    {faucetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
                    Faucet
                  </button>
                </div>
                {faucetResult && <p className="text-xs text-zinc-400">{faucetResult}</p>}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by condition, gene, variant, ICD code, medication, institution..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors border ${
                showFilters ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Advanced Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Condition Category */}
                <FilterSelect label="Condition Area" value={conditionCategory}
                  onChange={setConditionCategory}
                  options={CONDITION_CATEGORIES.map(c => ({ label: c.label, value: c.value }))} />

                {/* Data Type */}
                <FilterSelect label="Data Type" value={dataType.toString()}
                  onChange={(v) => setDataType(parseInt(v))}
                  options={DATA_TYPE_OPTIONS.map(d => ({ label: d.label, value: d.value.toString() }))} />

                {/* Ethnicity */}
                <FilterSelect label="Ethnicity/Ancestry" value={ethnicity}
                  onChange={setEthnicity}
                  options={ETHNICITY_OPTIONS.map(e => ({ label: e, value: e }))} />

                {/* Sex */}
                <FilterSelect label="Sex" value={sex}
                  onChange={setSex}
                  options={SEX_OPTIONS.map(s => ({ label: s, value: s }))} />

                {/* Age */}
                <FilterSelect label="Age Range" value={ageRange}
                  onChange={setAgeRange}
                  options={AGE_OPTIONS.map(a => ({ label: a, value: a }))} />

                {/* Quality */}
                <FilterSelect label="Quality Score" value={minQuality}
                  onChange={setMinQuality}
                  options={QUALITY_OPTIONS.map(q => ({ label: q === "All" ? "All" : `≥${q.replace("+","")}`, value: q }))} />

                {/* Consent */}
                <FilterSelect label="Consent Type" value={consentType}
                  onChange={setConsentType}
                  options={CONSENT_OPTIONS.map(c => ({ label: c, value: c }))} />

                {/* Max Price */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Max Price (USDC)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Verified */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm text-zinc-300">AI Verified only</span>
                  </label>
                </div>
              </div>

              {/* Quick condition searches */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Quick search:</p>
                <div className="flex flex-wrap gap-2">
                  {["BRCA2", "diabetes", "Alzheimer's", "rare disease", "oncology", "lupus", "NASH", "pediatric", "African", "longitudinal"].map(q => (
                    <button key={q} onClick={() => setSearchQuery(q.toLowerCase())}
                      className="px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded text-xs hover:bg-zinc-700 hover:text-white transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sort + Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-400">
              <strong className="text-white">{filteredDatasets.length}</strong> datasets found
            </p>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none">
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="quality">Quality Score</option>
              <option value="queries">Most Purchased</option>
            </select>
          </div>

          {/* Dataset Cards */}
          <div className="space-y-4">
            {filteredDatasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                isExpanded={expandedId === dataset.id}
                onToggle={() => setExpandedId(expandedId === dataset.id ? null : dataset.id)}
                onPurchase={() => setSelectedDataset(dataset)}
              />
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No datasets match your criteria</h3>
              <p className="text-zinc-400 mb-4">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="text-emerald-400 hover:text-emerald-300 text-sm">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Purchase Modal */}
      {selectedDataset && (
        <PurchaseModal
          dataset={selectedDataset}
          usdcBalance={usdcBalance as bigint}
          usdcAllowance={usdcAllowance as bigint}
          onClose={() => setSelectedDataset(null)}
          onRefresh={refetchBalance}
        />
      )}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DatasetCard({ dataset, isExpanded, onToggle, onPurchase }: {
  dataset: GenomicDataset; isExpanded: boolean; onToggle: () => void; onPurchase: () => void;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors overflow-hidden">
      {/* Main row */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Left: Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-2xl">{dataset.categoryIcon}</span>
              <span className="text-lg font-semibold text-white">{dataset.categoryLabel}</span>
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs">{dataset.sequencingPlatform.split(" ")[0]}</span>
              {dataset.verified && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
              <QualityBadge score={dataset.qualityScore} />
            </div>

            <p className="text-sm text-zinc-300 mb-2">{dataset.description}</p>

            {/* Key metadata row */}
            <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-3">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {dataset.ethnicity}</span>
              <span>·</span>
              <span>{dataset.sex}, {dataset.ageRange}y</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {dataset.primaryCondition}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {dataset.institution}</span>
            </div>

            {/* ICD codes + genes */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {dataset.icdCodes.map(c => (
                <span key={c} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-mono">{c}</span>
              ))}
              {dataset.variantsOfInterest.slice(0, 3).map(v => (
                <span key={v} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">{v.split(" ")[0]}</span>
              ))}
              {dataset.genePanel.slice(0, 4).map(g => (
                <span key={g} className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs font-mono">{g}</span>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {dataset.tags.slice(0, 6).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-xs">{tag}</span>
              ))}
              {dataset.tags.length > 6 && (
                <span className="text-xs text-zinc-600">+{dataset.tags.length - 6} more</span>
              )}
            </div>
          </div>

          {/* Right: Stats + Actions */}
          <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${dataset.price}</p>
              <p className="text-xs text-zinc-500">per query · {dataset.accessWindow} access</p>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-sm text-zinc-400">{dataset.totalQueries} queries sold</p>
              <p className="text-xs text-zinc-500">${dataset.totalEarnings} earned</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onToggle}
                className="px-3 py-2 border border-zinc-700 text-zinc-400 rounded-lg text-sm hover:bg-zinc-800 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {isExpanded ? "Less" : "Details"}
              </button>
              <button onClick={onPurchase}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center gap-1">
                Purchase <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-zinc-800 pt-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Clinical Details */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-400" /> Clinical Profile
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="Primary Dx" value={dataset.primaryCondition} />
                <DetailRow label="ICD-10" value={dataset.icdCodes.join(", ")} />
                {dataset.comorbidities.length > 0 && (
                  <DetailRow label="Comorbidities" value={dataset.comorbidities.join("; ")} />
                )}
                {dataset.medications.length > 0 && (
                  <DetailRow label="Medications" value={dataset.medications.join(", ")} />
                )}
                {dataset.familyHistory.length > 0 && (
                  <DetailRow label="Family Hx" value={dataset.familyHistory.join("; ")} />
                )}
                <DetailRow label="BMI" value={dataset.bmi} />
              </div>
            </div>

            {/* Genetic Details */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-purple-400" /> Genetic / Technical
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="Platform" value={dataset.sequencingPlatform} />
                <DetailRow label="Coverage" value={dataset.coverage} />
                {dataset.variantsOfInterest.length > 0 && (
                  <DetailRow label="Key Variants" value={dataset.variantsOfInterest.join("; ")} />
                )}
                {dataset.genePanel.length > 0 && (
                  <DetailRow label="Gene Panel" value={dataset.genePanel.join(", ")} />
                )}
                <DetailRow label="Sample Type" value={dataset.sampleType} />
                <DetailRow label="Quality" value={`${dataset.qualityScore}/100`} />
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" /> Study Metadata
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="Institution" value={dataset.institution} />
                <DetailRow label="Biobank" value={dataset.biobank} />
                <DetailRow label="Consent" value={dataset.consentType} />
                <DetailRow label="Collected" value={dataset.collectionDate} />
                <DetailRow label="Demographics" value={`${dataset.ethnicity}, ${dataset.sex}, ${dataset.ageRange}y`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-500">{label}: </span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}

function QualityBadge({ score }: { score: number }) {
  const color = score >= 90 ? "emerald" : score >= 80 ? "yellow" : "orange";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
      color === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
      "bg-orange-500/20 text-orange-400"
    }`}>
      Q:{score}
    </span>
  );
}

function PurchaseModal({ dataset, usdcBalance, usdcAllowance, onClose, onRefresh }: {
  dataset: GenomicDataset; usdcBalance?: bigint; usdcAllowance?: bigint;
  onClose: () => void; onRefresh: () => void;
}) {
  const [queries, setQueries] = useState(1);
  const { writeContract: approveUSDC, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { writeContract: purchaseAccess, data: purchaseTxHash, isPending: isPurchasing } = useWriteContract();
  const { isSuccess: purchaseSuccess } = useWaitForTransactionReceipt({ hash: purchaseTxHash });

  const totalCost = parseFloat(dataset.price) * queries;
  const totalCostUnits = parseUnits(totalCost.toFixed(6), 6);
  const hasEnough = usdcBalance ? usdcBalance >= totalCostUnits : false;
  const needsApproval = usdcAllowance ? usdcAllowance < totalCostUnits : true;

  const handleApprove = () => {
    approveUSDC({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [GENOME_VAULT_ADDRESS, maxUint256],
    });
  };

  const handlePurchase = () => {
    purchaseAccess({
      address: GENOME_VAULT_ADDRESS,
      abi: GENOME_VAULT_ABI,
      functionName: "purchaseAccess",
      args: [BigInt(dataset.id), BigInt(queries)],
    });
  };

  if (purchaseSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Access Granted!</h3>
          <p className="text-zinc-400 mb-2">AI anonymization is processing your data access.</p>
          <p className="text-sm text-zinc-500 mb-6">
            {dataset.categoryLabel} — {dataset.primaryCondition}<br />
            {queries} quer{queries > 1 ? "ies" : "y"} · {dataset.accessWindow} access window
          </p>
          <a href={`https://blockscout-testnet.polkadot.io/tx/${purchaseTxHash}`} target="_blank"
            className="text-emerald-400 hover:text-emerald-300 text-sm block mb-6">View on Explorer →</a>
          <button onClick={onClose} className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Purchase Data Access</h3>
          <p className="text-sm text-zinc-400">{dataset.categoryIcon} {dataset.categoryLabel} — {dataset.primaryCondition}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-zinc-950 rounded-xl space-y-2">
            <div className="flex justify-between"><span className="text-zinc-400">Dataset</span><span className="text-white">{dataset.categoryLabel}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Condition</span><span className="text-white text-right text-sm">{dataset.primaryCondition}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Institution</span><span className="text-white">{dataset.institution}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Quality</span><span className="text-white">{dataset.qualityScore}/100</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Price/Query</span><span className="text-white">${dataset.price} USDC</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Access Window</span><span className="text-white">{dataset.accessWindow}</span></div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Number of Queries</label>
            <input type="number" value={queries} onChange={(e) => setQueries(Math.max(1, parseInt(e.target.value) || 1))}
              min="1" max="100"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex justify-between">
              <span className="text-emerald-400 font-medium">Total</span>
              <span className="text-white font-bold text-lg">${totalCost.toFixed(2)} USDC</span>
            </div>
          </div>

          {!hasEnough && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">
                Insufficient USDC ({usdcBalance ? formatUnits(usdcBalance, 6) : "0"}). Use the faucet.
              </p>
            </div>
          )}

          <div className="p-3 bg-zinc-800/50 rounded-xl flex items-start gap-2">
            <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400">
              All data is anonymized by AI before delivery. Identifying information is stripped.
              The data owner retains the right to revoke access at any time.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800">Cancel</button>
          {needsApproval && !approveSuccess ? (
            <button onClick={handleApprove} disabled={isApproving || !hasEnough}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {isApproving ? "Approving..." : "Approve USDC"}
            </button>
          ) : (
            <button onClick={handlePurchase} disabled={isPurchasing || !hasEnough}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              {isPurchasing ? "Processing..." : `Pay $${totalCost.toFixed(2)} USDC`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
