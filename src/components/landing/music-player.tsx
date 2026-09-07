"use client";

import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from "react";
import { Music, Music2, Pause, Play, Plus, SkipBack, SkipForward, Square, Trash2, X } from "lucide-react";

interface Track {
  id: string;
  name: string;
  url: string;
}

export interface MusicPlayerHandle {
  open: () => void;
  pick: () => void;
  close: () => void;
}

const GRADS = [
  "from-[#03EABC] to-[#0263D1]",
  "from-fuchsia-500 to-[#0263D1]",
  "from-amber-400 to-rose-500",
  "from-cyan-400 to-violet-600",
  "from-lime-400 to-emerald-600",
  "from-purple-500 to-pink-500",
];

const fmt = (s: number) => {
  const m = Math.floor((Number.isFinite(s) ? s : 0) / 60);
  const ss = Math.floor((Number.isFinite(s) ? s : 0) % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
};

export default forwardRef<MusicPlayerHandle, object>(function MusicPlayer(_props, ref) {
  const [visible, setVisible] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tracksRef = useRef<Track[]>([]);
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    currentIdRef.current = currentId;
  }, [currentId]);

  const current = tracks.find((t) => t.id === currentId) ?? null;

  /* Keep the <audio> element mounted forever — playback survives the
     panel being closed and reachable across the 3D view transitions. */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => {
      const list = tracksRef.current;
      const idx = list.findIndex((t) => t.id === currentIdRef.current);
      const nxt = list[(idx + 1) % list.length];
      if (nxt) {
        setCurrentId(nxt.id);
        setPlaying(true);
      }
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  /* Apply play/pause whenever the track or playing state changes. */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  }, [currentId, playing]);

  /* Revoke the object URLs and stop audio on unmount. */
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) a.pause();
      for (const t of tracksRef.current) URL.revokeObjectURL(t.url);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setVisible(true),
      pick: () => {
        setVisible(true);
        if (fileRef.current) setTimeout(() => fileRef.current?.click(), 60);
      },
      close: () => setVisible(false),
    }),
    [],
  );

  const playTrack = (id: string) => {
    if (id === currentId) {
      setPlaying((p) => !p);
      return;
    }
    setCurrentId(id);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!current) return;
    if (currentId === current.id) setPlaying((p) => !p);
    else {
      setCurrentId(current.id);
      setPlaying(true);
    }
  };

  const stop = () => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setProgress(0);
    setPlaying(false);
  };

  const skip = (dir: 1 | -1) => {
    const list = tracks;
    if (!list.length) return;
    const idx = list.findIndex((t) => t.id === currentId);
    if (dir === 1 && idx < 0) {
      setCurrentId(list[0].id);
      setPlaying(true);
      return;
    }
    const nxt = list[(idx + dir + list.length) % list.length];
    setCurrentId(nxt?.id ?? list[0].id);
    setPlaying(true);
  };

  const onFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    const next: Track[] = [];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("audio/")) continue;
      next.push({
        id: `${f.name}-${f.size}-${Date.now()}`,
        name: f.name.replace(/\.[^.]+$/, ""),
        url: URL.createObjectURL(f),
      });
    }
    if (!next.length) return;
    setTracks((prev) => [...prev, ...next]);
    setCurrentId(next[0].id);
    setPlaying(true);
  };

  const removeTrack = (id: string) => {
    const t = tracks.find((x) => x.id === id);
    if (t) URL.revokeObjectURL(t.url);
    setTracks((prev) => prev.filter((x) => x.id !== id));
    if (currentId === id) {
      setCurrentId(null);
      setPlaying(false);
      setProgress(0);
    }
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = v;
    setProgress(v);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <audio ref={audioRef} className="hidden" />

      {visible && (
        <div dir="rtl" className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            aria-label="إغلاق"
            onClick={() => setVisible(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
          />

          <div className="pointer-events-none absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl animate-float" />
          <div className="pointer-events-none absolute bottom-[10%] right-[6%] h-44 w-44 rounded-full bg-primary/25 blur-3xl animate-float [animation-delay:1.6s]" />

          <div className="relative w-full max-w-md rounded-[32px] bg-[linear-gradient(150deg,rgba(3,234,188,0.5),rgba(255,255,255,0.07)_35%,rgba(168,85,247,0.18)_60%,rgba(3,234,188,0.4))] p-px shadow-[0_24px_80px_-20px_rgba(3,234,188,0.3),0_32px_64px_-16px_rgba(0,0,0,0.65)] animate-modal-pop">
            <div className="flex h-[min(680px,88dvh)] flex-col overflow-hidden rounded-[31px] bg-background/90 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(168,85,247,0.12),transparent_70%)]" />

              {/* Header */}
              <div className="relative z-10 flex items-center gap-3 border-b border-white/10 px-5 pb-4 pt-5">
                <div className="relative h-11 w-11 shrink-0">
                  <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-primary via-transparent to-fuchsia-500 opacity-70 animate-ring-spin" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-fuchsia-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] animate-orb-pulse">
                    <Music2 className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-extrabold text-gradient">المشغّل الصوتي</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="flex h-3 items-end gap-[3px]" aria-hidden>
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-[3px] origin-bottom rounded-full bg-primary animate-[soundbar_1s_ease-in-out_infinite]"
                          style={{
                            height: d === 1 ? 12 : 9,
                            animationDelay: `${d * 130}ms`,
                            animationPlayState: playing ? "running" : "paused",
                          }}
                        />
                      ))}
                    </span>
                    <span className="truncate">
                      {playing ? "يعمل الآن…" : tracks.length ? `${tracks.length} مقطوعات` : "جاهز للاستماع"}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  aria-label="إغلاق"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Now playing */}
              <div className="relative z-10 px-6 pb-2 pt-5">
                <div className="flex flex-col items-center">
                  <div className="relative h-44 w-44">
                    <div className="absolute -inset-6 rounded-full bg-primary/15 blur-2xl animate-glow" />
                    <div
                      className={`relative h-44 w-44 rounded-full shadow-[0_18px_44px_-12px_rgba(0,0,0,0.7)] ${
                        playing ? "animate-disc-spin" : ""
                      }`}
                    >
                      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0c0c10,#2b2b32,#0c0c10,#36363d,#0c0c10)]" />
                      <div className="absolute inset-2 rounded-full bg-[repeating-radial-gradient(circle_at_center,#000_0px,#000_2px,#1b1b20_3px,#000_4px)] opacity-80" />
                      <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a3a42,#101014_65%)]" />
                      <div className="absolute inset-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-[#0263D1]/80 shadow-[0_0_22px_rgba(3,234,188,0.8)]">
                        <Music className="h-6 w-6 text-zinc-950" />
                      </div>
                      <div className="absolute inset-[43%] rounded-full bg-black" />
                    </div>
                  </div>

                  <p className="mt-6 w-full truncate text-center text-sm font-bold text-foreground">
                    {current ? current.name : "لم يتم اختيار مقطوعة بعد"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {current ? "من جهازك • استكشف المجرّة أثناء الاستماع" : "أضف موسيقاك ثم استكشف المجرّة"}
                  </p>

                  {/* Seek */}
                  <input
                    type="range"
                    min={0}
                    max={Math.max(duration, 1)}
                    step={0.1}
                    value={Math.min(progress, Math.max(duration, 1))}
                    onChange={(e) => seek(Number(e.target.value))}
                    disabled={!current}
                    dir="ltr"
                    className="mt-4 w-full cursor-pointer accent-primary disabled:opacity-40"
                  />
                  <div dir="ltr" className="flex w-full justify-between text-[10px] tabular-nums text-muted-foreground">
                    <span>{fmt(progress)}</span>
                    <span>-{fmt(Math.max(duration - progress, 0))}</span>
                  </div>

                  {/* Controls */}
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => skip(-1)}
                      disabled={!tracks.length}
                      aria-label="السابق"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/10 hover:text-primary active:scale-90 disabled:opacity-30"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={stop}
                      disabled={!current}
                      aria-label="إيقاف"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-foreground transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30"
                    >
                      <Square className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={!current}
                      aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0bc9a9] text-zinc-950 shadow-[0_10px_30px_-8px_rgba(3,234,188,0.9)] transition-all hover:brightness-110 active:scale-90 disabled:opacity-40 disabled:shadow-none"
                    >
                      {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-[1px]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => skip(1)}
                      disabled={!tracks.length}
                      aria-label="التالي"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/10 hover:text-primary active:scale-90 disabled:opacity-30"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      aria-label="إضافة موسيقى"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-muted-foreground transition-all hover:bg-white/10 hover:text-primary active:scale-90"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Playlist */}
              <div className="relative z-10 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-4">
                <div className="flex items-center justify-between px-6 pb-2">
                  <h3 className="text-xs font-bold text-foreground">قائمة التشغيل</h3>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all hover:bg-primary/25 active:scale-95"
                  >
                    <Plus className="h-3 w-3" />
                    من الجهاز
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {!tracks.length ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                        <Music2 className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        قائمة التشغيل فارغة.
                        <br />
                        أضف أغانٍ من جهازك وابدأ الاستماع الآن.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-primary to-[#0bc9a9] px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_8px_24px_-8px_rgba(3,234,188,0.7)] transition-all hover:brightness-110 active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        إضافة موسيقى من الجهاز
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {tracks.map((t) => {
                        const active = t.id === currentId;
                        const grad = GRADS[Math.abs(t.name.split("").reduce((s, c) => s + c.charCodeAt(0), 0)) % GRADS.length];
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => playTrack(t.id)}
                              className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-right transition-all ${
                                active
                                  ? "border-primary/30 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                  : "border-transparent hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} shadow-lg`}>
                                {active && playing ? (
                                  <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
                                    {[0, 1, 2].map((d) => (
                                      <span
                                        key={d}
                                        className="w-[2.5px] origin-bottom rounded-full bg-white animate-[soundbar_0.9s_ease-in-out_infinite]"
                                        style={{ height: d === 1 ? 14 : 10, animationDelay: `${d * 120}ms` }}
                                      />
                                    ))}
                                  </span>
                                ) : (
                                  <Music2 className="h-4 w-4 text-white/90" />
                                )}
                              </div>
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.name}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground/70">
                                {active && playing ? "يعمل الآن" : "جاهز"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrack(t.id);
                                }}
                                aria-label={`حذف ${t.name}`}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});