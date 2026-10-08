import { useEffect, useRef, useState } from "react";
import { initialData, type BloomData } from "@/lib/bloom-types";
import { decrypt, deriveKey, encrypt, readVault, writeVault, type Envelope } from "@/lib/bloom-vault";

export function useBloomVault() {
  const [data, setData] = useState<BloomData | null>(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Saved privately");
  const [error, setError] = useState("");
  const key = useRef<CryptoKey | null>(null);
  const salt = useRef<number[]>([]);
  const latest = useRef<BloomData | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const savedRevision = useRef(0);
  useEffect(() => { readVault().then(value => setExists(!!value)).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => { if (savedRevision.current !== revision.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, []);
  async function unlock(password: string) {
    setError("");
    const value = await readVault();
    if (!value) throw new Error("No vault found. Create your sanctuary first.");
    const result = await decrypt(value, password);
    key.current = result.key; salt.current = result.envelope.salt; latest.current = result.data;
    setData(result.data); setStatus("Saved privately");
  }
  async function create(password: string) {
    if (await readVault()) throw new Error("A vault already exists. Unlock it instead.");
    const newSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const newKey = await deriveKey(password, newSalt);
    const value = initialData();
    await writeVault(await encrypt(value, newKey, newSalt));
    key.current = newKey; salt.current = newSalt; latest.current = value;
    setExists(true); setData(value); setError("");
  }
  function update(transform: (current: BloomData) => BloomData) {
    if (!latest.current || !key.current) return;
    const next = transform(latest.current);
    latest.current = next; setData(next); setStatus("Saving…");
    const currentRevision = ++revision.current;
    const currentKey = key.current;
    const currentSalt = salt.current;
    queue.current = queue.current.catch(() => {}).then(async () => {
      if (currentRevision !== revision.current) return;
      await writeVault(await encrypt(next, currentKey, currentSalt));
      savedRevision.current = currentRevision;
      if (revision.current === currentRevision) { setStatus("Saved privately"); setError(""); }
    }).catch(e => { setStatus("Not saved — please back up"); setError(e.message); });
  }
  async function backup(): Promise<Envelope> {
    await queue.current;
    if (!latest.current || !key.current) throw new Error("Unlock your vault first.");
    return encrypt(latest.current, key.current, salt.current);
  }
  async function lock() {
    await queue.current;
    if (revision.current !== savedRevision.current) throw new Error("Your latest changes aren't saved. Export a backup before locking.");
    key.current = null; latest.current = null; setData(null);
  }
  async function restore(value: unknown, password: string) {
    const result = await decrypt(value, password);
    await writeVault(result.envelope);
    key.current = result.key; salt.current = result.envelope.salt; latest.current = result.data;
    revision.current = 0; savedRevision.current = 0;
    setData(result.data); setExists(true); setError(""); setStatus("Saved privately");
  }
  return { data, exists, loading, status, error, unlock, create, update, backup, lock, restore };
}
export type Vault = ReturnType<typeof useBloomVault>;
