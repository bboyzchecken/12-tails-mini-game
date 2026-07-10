import type { Direction } from '@12tails/shared/events';
import data from './data/characters.json';

export interface CharacterDef {
  id: string;
  name: string;
  tribe: string;
  color: string;
  sheet: string;
  faces: string;
  thumb: string;
}

export interface FrameSpec {
  w: number;
  h: number;
  cols: number;
  rows: number;
  rowOrder: Direction[];
  idleCol: number;
  walkCols: number[];
}

export interface FaceSpec {
  w: number;
  h: number;
  emotes: string[];
}

export const FRAME = data.frame as FrameSpec;
export const FACE = data.face as FaceSpec;
export const CHARACTERS = data.characters as CharacterDef[];

export function getCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
