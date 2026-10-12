export type ExamType = 'upsc' | 'neet_pg' | 'banking';

export interface TopicProgress {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'revised' | 'mastered';
  confidence: number; // 1-5
  notes?: string;
  pyqCount?: number;
  lastRevised?: string;
}

export interface SubjectModule {
  id: string;
  name: string;
  category: string;
  color: string;
  topics: TopicProgress[];
}

export interface ExamConfig {
  id: ExamType;
  title: string;
  targetYear: string;
  badge: string;
  description: string;
  modules: SubjectModule[];
}

export const EXAMS_DATA: Record<ExamType, ExamConfig> = {
  upsc: {
    id: 'upsc',
    title: 'UPSC Civil Services 2027',
    targetYear: '2027',
    badge: 'CivilsPath',
    description: 'Prelims GS 1 & CSAT, Mains GS 1-4, Essay, and Anthropology Optional',
    modules: [
      {
        id: 'anthro_paper1',
        name: 'Anthropology Paper I',
        category: 'Optional Mains',
        color: '#6366f1',
        topics: [
          { id: 'u1', name: 'Unit 1: Meaning, Scope & Branches of Anthropology', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u2', name: 'Unit 2: Human Evolution & Primatology', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u3', name: 'Unit 3: Prehistoric Archaeology (Palaeo-Chalc)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u4', name: 'Unit 4: Culture, Society & Cultural Relativism', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u5', name: 'Unit 5: Marriage, Family, Descent & Kinship', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u6', name: 'Unit 6: Economic & Political Organisation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u7', name: 'Unit 7: Religion, Magic, Ritual & Symbolism', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u8', name: 'Unit 8: Anthropological Theories (Tylor, Boas, Malinowski)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u9', name: 'Unit 9: Research Methods & Fieldwork Ethics', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u10', name: 'Unit 10: Human Genetics & Population Variation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u11', name: 'Unit 11: Human Growth, Development & Maturation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u12', name: 'Unit 12: Biological Variation & Climate Adaptation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'u13', name: 'Unit 13: Applied Anthropology (Medical, Forensic, Policy)', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'anthro_paper2',
        name: 'Anthropology Paper II',
        category: 'Optional Mains',
        color: '#8b5cf6',
        topics: [
          { id: 'p2_u1', name: 'Unit 1: Evolution of Indian Culture & Indus Civilisation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u2', name: 'Unit 2: Demographic Profile & Linguistic Diversity', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u3', name: 'Unit 3: Traditional Indian Social System (Varna, Caste, Jajmani)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u4', name: 'Unit 4: Indian Religious & Cultural Pluralism', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u5', name: 'Unit 5: Colonial & Indological Approaches to Indian Society', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u6', name: 'Unit 6: Indian Tribal Communities & Social Organisation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u7', name: 'Unit 7: Tribal Issues, Land Alienation, FRA & PVTGs', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'p2_u8', name: 'Unit 8: Anthropology in Public Policy, Health & Rural Dev', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'prelims_gs',
        name: 'General Studies Paper I',
        category: 'Prelims',
        color: '#06b6d4',
        topics: [
          { id: 'gs1_polity', name: 'Indian Polity & Governance (Constitution, Rights, Judiciary)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'gs1_history', name: 'Modern Indian History & Freedom Struggle', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'gs1_geo', name: 'Physical, Human & Economic Geography', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'gs1_env', name: 'Environment, Biodiversity & Climate Change', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'gs1_econ', name: 'Indian Economy & Sustainable Development', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'gs1_sci', name: 'Science & Technology (Biotech, Space, AI)', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'prelims_csat',
        name: 'CSAT Paper II',
        category: 'Prelims',
        color: '#f59e0b',
        topics: [
          { id: 'csat_rc', name: 'Reading Comprehension & Critical Inferences', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'csat_lr', name: 'Logical Reasoning & Analytical Ability', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'csat_quant', name: 'Basic Numeracy, Percentages & Data Interpretation', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      }
    ]
  },
  neet_pg: {
    id: 'neet_pg',
    title: 'NEET PG 2027',
    targetYear: '2027',
    badge: 'MedTrack PG',
    description: 'All 20 Pre-Clinical, Para-Clinical & Clinical MBBS Subjects',
    modules: [
      {
        id: 'med_pedia',
        name: 'Pediatrics',
        category: 'Clinical',
        color: '#ef4444',
        topics: [
          { id: 'ped_growth', name: 'Growth, Development & Milestones', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ped_neonatology', name: 'Neonatology & Neonatal Resuscitation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ped_nutrition', name: 'Nutrition, SAM & Vitamin Deficiencies', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ped_infections', name: 'Pediatric Infections & National Immunisation', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ped_cardio', name: 'Congenital Heart Diseases & Shunts', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'med_radio',
        name: 'Radiology',
        category: 'Clinical',
        color: '#3b82f6',
        topics: [
          { id: 'rad_chest', name: 'Chest X-Ray Patterns & Silhouette Sign', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'rad_neuro', name: 'CT & MRI Brain (Strokes, Hemorrhages, Tumors)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'rad_msk', name: 'Musculoskeletal X-Ray & Fracture Patterns', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'rad_contrast', name: 'Contrast Media & Radiation Safety Rules', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'med_biochem',
        name: 'Biochemistry',
        category: 'Pre-Clinical',
        color: '#10b981',
        topics: [
          { id: 'bio_metabolism', name: 'Carbohydrate Metabolism (Glycolysis, Krebs, G6PD)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'bio_lipid', name: 'Lipid Metabolism, Lipoproteins & Storage Disorders', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'bio_protein', name: 'Amino Acids, Urea Cycle & Inborn Errors', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'bio_genetics', name: 'Molecular Biology, DNA Replication, PCR & Blots', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'med_anatomy_path',
        name: 'Anatomy & Pathology',
        category: 'Para-Clinical',
        color: '#f97316',
        topics: [
          { id: 'ana_neuro', name: 'Neuroanatomy & Circle of Willis Strokes', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'path_neoplasia', name: 'Neoplasia, Tumor Markers & Paraneoplastic', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'path_hematology', name: 'RBC Disorders, Leukemias & Peripheral Smears', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'path_renal', name: 'Nephrotic vs Nephritic Glomerulopathies', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'med_pharmacology',
        name: 'Pharmacology',
        category: 'Para-Clinical',
        color: '#8b5cf6',
        topics: [
          { id: 'pharm_ans', name: 'Autonomic Nervous System Agonists & Antagonists', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'pharm_anti', name: 'Antimicrobials, Mechanisms & Resistance', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'pharm_cvs', name: 'Antihypertensives, Antiarrhythmics & Heart Failure', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      }
    ]
  },
  banking: {
    id: 'banking',
    title: 'Bank & Insurance 2027',
    targetYear: '2027',
    badge: 'BankPrep OS',
    description: 'SBI PO/Clerk, IBPS PO/Clerk, RBI Grade B & Insurance Exams',
    modules: [
      {
        id: 'bank_quant',
        name: 'Quantitative Aptitude',
        category: 'Core Speed',
        color: '#ec4899',
        topics: [
          { id: 'q_di', name: 'Data Interpretation (Table, Pie, Bar, Caselet)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'q_arith', name: 'Arithmetic (Percentages, Profit/Loss, SI/CI, Ratio)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'q_series', name: 'Number Series (Missing & Wrong Term)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'q_quad', name: 'Quadratic Equations & Inequalities', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'q_speed', name: 'Simplification, Approximation & Vedic Math Tricks', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'bank_reasoning',
        name: 'Reasoning Ability',
        category: 'Core Speed',
        color: '#8b5cf6',
        topics: [
          { id: 'r_puzzle', name: 'High-Level Floor, Box, Month & Day Puzzles', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'r_seating', name: 'Linear, Circular & Square Seating Arrangements', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'r_syllogism', name: 'Syllogism (Only a few, Possibility cases)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'r_ineq', name: 'Coded & Direct Inequalities', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'r_critical', name: 'Critical Reasoning (Statement & Assumptions, Course of Action)', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'bank_english',
        name: 'English Language',
        category: 'Language',
        color: '#06b6d4',
        topics: [
          { id: 'eng_rc', name: 'Reading Comprehension (Financial & Economic Editorials)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'eng_cloze', name: 'Cloze Test & Fillers', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'eng_error', name: 'Grammar & Error Spotting (Subject-Verb, Tenses)', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'eng_para', name: 'Para Jumbles & Sentence Rearrangement', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      },
      {
        id: 'bank_ga',
        name: 'General & Banking Awareness',
        category: 'Mains Decider',
        color: '#f59e0b',
        topics: [
          { id: 'ga_banking', name: 'RBI Monetary Policy, Banking Terms & Regulatory Norms', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ga_current', name: 'Last 6 Months Current Affairs & National Schemes', status: 'not_started', confidence: 1, pyqCount: 0 },
          { id: 'ga_static', name: 'Static Financial Awareness (HQ, Dams, Parks, Capitals)', status: 'not_started', confidence: 1, pyqCount: 0 }
        ]
      }
    ]
  }
};
