import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, Flower2, Heart, House, Images, Leaf, LockKeyhole, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useBloomVault } from "@/hooks/use-bloom-vault";
import { dayKey, id, type Entry } from "@/lib/bloom-types";
import VaultGate from "@/components/bloom/VaultGate";
import Home from "@/components/bloom/Home";
import Journal from "@/components/bloom/Journal";
import Vision from "@/components/bloom/Vision";
import Calendar from "@/components/bloom/Calendar";
import Jess from "@/components/bloom/Jess";
import Settings from "@/components/bloom/Settings";

const pages = [{ label: "Home", icon: House, detail: "Your little today" }, { label: "Journal", icon: BookOpen, detail: "Let your words bloom" }, { label: "Vision", icon: Images, detail: "Dream a little bigger" }, { label: "Calendar", icon: CalendarDays, detail: "Find your own rhythm" }, { label: "Jess", icon: Sparkles, detail: "A little company" }];
const Index = () => {
  const vault = useBloomVault();
  const [page, setPage] = useState("Home");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const reminderHistory = useRef(new Set<string>());
  const lastReminder = useRef(0);
  const scroll = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => { document.title = "Bloom · Your little world"; }, []);
  useEffect(() => {
    if (vault.data && !wasOpen.current) { setPage("Home"); setEntryId(null); toast("Hi there beautiful, You look gorgeous today.", { description: "Remember Bigger Dreams, Same Girl.", duration: 6500, icon: <Heart size={17} className="text-primary"/> }); }
    wasOpen.current = !!vault.data;
  }, [vault.data]);
  useEffect(() => { window.scrollTo(0, 0); scroll.current?.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    if (!vault.data) return;
    const data = vault.data;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      const now = new Date(), time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const quiet = data.quietStart > data.quietEnd ? time >= data.quietStart || time < data.quietEnd : time >= data.quietStart && time < data.quietEnd;
      if (quiet || Date.now() - lastReminder.current < 30 * 60 * 1000) return;
      for (const reminder of data.reminders) {
        const reminderKey = `${dayKey()}-${reminder.id}`;
        const eligible = reminder.frequency === "Daily" || (reminder.frequency === "Weekdays" ? now.getDay() > 0 && now.getDay() < 6 : now.getDay() === 1);
        if (reminder.enabled && eligible && reminder.time === time && !reminderHistory.current.has(reminderKey)) {
          toast(reminder.text, { description: "A gentle little nudge from Bloom.", icon: <Flower2 size={17} className="text-primary"/>, duration: 8000 });
          reminderHistory.current.add(reminderKey); lastReminder.current = Date.now(); break;
        }
      }
    };
    check(); const timer = window.setInterval(check, 15000); return () => clearInterval(timer);
  }, [vault.data]);
  function write(prompt?: string) {
    const paragraph = document.createElement("p"); paragraph.textContent = prompt || "";
    const entry: Entry = { id: id(), date: new Date().toISOString(), title: "", html: prompt ? paragraph.outerHTML : "", mood: "", tags: "", favorite: false };
    vault.update(current => ({ ...current, entries: [entry, ...current.entries] })); setEntryId(entry.id); setPage("Journal");
  }
  if (!vault.data) return <VaultGate vault={vault}/>;
  return <div className="min-h-screen bg-[var(--cream)] lg:flex">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col border-r border-[#eaded5] bg-[#fbf7f2] px-6 py-8 lg:flex xl:w-[270px]"><div className="flex items-center gap-2 px-3 text-primary"><Flower2 size={31} strokeWidth={1.2}/><span className="font-display text-[43px] leading-none">bloom<span className="text-[var(--gold)]">.</span></span></div><p className="mt-3 px-3 text-[10px] tracking-[0.12em] text-muted-foreground">YOUR OWN LITTLE WORLD</p><div className="mb-6 mt-10 flex items-center gap-3 rounded-2xl border border-[#ecddd3] bg-[#f5ede5] px-4 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4cbd0] bg-[#f0dfe1] font-display text-xl text-primary">P</span><div><span className="font-display text-lg">Philile's sanctuary</span><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><LockKeyhole size={9}/>Just for you</p></div></div><nav className="space-y-2">{pages.map(({ label, icon: Icon, detail }) => <button key={label} onClick={() => setPage(label)} aria-current={page === label ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors ${page === label ? "bg-[#f0e0e1] text-primary" : "text-muted-foreground hover:bg-[#f3ece4]"}`}><Icon size={19} strokeWidth={1.5}/><span className="flex-1"><span className="block text-sm">{label === "Home" ? "Today" : label}</span>{page === label && <span className="mt-0.5 block text-[9px] opacity-80">{detail}</span>}</span>{page === label && <span className="h-1.5 w-1.5 rounded-full bg-primary"/>}</button>)}</nav><div className="mt-auto pt-8"><div className="relative overflow-hidden rounded-2xl bg-[#eeece2] p-5"><Leaf size={39} strokeWidth={0.8} className="mb-3 text-[var(--sage-dark)]"/><p className="font-display text-xl italic leading-snug text-[var(--sage-dark)]">Bigger dreams.<br/>Same girl.</p><p className="mt-3 text-[10px] leading-5 text-muted-foreground">You have always had<br/>everything it takes.</p></div><button onClick={() => setSettings(true)} className="mt-5 flex w-full items-center gap-3 px-4 py-2 text-xs text-muted-foreground"><Settings2 size={16}/>My sanctuary settings</button></div></aside>
    <div ref={scroll} className="w-full lg:ml-[246px] xl:ml-[270px]"><header className="flex h-[82px] items-center justify-between border-b border-[#e9ded5] px-5 sm:px-9 lg:px-10"><div className="flex items-center gap-2 lg:hidden"><Flower2 size={26} className="text-primary" strokeWidth={1.2}/><span className="font-display text-3xl text-primary">bloom.</span></div><div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><Leaf size={15} className="text-[var(--sage)]"/>A beautiful day to be you.</div><div className="flex items-center gap-4"><span className="hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:flex"><LockKeyhole size={11}/>Private & peaceful</span><button onClick={() => setSettings(true)} aria-label="Open sanctuary settings and reminders" className="rounded-full border border-border bg-white p-2.5 text-muted-foreground"><Settings2 size={16}/></button><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0c4cb] bg-[#f0dfe1] font-display text-lg text-primary">P</span></div></header>
    <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-6 sm:px-9 lg:px-10 lg:pb-10 lg:pt-8">{vault.error && <div role="alert" className="mb-5 rounded-2xl bg-rose-100 p-4 text-sm text-rose-900">{vault.error}<button onClick={() => setSettings(true)} className="ml-2 underline">Save an encrypted backup</button></div>}{page === "Home" && <Home vault={vault} navigate={setPage} write={() => write()}/>} {page === "Journal" && <Journal vault={vault} selected={entryId} select={setEntryId}/>} {page === "Vision" && <Vision vault={vault}/>} {page === "Calendar" && <Calendar vault={vault}/>} {page === "Jess" && <Jess write={write}/>}</main></div>
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#e6d7cd] bg-[#fcf8f3]/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden">{pages.map(({ label, icon: Icon }) => <button key={label} aria-current={page === label ? "page" : undefined} onClick={() => setPage(label)} className={`flex min-h-12 min-w-14 flex-col items-center gap-1.5 rounded-2xl px-4 py-2 text-[10px] transition-colors ${page === label ? "bg-[var(--blush)] text-primary" : "text-muted-foreground"}`}><Icon size={20} strokeWidth={1.5}/>{label}</button>)}</nav>
    <Settings vault={vault} open={settings} onOpenChange={setSettings}/>
  </div>;
};
export default Index;
