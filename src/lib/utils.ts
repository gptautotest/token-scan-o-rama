
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LAMPORTS_PER_SOL = 1000000000;

export function formatSol(value: number): string {
  if (typeof value !== 'number') return '0 SOL';
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}k SOL`;
  }
  
  if (value >= 1) {
    return `${value.toFixed(2)} SOL`;
  }
  
  // Handle small values more gracefully
  if (value < 0.01) {
    return `${value.toExponential(2)} SOL`;
  }
  
  return `${value.toFixed(4)} SOL`;
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// For generating a fallback image for tokens without images
export function getFallbackImage(symbol?: string): string {
  return `https://raw.githubusercontent.com/pump-fun-official/pump-fun-bot/main/assets/lungnorla.webp`;
}

export async function fetchTokenImage(token: any): Promise<string | undefined> {
  if (!token.uri) return undefined;
  
  try {
    const response = await fetch(token.uri);
    if (response.ok) {
      const data = await response.json();
      return data.image;
    }
  } catch (error) {
    console.error("Error fetching token image:", error);
  }
  
  return undefined;
}
