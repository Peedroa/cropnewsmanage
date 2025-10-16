export interface NewsClip {
  title: string;
  pointers: string;
  date?: string;
  url?: string;
  content?: string;
  id?: string;
  author?: string;
  section?: string;
  fulltext?: string;
}

export interface NewsSource {
  name: string;
  path: string;
  clips: NewsClip[];
  expanded: boolean;
}

export interface DirectoryStructure {
  sources: NewsSource[];
  selectedSource: string | null;
  selectedClip: NewsClip | null;
}

// Tipos para o visualizador de áreas de recorte
export interface CropArea {
  width: string;
  y: string;
  page: string;
  order: number;
  x: string;
  height: string;
}

export interface ClipData {
  fulltext: string;
  time: number;
  advertisment: string | null;
  section: (string | null)[];
  author: string[];
  audiencia: string | null;
  clip_area: string[];
  fulltitle: string;
  pointers: string;
  domain: string;
  product_id: string;
  tirada: string | null;
  url: string | null;
  yyyymmddhhmm: string;
  cropAreas: CropArea[];
  category: string | null;
  paper: string;
  edicion: string | null;
  clip_name: string;
  country: string;
  difusion: string | null;
  lang: string;
  yyyymmddhhmmss: string | null;
  doc_category: string | null;
  fulltext_plus?: string;
  nydate: string;
  uc_std: string | null;
  title: string;
  clip_ratio: string[];
  pages: string;
} 