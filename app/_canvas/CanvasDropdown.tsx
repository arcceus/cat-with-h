import { useCanvasStore } from '../../store/canvasStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Pin, PinOff, Layers, ChevronDown } from 'lucide-react';

export default function CanvasDropdown() {
  const {
    canvasesMeta,
    currentKey,
    setCurrentKey,
    deleteCanvas,
    renameCanvas,
    pinCanvas,
    unpinCanvas,
    createCanvas,
  } = useCanvasStore();
  const [search, setSearch] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside click handler
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Filter and sort
  const allKeys = Object.keys(canvasesMeta);
  const filteredKeys = allKeys.filter((key) =>
    canvasesMeta[key].name.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filteredKeys.filter((key) => canvasesMeta[key].pinned);
  const unpinned = filteredKeys.filter((key) => !canvasesMeta[key].pinned);

  // Handlers
  const handleCreate = () => {
    let n = 1;
    let name = `Canvas ${n}`;
    const names = Object.values(canvasesMeta).map(meta => meta.name);
    while (names.includes(name)) {
      n++;
      name = `Canvas ${n}`;
    }
    createCanvas(name, name);
  };
  const handleRename = (key: string) => {
    if (renameValue.trim()) {
      renameCanvas(key, renameValue.trim());
      setRenameId(null);
      setRenameValue('');
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        variant="outline"
        className="min-w-[180px] w-full justify-start flex items-center gap-2 rounded-lg border border-muted-foreground/20 bg-muted px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted/80 transition"
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="truncate flex-1 text-left">
          {canvasesMeta[currentKey]?.name || currentKey || 'Select Canvas'}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      <div
        className={`absolute left-0 w-full z-20 overflow-hidden bg-popover rounded-lg shadow-lg border border-muted-foreground/20 transition-all duration-200 ${open ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'} `}
        style={{top: '100%'}}
      >
        <div className="p-2">
          {/* New Canvas Button */}
          <Button
            onClick={handleCreate}
            className="w-full justify-start rounded-lg bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 h-8 text-sm gap-2 mb-2"
            variant="default"
          >
            <Plus className="h-4 w-4" /> New Canvas
          </Button>
          {/* Search Bar */}
          <Input
            className="w-full h-8 rounded-lg border border-muted-foreground/20 bg-muted px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition mb-2"
            placeholder="Search canvases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Pinned Canvases */}
          {pinned.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground font-semibold px-1 pt-2 pb-1">Pinned</div>
              {pinned.map((key) => {
                let clickTimeout: NodeJS.Timeout | null = null;
                return (
                  <div
                    key={key}
                    className={`group flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition-colors text-xs min-h-[32px] ${currentKey === key ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'}`}
                    onClick={e => {
                      // Prevent single click if double click is detected
                      if (clickTimeout) clearTimeout(clickTimeout);
                      clickTimeout = setTimeout(() => {
                        if (renameId !== key) {
                          setCurrentKey(key);
                          setOpen(false);
                        }
                      }, 200);
                    }}
                    onDoubleClick={e => {
                      if (clickTimeout) clearTimeout(clickTimeout);
                      setRenameId(key);
                      setRenameValue(canvasesMeta[key].name);
                    }}
                  >
                    {renameId === key ? (
                      <Input
                        className="h-7 text-xs"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        autoFocus
                        onBlur={() => handleRename(key)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(key)}
                      />
                    ) : (
                      <span
                        className="truncate flex-1 text-sm font-normal"
                      >
                        {canvasesMeta[key].name}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); unpinCanvas(key); }}>
                        <PinOff className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteCanvas(key); }}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Unpinned Canvases */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div className="text-xs text-muted-foreground font-semibold px-1 pt-2 pb-1">Others</div>}
              {unpinned.map((key) => {
                let clickTimeout: NodeJS.Timeout | null = null;
                return (
                  <div
                    key={key}
                    className={`group flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition-colors text-xs min-h-[32px] ${currentKey === key ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'}`}
                    onClick={e => {
                      if (clickTimeout) clearTimeout(clickTimeout);
                      clickTimeout = setTimeout(() => {
                        if (renameId !== key) {
                          setCurrentKey(key);
                          setOpen(false);
                        }
                      }, 200);
                    }}
                    onDoubleClick={e => {
                      if (clickTimeout) clearTimeout(clickTimeout);
                      setRenameId(key);
                      setRenameValue(canvasesMeta[key].name);
                    }}
                  >
                    {renameId === key ? (
                      <Input
                        className="h-7 text-xs"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        autoFocus
                        onBlur={() => handleRename(key)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(key)}
                      />
                    ) : (
                      <span
                        className="truncate flex-1 text-sm font-normal"
                      >
                        {canvasesMeta[key].name}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); pinCanvas(key); }}>
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteCanvas(key); }}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}