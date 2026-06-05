/**
 * Core type definitions for the terminal system.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** A single line rendered in the terminal output. */
export type Line = {
  type: 'command' | 'output' | 'ascii';
  text: string;
  isTyping?: boolean;
  isAuth?: boolean;
  isHire?: boolean;
  isAdmin?: boolean;
};

/** Callback to append a single line to the terminal. */
export type AddLine = (line: Line) => void;

/** Callback to append multiple lines with a staggered delay. */
export type AddLines = (lines: Line[], gapMs?: number) => void;

/** Multi-step hire wizard state. */
export type HireStep = null | 'name' | 'email' | 'msg' | 'ok';

/** Authentication flow state. */
export type AuthStep = null | 'password';

/** Data collected during the hire wizard flow. */
export interface HireData {
  name: string;
  email: string;
  msg: string;
}

/** Dependencies passed to command handlers. */
export interface CommandContext {
  addLine: AddLine;
  addLines: AddLines;
  isAdmin: boolean;
  visitorName: string;
  history: string[];
  supabase: SupabaseClient;
  sanitizeHTML: (str: string) => string;
}
