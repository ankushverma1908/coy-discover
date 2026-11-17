/** Public profile shape. Deliberately has no "liked you" field anywhere. */
export interface Profile {
  id: number;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  location: string;
  interests: string[];
}
export type SwipeAction = 'like' | 'pass';
export interface SwipeResult { matched: boolean; match?: Profile }
export const ME = 'me';
