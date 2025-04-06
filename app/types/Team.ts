export interface Profile {
  name: string;
  bio: string;
  commits: number;
  contributions: number;
  location: string;
  email: string;
  x?: string;
  badges: {
    type: string;
    color: string;
  }[];
  pfpUrl: string;
  repos: number;
}
