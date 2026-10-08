import { dataSchema, type BloomData } from "./bloom-types";
import { z } from "zod";

const envelopeSchema = z.object({ version: z.literal(1), salt: z.array(z.number().int().min(0).max(255)).length(16), iv: z.array(z.number().int().min(0).max(255)).length(12), ciphertext: z.array(z.number().int().min(0).max(255)) });
export type Envelope = z.infer<typeof envelopeSchema>;
const database = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("bloom-private-vault", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("vault");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error("Your browser could not open the vault storage."));
});
export async function readVault(): Promise<Envelope | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vault", "readonly");
    const request = tx.objectStore("vault").get("personal");
    request.onsuccess = () => { try { resolve(request.result ? envelopeSchema.parse(request.result) : null); } catch { reject(new Error("The stored vault could not be read. Restore an encrypted backup.")); } };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
export async function writeVault(envelope: Envelope) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("vault", "readwrite");
    tx.objectStore("vault").put(envelope, "personal");
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(new Error("Could not save on this device. Keep Bloom open and export a backup.")); };
    tx.onabort = () => { db.close(); reject(new Error("Saving was interrupted. Keep Bloom open and export a backup.")); };
  });
}
export async function deriveKey(password: string, salt: number[]) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: new Uint8Array(salt), iterations: 310000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encrypt(data: BloomData, key: CryptoKey, salt: number[]): Promise<Envelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  return { version: 1, salt, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}
export async function decrypt(value: unknown, password: string) {
  const envelope = envelopeSchema.parse(value);
  const key = await deriveKey(password, envelope.salt);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(envelope.iv) }, key, new Uint8Array(envelope.ciphertext));
  return { key, envelope, data: dataSchema.parse(JSON.parse(new TextDecoder().decode(plaintext))) };
}
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function photoData(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Choose a photo smaller than 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas"); canvas.width = img.width * ratio; canvas.height = img.height * ratio;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
