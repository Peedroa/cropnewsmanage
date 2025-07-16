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