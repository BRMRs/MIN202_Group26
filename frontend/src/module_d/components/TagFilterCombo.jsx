import { useEffect, useMemo, useState } from 'react';

/**
 * Pills + inline input: click to toggle, type to narrow visible pills, Enter to add exact/first match.
 */
export function TagFilterCombo({ tags, selectedIds, onSelectedIdsChange, inputId, resetSignal }) {
  const [input, setInput] = useState('');

  useEffect(() => {
    setInput('');
  }, [resetSignal]);

  const visibleTags = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name && t.name.toLowerCase().includes(q));
  }, [tags, input]);

  const toggle = (id) => {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  };

  const tryAddFromInput = () => {
    const q = input.trim().toLowerCase();
    if (!q) return;
    const exact = tags.find((t) => t.name && t.name.toLowerCase() === q);
    if (exact) {
      if (!selectedIds.includes(exact.id)) onSelectedIdsChange([...selectedIds, exact.id]);
      setInput('');
      return;
    }
    const first = visibleTags[0];
    if (first && !selectedIds.includes(first.id)) {
      onSelectedIdsChange([...selectedIds, first.id]);
      setInput('');
    }
  };

  return (
    <div className="d-tag-combo" role="group" aria-label="Tags">
      <div className="d-tag-combo-inner">
        {visibleTags.map((t) => {
          const active = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={`d-pill-tag${active ? ' d-pill-tag-active' : ''}`}
              onClick={() => toggle(t.id)}
              aria-pressed={active}
            >
              {t.name}
            </button>
          );
        })}
        <input
          id={inputId}
          className="d-tag-combo-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              tryAddFromInput();
            }
          }}
          placeholder="Type to filter or add…"
          aria-label="Filter or add tags"
          autoComplete="off"
        />
      </div>
    </div>
  );
}

export default TagFilterCombo;
